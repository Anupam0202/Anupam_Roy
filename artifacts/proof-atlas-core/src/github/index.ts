/**
 * Repository Evidence Graph: input validation and normalization of public
 * GitHub REST responses. This module never claims a repository is secure,
 * healthy or vulnerability-free; it reports what was observed and what was not.
 */

export type RepoSection = "overview" | "readme" | "releases" | "manifests" | "languages" | "license";
export const ALL_SECTIONS: readonly RepoSection[] = ["overview", "readme", "releases", "manifests", "languages", "license"];

export type CoverageState = "observed" | "not_found" | "unsupported" | "provider_blocked" | "not_requested";

export interface RepoAnalyzeRequest {
  owner: string;
  repo: string;
  include?: RepoSection[];
}

export interface EvidenceItem {
  id: string;
  kind: "repository" | "readme" | "readme-heading" | "release" | "manifest" | "language" | "license";
  label: string;
  path?: string;
  url?: string;
  observedAt: string;
  detail?: string;
}

export interface RepoAnalyzeResponse {
  repository: {
    owner: string;
    name: string;
    defaultBranch?: string;
    description?: string;
    license?: { spdx?: string; name?: string };
    pushedAt?: string;
    url?: string;
    archived?: boolean;
    fork?: boolean;
  };
  evidence: EvidenceItem[];
  coverage: Record<string, CoverageState>;
  warnings: string[];
  source: { provider: "github"; fetchedAt: string; cache: "hit" | "miss" | "stale" };
}

const OWNER = /^[A-Za-z0-9](?:[A-Za-z0-9-]{0,38})$/;
const REPO = /^[A-Za-z0-9._-]{1,100}$/;

export type RepoInputResult = { ok: true; owner: string; repo: string } | { ok: false; message: string };

/**
 * Accepts `owner/repo` or a github.com repository URL and returns the identity
 * only. The URL is never fetched; it is just parsed.
 */
export function parseRepositoryInput(input: string): RepoInputResult {
  const value = input.trim().slice(0, 300);
  let path = value;
  if (/^(https?:\/\/)?(www\.)?github\.com\//i.test(value)) {
    try {
      const url = new URL(/^https?:/i.test(value) ? value : `https://${value}`);
      if (!/^(www\.)?github\.com$/i.test(url.hostname))
        return { ok: false, message: "Only github.com repository URLs are supported." };
      path = url.pathname.replace(/^\/+/, "");
    } catch {
      return { ok: false, message: "That GitHub URL could not be read." };
    }
  } else if (/^[a-z]+:\/\//i.test(value)) {
    return { ok: false, message: "Only github.com repository URLs are supported." };
  }
  const [owner, rawRepo] = path.split("/");
  const repo = rawRepo?.replace(/\.git$/i, "");
  if (!owner || !repo) return { ok: false, message: "Enter a repository as owner/repo, for example Anupam0202/NexusRAG." };
  if (!OWNER.test(owner) || owner.endsWith("-"))
    return { ok: false, message: "The owner name is not a valid GitHub user or organization name." };
  if (!REPO.test(repo) || repo === "." || repo === "..")
    return { ok: false, message: "The repository name contains characters GitHub does not allow." };
  return { ok: true, owner, repo };
}

export function normalizeSections(include: unknown): RepoSection[] {
  if (!Array.isArray(include) || !include.length) return [...ALL_SECTIONS];
  const set = new Set(include.filter((s): s is RepoSection => (ALL_SECTIONS as readonly string[]).includes(s as string)));
  set.add("overview");
  return ALL_SECTIONS.filter((s) => set.has(s));
}

/** The fixed set of GitHub REST paths a repository analysis may call (at most 5). */
export function plannedRequests(owner: string, repo: string, sections: readonly RepoSection[]) {
  const base = `/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}`;
  const requests: Array<{ section: RepoSection; path: string }> = [{ section: "overview", path: base }];
  if (sections.includes("readme")) requests.push({ section: "readme", path: `${base}/readme` });
  if (sections.includes("releases")) requests.push({ section: "releases", path: `${base}/releases?per_page=5` });
  if (sections.includes("languages")) requests.push({ section: "languages", path: `${base}/languages` });
  if (sections.includes("manifests")) requests.push({ section: "manifests", path: `${base}/contents` });
  return requests;
}

/** Manifest files recognized at the repository root. Presence only; contents are not parsed. */
export const MANIFESTS: Record<string, string> = {
  "package.json": "npm package manifest",
  "package-lock.json": "npm lockfile",
  "pnpm-lock.yaml": "pnpm lockfile",
  "pnpm-workspace.yaml": "pnpm workspace",
  "yarn.lock": "Yarn lockfile",
  "pyproject.toml": "Python project (PEP 621)",
  "requirements.txt": "Python requirements",
  "Pipfile": "Pipenv manifest",
  "setup.py": "Python setup script",
  "environment.yml": "Conda environment",
  "go.mod": "Go module",
  "Cargo.toml": "Rust crate",
  "pom.xml": "Maven project",
  "build.gradle": "Gradle build",
  "build.gradle.kts": "Gradle build (Kotlin)",
  "Gemfile": "Ruby Gemfile",
  "composer.json": "PHP Composer",
  "Dockerfile": "Container build",
  "docker-compose.yml": "Compose services",
  "Makefile": "Make targets",
};

export type SectionPayload =
  | { state: "ok"; status: number; json: unknown }
  | { state: "not_found" }
  | { state: "blocked"; reason: string }
  | { state: "not_requested" };

const str = (v: unknown) => (typeof v === "string" && v.trim() ? v.trim() : undefined);

export function decodeBase64Utf8(b64: string): string {
  const binary = atob(b64.replace(/\s+/g, ""));
  const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

/** Only this much of a README, and only heading lines up to this length, are parsed. README text is untrusted. */
const README_SCAN_CHARS = 64 * 1024;
const HEADING_LINE_MAX = 500;

/** Level and text of an ATX heading of level 1–3, parsed without backtracking regexes. */
function atxHeading(line: string): { level: number; text: string } | null {
  const open = /^(#{1,3})[ \t]+/.exec(line);
  if (!open) return null;
  let text = line.slice(open[0].length).trimEnd();
  // Optional closing sequence: a run of # preceded by a space or tab (CommonMark).
  let end = text.length;
  while (end > 0 && text[end - 1] === "#") end -= 1;
  if (end === 0) text = "";
  else if (end < text.length && (text[end - 1] === " " || text[end - 1] === "\t")) text = text.slice(0, end).trimEnd();
  return { level: open[1].length, text };
}

export function readmeHeadings(markdown: string, max = 12): string[] {
  const headings: string[] = [];
  let fenced = false;
  for (const line of markdown.slice(0, README_SCAN_CHARS).split(/\r\n?|\n/)) {
    if (/^[ \t]*(```|~~~)/.test(line)) fenced = !fenced;
    if (fenced || line.length > HEADING_LINE_MAX) continue;
    const heading = atxHeading(line);
    if (heading) {
      const text = heading.text
        .replace(/!\[[^\]]*\]\([^)]*\)/g, "")
        .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
        .replace(/[*_`<>]/g, "")
        .trim();
      if (text) headings.push(`${"#".repeat(heading.level)} ${text}`.slice(0, 120));
    }
    if (headings.length >= max) break;
  }
  return headings;
}

const safeGithubUrl = (value: unknown): string | undefined => {
  const s = str(value);
  if (!s) return undefined;
  try {
    const url = new URL(s);
    return url.protocol === "https:" && /^(github\.com|raw\.githubusercontent\.com)$/.test(url.hostname) ? url.toString() : undefined;
  } catch {
    return undefined;
  }
};

export function normalizeRepository(input: {
  owner: string;
  repo: string;
  sections: readonly RepoSection[];
  payloads: Partial<Record<RepoSection, SectionPayload>>;
  fetchedAt: string;
  cache: "hit" | "miss" | "stale";
}): RepoAnalyzeResponse {
  const { owner, repo, sections, payloads, fetchedAt } = input;
  const evidence: EvidenceItem[] = [];
  const warnings: string[] = [];
  const coverage: Record<string, CoverageState> = {};
  const stateOf = (section: RepoSection): CoverageState => {
    if (!sections.includes(section)) return "not_requested";
    const p = payloads[section];
    if (!p || p.state === "not_requested") return "not_requested";
    if (p.state === "blocked") return "provider_blocked";
    if (p.state === "not_found") return "not_found";
    return "observed";
  };

  const overview = payloads.overview;
  const meta = overview?.state === "ok" ? ((overview.json ?? {}) as Record<string, unknown>) : {};
  const licenseMeta = (meta.license ?? null) as Record<string, unknown> | null;
  const repository: RepoAnalyzeResponse["repository"] = {
    owner: str((meta.owner as Record<string, unknown> | undefined)?.login) ?? owner,
    name: str(meta.name) ?? repo,
    defaultBranch: str(meta.default_branch),
    description: str(meta.description)?.slice(0, 500),
    pushedAt: str(meta.pushed_at),
    url: safeGithubUrl(meta.html_url),
    archived: typeof meta.archived === "boolean" ? meta.archived : undefined,
    fork: typeof meta.fork === "boolean" ? meta.fork : undefined,
  };
  coverage.overview = stateOf("overview");
  if (coverage.overview === "observed") {
    evidence.push({
      id: "repository",
      kind: "repository",
      label: `${repository.owner}/${repository.name}`,
      url: repository.url,
      observedAt: fetchedAt,
      detail: repository.defaultBranch ? `Default branch ${repository.defaultBranch}` : undefined,
    });
    if (repository.archived) warnings.push("The repository is archived (read-only).");
    if (repository.fork) warnings.push("The repository is a fork; its evidence may come from upstream work.");
    if (`${repository.owner}/${repository.name}`.toLowerCase() !== `${owner}/${repo}`.toLowerCase())
      warnings.push(`GitHub redirected ${owner}/${repo} to ${repository.owner}/${repository.name}.`);
  }

  // License comes from the overview payload; no extra request.
  if (!sections.includes("license")) coverage.license = "not_requested";
  else if (coverage.overview !== "observed") coverage.license = coverage.overview;
  else if (licenseMeta && str(licenseMeta.spdx_id) && licenseMeta.spdx_id !== "NOASSERTION") {
    repository.license = { spdx: str(licenseMeta.spdx_id), name: str(licenseMeta.name) };
    coverage.license = "observed";
    evidence.push({ id: "license", kind: "license", label: `Licence: ${repository.license.spdx}`, observedAt: fetchedAt, detail: repository.license.name });
  } else if (licenseMeta) {
    repository.license = { name: str(licenseMeta.name) };
    coverage.license = "observed";
    warnings.push("GitHub could not match the licence to a standard SPDX identifier.");
    evidence.push({ id: "license", kind: "license", label: "Licence file present (not a recognised SPDX licence)", observedAt: fetchedAt });
  } else {
    coverage.license = "not_found";
    warnings.push("No licence was detected. Without one, reuse rights are not granted by default.");
  }

  coverage.readme = stateOf("readme");
  const readme = payloads.readme;
  if (readme?.state === "ok") {
    const r = readme.json as Record<string, unknown>;
    const path = str(r.path) ?? "README";
    evidence.push({ id: `readme:${path}`, kind: "readme", label: path, path, url: safeGithubUrl(r.html_url), observedAt: fetchedAt });
    if (r.encoding === "base64" && typeof r.content === "string") {
      try {
        readmeHeadings(decodeBase64Utf8(r.content)).forEach((h, i) =>
          evidence.push({ id: `readme-heading:${i}`, kind: "readme-heading", label: h, path, url: safeGithubUrl(r.html_url), observedAt: fetchedAt }),
        );
      } catch {
        warnings.push("The README could not be decoded; only its location is shown.");
      }
    }
  }

  coverage.releases = stateOf("releases");
  const releases = payloads.releases;
  if (releases?.state === "ok") {
    const list = Array.isArray(releases.json) ? (releases.json as Array<Record<string, unknown>>) : [];
    if (!list.length) coverage.releases = "not_found";
    list.slice(0, 5).forEach((rel) => {
      const tag = str(rel.tag_name) ?? "untagged";
      evidence.push({
        id: `release:${tag}`,
        kind: "release",
        label: str(rel.name) ?? tag,
        url: safeGithubUrl(rel.html_url),
        observedAt: fetchedAt,
        detail: [tag, str(rel.published_at)?.slice(0, 10), rel.prerelease ? "pre-release" : undefined].filter(Boolean).join(" · "),
      });
    });
  }

  coverage.languages = stateOf("languages");
  const languages = payloads.languages;
  if (languages?.state === "ok") {
    const entries = Object.entries((languages.json ?? {}) as Record<string, unknown>).filter(
      (e): e is [string, number] => typeof e[1] === "number" && e[1] > 0,
    );
    const total = entries.reduce((s, [, n]) => s + n, 0);
    if (!entries.length) coverage.languages = "not_found";
    entries
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .forEach(([lang, bytes]) =>
        evidence.push({ id: `language:${lang}`, kind: "language", label: lang, observedAt: fetchedAt, detail: `${((bytes / total) * 100).toFixed(1)}% of detected code bytes` }),
      );
  }

  coverage.manifests = stateOf("manifests");
  const contents = payloads.manifests;
  if (contents?.state === "ok") {
    const files = Array.isArray(contents.json) ? (contents.json as Array<Record<string, unknown>>) : [];
    const found = files.filter((f) => f.type === "file" && typeof f.name === "string" && f.name in MANIFESTS);
    if (!found.length) coverage.manifests = "not_found";
    found.forEach((f) =>
      evidence.push({
        id: `manifest:${String(f.path ?? f.name)}`,
        kind: "manifest",
        label: String(f.name),
        path: String(f.path ?? f.name),
        url: safeGithubUrl(f.html_url),
        observedAt: fetchedAt,
        detail: MANIFESTS[String(f.name)],
      }),
    );
  }

  // Declared dependencies are a separate, visitor-initiated step (/api/repository/dependencies).
  // Vulnerability analysis is out of scope: declared ranges are not installed versions.
  coverage.dependencies = "not_requested";
  coverage.vulnerabilities = "unsupported";
  for (const [section, state] of Object.entries(coverage))
    if (state === "provider_blocked") warnings.push(`GitHub did not return ${section} data (rate limit or provider error); it was not inspected.`);

  return { repository, evidence, coverage, warnings, source: { provider: "github", fetchedAt, cache: input.cache } };
}

export interface GraphNode {
  id: string;
  label: string;
  kind: EvidenceItem["kind"] | "group";
}

export function evidenceGraph(response: RepoAnalyzeResponse): { nodes: GraphNode[]; edges: Array<{ from: string; to: string }> } {
  const nodes: GraphNode[] = [{ id: "repository", label: `${response.repository.owner}/${response.repository.name}`, kind: "repository" }];
  const edges: Array<{ from: string; to: string }> = [];
  const groups: Record<string, string> = { readme: "Documentation", "readme-heading": "Documentation", release: "Releases", manifest: "Manifests", language: "Languages", license: "Licence" };
  const readmeId = response.evidence.find((e) => e.kind === "readme")?.id;
  for (const item of response.evidence) {
    if (item.kind === "repository") continue;
    const group = groups[item.kind];
    const groupId = `group:${group}`;
    if (!nodes.some((n) => n.id === groupId)) {
      nodes.push({ id: groupId, label: group, kind: "group" });
      edges.push({ from: "repository", to: groupId });
    }
    nodes.push({ id: item.id, label: item.label, kind: item.kind });
    // README headings hang off the README itself; everything else off its group.
    const parent = item.kind === "readme-heading" && readmeId ? readmeId : groupId;
    edges.push({ from: parent, to: item.id });
  }
  return { nodes, edges };
}

const csvCell = (v: string | undefined) => {
  const s = (v ?? "").replace(/^([=+\-@\t\r])/, "'$1");
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

export function evidenceToCsv(response: RepoAnalyzeResponse): string {
  const rows = [["id", "kind", "label", "path", "url", "detail", "observedAt"]];
  for (const e of response.evidence) rows.push([e.id, e.kind, e.label, e.path ?? "", e.url ?? "", e.detail ?? "", e.observedAt]);
  return rows.map((r) => r.map(csvCell).join(",")).join("\n") + "\n";
}

/** Spec "Operational constraints": the normalized repository response stays under about 512 KiB. */
export const MAX_RESPONSE_BYTES = 512 * 1024;

const jsonBytes = (value: unknown) => new TextEncoder().encode(JSON.stringify(value)).length;

/**
 * Drops evidence items from the end (README headings, manifests, releases and
 * languages come after the repository item) until the response fits, and says so.
 */
export function capResponseSize(response: RepoAnalyzeResponse, maxBytes = MAX_RESPONSE_BYTES): RepoAnalyzeResponse {
  let total = jsonBytes(response);
  if (total <= maxBytes) return response;
  const warning = `Some evidence was left out to keep this response under ${Math.round(maxBytes / 1024)} KiB.`;
  const evidence = [...response.evidence];
  total += jsonBytes(warning) + 1;
  while (total > maxBytes && evidence.length > 1) total -= jsonBytes(evidence.pop()) + 1;
  return { ...response, evidence, warnings: [...response.warnings, warning] };
}
