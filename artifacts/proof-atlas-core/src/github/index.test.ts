import { describe, expect, it } from "vitest";
import {
  evidenceGraph,
  evidenceToCsv,
  normalizeRepository,
  normalizeSections,
  parseRepositoryInput,
  plannedRequests,
  readmeHeadings,
  capResponseSize,
} from "./index";

const FETCHED = "2026-10-25T00:00:00.000Z";
const b64 = (s: string) => Buffer.from(s, "utf8").toString("base64");

describe("parseRepositoryInput", () => {
  it.each([
    ["Anupam0202/NexusRAG", "Anupam0202", "NexusRAG"],
    ["  https://github.com/Anupam0202/NexusRAG  ", "Anupam0202", "NexusRAG"],
    ["github.com/withastro/astro.git", "withastro", "astro"],
    ["https://github.com/a-b/c.d_e/tree/main/src", "a-b", "c.d_e"],
  ])("accepts %s", (input, owner, repo) => {
    expect(parseRepositoryInput(input)).toEqual({ ok: true, owner, repo });
  });

  it.each([
    "",
    "justone",
    "https://gitlab.com/a/b",
    "https://evil.example/github.com/a/b",
    "http://169.254.169.254/latest",
    "-bad/repo",
    "bad-/repo",
    "owner/..",
    "own er/repo",
    "owner/re po",
    "ftp://github.com/a/b",
  ])("rejects %j", (input) => {
    expect(parseRepositoryInput(input).ok).toBe(false);
  });
});

describe("request planning", () => {
  it("always includes overview and caps calls at five", () => {
    expect(normalizeSections(["readme", "nonsense"])).toEqual(["overview", "readme"]);
    expect(normalizeSections(undefined)).toHaveLength(6);
    const plan = plannedRequests("a", "b", normalizeSections(undefined));
    expect(plan.map((p) => p.path)).toEqual([
      "/repos/a/b",
      "/repos/a/b/readme",
      "/repos/a/b/releases?per_page=5",
      "/repos/a/b/languages",
      "/repos/a/b/contents",
    ]);
  });
});

describe("readmeHeadings", () => {
  it("extracts top-level headings and ignores fenced code", () => {
    const md = "# Title\n\ntext\n```\n# not a heading\n```\n## Setup [docs](x)\n#### too deep\n### `Run` it ##";
    expect(readmeHeadings(md)).toEqual(["# Title", "## Setup docs", "### Run it"]);
  });

  it("follows CommonMark closing sequences and line endings", () => {
    expect(readmeHeadings("# C#\r## Notes ##\r\n### #\n#NoSpace")).toEqual(["# C#", "## Notes"]);
  });

  it("stays fast on hostile README text", () => {
    const hostile = ["# a" + " ".repeat(100_000) + "x", "# " + "![".repeat(64_000), "## b" + " ".repeat(400) + "\u2028y", "\n".repeat(200_000)];
    for (const md of hostile) {
      const t = performance.now();
      readmeHeadings(md);
      expect(performance.now() - t).toBeLessThan(250);
    }
  });
});

describe("normalizeRepository", () => {
  const sections = normalizeSections(undefined);
  const full = normalizeRepository({
    owner: "Anupam0202",
    repo: "NexusRAG",
    sections,
    fetchedAt: FETCHED,
    cache: "miss",
    payloads: {
      overview: {
        state: "ok",
        status: 200,
        json: {
          name: "NexusRAG",
          owner: { login: "Anupam0202" },
          default_branch: "main",
          description: "RAG platform",
          pushed_at: "2026-10-07T21:32:00Z",
          html_url: "https://github.com/Anupam0202/NexusRAG",
          license: { spdx_id: "MIT", name: "MIT License" },
          archived: false,
          fork: false,
        },
      },
      readme: { state: "ok", status: 200, json: { path: "README.md", html_url: "https://github.com/Anupam0202/NexusRAG/blob/main/README.md", encoding: "base64", content: b64("# NexusRAG\n## Runtime scope") } },
      releases: { state: "ok", status: 200, json: [] },
      languages: { state: "ok", status: 200, json: { TypeScript: 750, Python: 250 } },
      manifests: {
        state: "ok",
        status: 200,
        json: [
          { type: "file", name: "package.json", path: "package.json", html_url: "https://github.com/Anupam0202/NexusRAG/blob/main/package.json" },
          { type: "dir", name: "backend", path: "backend" },
          { type: "file", name: "Makefile", path: "Makefile", html_url: "javascript:alert(1)" },
        ],
      },
    },
  });

  it("maps identity, license and evidence", () => {
    expect(full.repository).toMatchObject({ owner: "Anupam0202", name: "NexusRAG", defaultBranch: "main", license: { spdx: "MIT" } });
    expect(full.evidence.map((e) => e.id)).toEqual([
      "repository",
      "license",
      "readme:README.md",
      "readme-heading:0",
      "readme-heading:1",
      "language:TypeScript",
      "language:Python",
      "manifest:package.json",
      "manifest:Makefile",
    ]);
    expect(full.evidence.find((e) => e.id === "language:TypeScript")?.detail).toBe("75.0% of detected code bytes");
  });

  it("drops non-GitHub URLs from provider data", () => {
    expect(full.evidence.find((e) => e.id === "manifest:Makefile")?.url).toBeUndefined();
  });

  it("reports coverage honestly and never claims security", () => {
    expect(full.coverage).toEqual({
      overview: "observed",
      license: "observed",
      readme: "observed",
      releases: "not_found",
      languages: "observed",
      manifests: "observed",
      dependencies: "not_requested",
      vulnerabilities: "unsupported",
    });
    expect(JSON.stringify(full)).not.toMatch(/\b(secure|safe|healthy|no vulnerabilities)\b/i);
  });

  it("marks blocked and unrequested sections", () => {
    const partial = normalizeRepository({
      owner: "a",
      repo: "b",
      sections: ["overview", "readme"],
      fetchedAt: FETCHED,
      cache: "miss",
      payloads: { overview: { state: "ok", status: 200, json: { name: "b", owner: { login: "a" } } }, readme: { state: "blocked", reason: "rate limited" } },
    });
    expect(partial.coverage).toMatchObject({ readme: "provider_blocked", releases: "not_requested", license: "not_requested" });
    expect(partial.warnings.join(" ")).toMatch(/did not return readme/);
  });

  it("warns when no license is present", () => {
    const out = normalizeRepository({
      owner: "a",
      repo: "b",
      sections: ["overview", "license"],
      fetchedAt: FETCHED,
      cache: "hit",
      payloads: { overview: { state: "ok", status: 200, json: { name: "b", owner: { login: "a" }, license: null } } },
    });
    expect(out.coverage.license).toBe("not_found");
    expect(out.warnings[0]).toMatch(/No licence/);
  });

  it("builds a graph rooted at the repository and a safe CSV", () => {
    const graph = evidenceGraph(full);
    expect(graph.nodes[0].id).toBe("repository");
    expect(graph.edges).toContainEqual({ from: "readme:README.md", to: "readme-heading:0" });
    expect(graph.edges).toContainEqual({ from: "repository", to: "group:Manifests" });
    const csv = evidenceToCsv({ ...full, evidence: [{ id: "x", kind: "manifest", label: "=HYPERLINK(1)", observedAt: FETCHED, detail: 'a "b", c' }] });
    expect(csv).toContain("'=HYPERLINK(1)");
    expect(csv).toContain('"a ""b"", c"');
  });
});

describe("capResponseSize", () => {
  it("drops trailing evidence to stay under the cap and says so", () => {
    const base = normalizeRepository({ owner: "o", repo: "r", sections: ["overview"], payloads: { overview: { state: "ok", status: 200, json: { name: "r", owner: { login: "o" } } } }, fetchedAt: "2026-10-25T00:00:00.000Z", cache: "miss" });
    const big = { ...base, evidence: Array.from({ length: 400 }, (_, i) => ({ id: `e${i}`, kind: "manifest" as const, label: "x".repeat(100), observedAt: "t" })) };
    const capped = capResponseSize(big, 20_000);
    expect(new TextEncoder().encode(JSON.stringify(capped)).length).toBeLessThanOrEqual(20_000);
    expect(capped.evidence[0].id).toBe("e0");
    expect(capped.warnings.at(-1)).toMatch(/left out/);
    expect(capResponseSize(base)).toBe(base);
  });
});
