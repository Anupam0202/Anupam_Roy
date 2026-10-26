import { describe, expect, it } from "vitest";
import {
  buildDependencyReport,
  dependenciesToCsv,
  isValidPackageName,
  MAX_DEPENDENCIES,
  MAX_PARSED_PER_MANIFEST,
  normalizeNpmLatest,
  normalizePypiName,
  normalizePypiProject,
  parsePackageJson,
  parsePyprojectToml,
  parseRequirement,
  parseRequirementsTxt,
  registryUrl,
  safeSourceUrl,
} from "./dependencies";

const AT = "2026-10-25T12:00:00.000Z";

describe("package names", () => {
  it("validates npm and PyPI names", () => {
    expect(isValidPackageName("npm", "@types/node")).toBe(true);
    expect(isValidPackageName("npm", "astro")).toBe(true);
    expect(isValidPackageName("npm", "Bad Name")).toBe(false);
    expect(isValidPackageName("npm", "../etc/passwd")).toBe(false);
    expect(isValidPackageName("pypi", "google_generativeai")).toBe(true);
    expect(isValidPackageName("pypi", "-bad")).toBe(false);
    expect(isValidPackageName("pypi", "a/b")).toBe(false);
  });

  it("normalizes PyPI names per PEP 503", () => {
    expect(normalizePypiName("Google_Generative.AI")).toBe("google-generative-ai");
  });

  it("builds registry URLs only from valid names", () => {
    expect(registryUrl("npm", "@types/node")).toBe("https://registry.npmjs.org/@types%2fnode/latest");
    expect(registryUrl("pypi", "FastAPI")).toBe("https://pypi.org/pypi/fastapi/json");
    expect(() => registryUrl("npm", "https://evil.example/x")).toThrow();
  });
});

describe("parsePackageJson", () => {
  it("reads every dependency block with its scope and flags local references", () => {
    const deps = parsePackageJson(
      JSON.stringify({
        dependencies: { astro: "7.4.1", "@workspace/core": "workspace:*", lib: "github:user/lib" },
        devDependencies: { vitest: "^3.2.4" },
        peerDependencies: { react: "^19" },
        optionalDependencies: { fsevents: "*" },
        scripts: { build: "x" },
      }),
    );
    expect(deps.map((d) => `${d.scope}:${d.name}@${d.spec}${d.local ? " (local)" : ""}`)).toEqual([
      "runtime:astro@7.4.1",
      "runtime:@workspace/core@workspace:* (local)",
      "runtime:lib@github:user/lib (local)",
      "dev:vitest@^3.2.4",
      "peer:react@^19",
      "optional:fsevents@*",
    ]);
  });

  it("skips invalid names and rejects invalid JSON", () => {
    expect(parsePackageJson('{"dependencies":{"Bad Name":"1"}}')).toEqual([]);
    expect(() => parsePackageJson("{nope")).toThrow();
  });
});

describe("parseRequirementsTxt", () => {
  it("parses PEP 508 requirements and ignores options, URLs and comments", () => {
    const deps = parseRequirementsTxt(
      [
        "# runtime",
        "FastAPI==0.115.0  # pinned",
        "uvicorn[standard]>=0.30",
        "pydantic_settings ; python_version >= '3.9'",
        "-r dev.txt",
        "-e .",
        "--index-url https://example.org/simple",
        "git+https://github.com/x/y.git",
        "./local-package",
        "mypkg @ https://example.org/mypkg.whl",
        "",
      ].join("\n"),
    );
    expect(deps.map((d) => [d.name, d.spec, d.local])).toEqual([
      ["fastapi", "==0.115.0", false],
      ["uvicorn", ">=0.30", false],
      ["pydantic-settings", "; python_version >= '3.9'", false],
      ["mypkg", "@ https://example.org/mypkg.whl", true],
    ]);
  });
});

describe("parsePyprojectToml", () => {
  it("reads PEP 621, optional, dependency groups and Poetry tables", () => {
    const toml = `
[project]
name = "demo"
dependencies = [
  "httpx>=0.27",   # client
  'rich',
  "numpy[extra]; python_version>='3.10'",
]

[project.optional-dependencies]
docs = ["mkdocs>=1.6"]

[dependency-groups]
test = ["pytest>=8"]

[tool.poetry.dependencies]
python = "^3.11"
requests = "^2.32"
local-lib = { path = "../lib" }

[tool.poetry.group.dev.dependencies]
black = "24.4.0"
`;
    const deps = parsePyprojectToml(toml);
    expect(deps.map((d) => `${d.scope}:${d.name}:${d.spec}${d.local ? ":local" : ""}`)).toEqual([
      "runtime:httpx:>=0.27",
      "runtime:rich:",
      "runtime:numpy:; python_version>='3.10'",
      "optional:mkdocs:>=1.6",
      "dev:pytest:>=8",
      "runtime:requests:^2.32",
      'runtime:local-lib:{ path = "../lib" }:local',
      "dev:black:24.4.0",
    ]);
  });
});

describe("buildDependencyReport", () => {
  it("combines manifests deterministically and never claims vulnerability status", () => {
    const report = buildDependencyReport({
      owner: "octo",
      repo: "demo",
      manifests: [
        { path: "requirements.txt", state: "observed", text: "b==1\na==2\n" },
        { path: "package.json", state: "observed", text: '{"devDependencies":{"z":"1"},"dependencies":{"y":"1"}}' },
        { path: "pyproject.toml", state: "not_found" },
      ],
      fetchedAt: AT,
      cache: "miss",
    });
    expect(report.dependencies.map((d) => `${d.manifest}:${d.name}`)).toEqual(["package.json:y", "package.json:z", "requirements.txt:a", "requirements.txt:b"]);
    expect(report.manifests.map((m) => [m.path, m.state, m.count])).toEqual([
      ["requirements.txt", "observed", 2],
      ["package.json", "observed", 2],
      ["pyproject.toml", "not_found", 0],
    ]);
    expect(report.coverage).toEqual({ dependencies: "observed", vulnerabilities: "unsupported" });
    expect(report.notes.join(" ")).toMatch(/not installed versions/);
  });

  it("marks unreadable manifests and reports provider problems", () => {
    const report = buildDependencyReport({
      owner: "o",
      repo: "r",
      manifests: [
        { path: "package.json", state: "observed", text: "{broken" },
        { path: "requirements.txt", state: "provider_blocked" },
      ],
      fetchedAt: AT,
      cache: "miss",
    });
    expect(report.manifests.map((m) => m.state)).toEqual(["parse_error", "provider_blocked"]);
    expect(report.coverage.dependencies).toBe("provider_blocked");
  });

  it("exports CSV with formula injection neutralised", () => {
    const report = buildDependencyReport({ owner: "o", repo: "r", manifests: [{ path: "package.json", state: "observed", text: '{"dependencies":{"x":"=cmd|calc"}}' }], fetchedAt: AT, cache: "miss" });
    expect(dependenciesToCsv(report)).toContain("'=cmd|calc");
  });
});

describe("registry metadata", () => {
  it("normalizes an npm latest document, including deprecation", () => {
    const meta = normalizeNpmLatest(
      {
        name: "request",
        version: "2.88.2",
        license: "Apache-2.0",
        deprecated: "request has been deprecated, see https://github.com/request/request/issues/3142",
        description: "Simplified HTTP request client.",
        repository: { url: "git+https://github.com/request/request.git", type: "git" },
      },
      AT,
    );
    expect(meta).toMatchObject({
      ecosystem: "npm",
      name: "request",
      latestVersion: "2.88.2",
      license: "Apache-2.0",
      registryUrl: "https://www.npmjs.com/package/request",
      sourceUrl: "https://github.com/request/request",
    });
    expect(meta.deprecated).toMatch(/^request has been deprecated/);
  });

  it("normalizes a PyPI project without its release history", () => {
    const meta = normalizePypiProject(
      {
        info: {
          name: "google-generativeai",
          version: "0.8.6",
          license: "Apache 2.0",
          license_expression: null,
          summary: "Google Generative AI High level API client library and tools.",
          requires_python: ">=3.9",
          yanked: false,
          project_urls: { Homepage: "https://github.com/google/generative-ai-python" },
          classifiers: ["License :: OSI Approved :: Apache Software License"],
        },
        urls: [{ upload_time_iso_8601: "2025-12-16T17:53:58.610776Z" }],
        releases: { "0.1.0": [] },
      },
      AT,
    );
    expect(meta).toMatchObject({
      name: "google-generativeai",
      latestVersion: "0.8.6",
      license: "Apache 2.0",
      requiresPython: ">=3.9",
      latestReleasedAt: "2025-12-16T17:53:58.610776Z",
      registryUrl: "https://pypi.org/project/google-generativeai/",
      sourceUrl: "https://github.com/google/generative-ai-python",
    });
    expect(meta.deprecated).toBeUndefined();
  });

  it("prefers licence expressions and ignores pasted licence texts", () => {
    const long = "Permission is hereby granted ".repeat(10);
    expect(normalizePypiProject({ info: { name: "a", license_expression: "MIT", license: long } }, AT).license).toBe("MIT");
    expect(normalizePypiProject({ info: { name: "a", license: long, classifiers: ["License :: OSI Approved :: BSD License"] } }, AT).license).toBe("BSD License");
    expect(normalizePypiProject({ info: { name: "a", yanked: true, yanked_reason: "broken wheel" } }, AT).deprecated).toBe("yanked: broken wheel");
  });

  it("keeps only https links to known code hosts", () => {
    expect(safeSourceUrl("git+ssh://git@github.com/a/b.git")).toBe("https://github.com/a/b");
    expect(safeSourceUrl("git://github.com/a/b.git")).toBe("https://github.com/a/b");
    expect(safeSourceUrl("https://evil.example/a")).toBeUndefined();
    expect(safeSourceUrl("javascript:alert(1)")).toBeUndefined();
  });
});

describe("hostile manifests", () => {
  const fast = (run: () => unknown) => {
    const t = performance.now();
    run();
    expect(performance.now() - t).toBeLessThan(250);
  };

  it("parses requirements in linear time, whatever the line endings", () => {
    fast(() => expect(parseRequirement("a" + " ".repeat(100_000) + "x\ry")?.name).toBe("a"));
    fast(() => parseRequirement("a" + " ".repeat(100_000) + "x\u2028y"));
    fast(() => parseRequirementsTxt(" #".repeat(200_000) + "\u2028"));
    expect(parseRequirementsTxt("flask>=3\rrequests  # http\rnumpy").map((d) => [d.name, d.spec])).toEqual([
      ["flask", ">=3"],
      ["requests", ""],
      ["numpy", ""],
    ]);
  });

  it("parses pyproject.toml in linear time", () => {
    fast(() => parsePyprojectToml("[tool.poetry.dependencies]\n" + "\n".repeat(200_000) + "x"));
    fast(() => parsePyprojectToml("[dependency-groups]\n" + "a = [\n".repeat(50_000)));
    fast(() => parsePyprojectToml('[project]\ndependencies = ["' + '\\"'.repeat(200_000)));
    fast(() => parsePyprojectToml("[tool.poetry.dependencies]\nrequests = ^2" + " ".repeat(200_000) + "x"));
  });

  it("bounds what one manifest contributes", () => {
    const text = Array.from({ length: 50_000 }, (_, i) => `pkg${i}>=1`).join("\n");
    expect(parseRequirementsTxt(text)).toHaveLength(MAX_PARSED_PER_MANIFEST);
    const report = buildDependencyReport({
      owner: "o",
      repo: "r",
      manifests: [{ path: "requirements.txt", state: "observed", text }],
      fetchedAt: AT,
      cache: "miss",
    });
    expect(report.dependencies).toHaveLength(MAX_DEPENDENCIES);
    expect(report.truncated).toBe(true);
  });
});

describe("legacy npm names", () => {
  it("accepts unscoped names with capitals for parsing and lookup", () => {
    expect(isValidPackageName("npm", "JSONStream")).toBe(true);
    expect(isValidPackageName("npm", "@Scope/pkg")).toBe(false);
    expect(parsePackageJson(JSON.stringify({ dependencies: { JSONStream: "^1.3.5" } })).map((d) => d.name)).toEqual(["JSONStream"]);
    expect(registryUrl("npm", "JSONStream")).toBe("https://registry.npmjs.org/JSONStream/latest");
  });
});
