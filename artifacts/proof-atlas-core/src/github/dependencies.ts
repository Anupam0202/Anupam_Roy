/**
 * Declared dependencies from a repository's root manifests, and normalized
 * registry metadata for one selected package at a time.
 *
 * Declared ranges are not installed versions, so nothing here says whether a
 * dependency is vulnerable; that is reported as not inspected.
 */

export type Ecosystem = "npm" | "pypi";
export type DependencyScope = "runtime" | "dev" | "peer" | "optional";

/** Root files read for dependency evidence, in display order. */
export const DEPENDENCY_MANIFESTS: Record<string, Ecosystem> = {
  "package.json": "npm",
  "pyproject.toml": "pypi",
  "requirements.txt": "pypi",
};

export const MAX_DEPENDENCIES = 300;

/** At most this many entries are kept from one manifest. */
export const MAX_PARSED_PER_MANIFEST = 1000;

export interface DeclaredDependency {
  ecosystem: Ecosystem;
  name: string;
  /** Version range or marker exactly as declared (trimmed). */
  spec: string;
  scope: DependencyScope;
  manifest: string;
  /** True for workspace:, file:, link:, git or URL references (not registry packages). */
  local: boolean;
}

/** Scopes are lower case; legacy unscoped names may contain capitals (for example JSONStream). */
const NPM_NAME = /^(@[a-z0-9-~][a-z0-9-._~]*\/)?[A-Za-z0-9-~][A-Za-z0-9-._~]*$/;
const PYPI_NAME = /^[A-Za-z0-9]([A-Za-z0-9._-]*[A-Za-z0-9])?$/;

export function isValidPackageName(ecosystem: Ecosystem, name: string): boolean {
  if (!name || name.length > 214) return false;
  return ecosystem === "npm" ? NPM_NAME.test(name) : PYPI_NAME.test(name);
}

/** PEP 503 normalized name: lower case, runs of - _ . become a single -. */
export function normalizePypiName(name: string): string {
  return name.toLowerCase().replace(/[-_.]+/g, "-");
}

const NPM_SCOPES: Array<[string, DependencyScope]> = [
  ["dependencies", "runtime"],
  ["devDependencies", "dev"],
  ["peerDependencies", "peer"],
  ["optionalDependencies", "optional"],
];

export function parsePackageJson(text: string, manifest = "package.json"): DeclaredDependency[] {
  const json = JSON.parse(text) as Record<string, unknown>;
  const out: DeclaredDependency[] = [];
  for (const [field, scope] of NPM_SCOPES) {
    const block = json[field];
    if (!block || typeof block !== "object" || Array.isArray(block)) continue;
    for (const [name, value] of Object.entries(block as Record<string, unknown>)) {
      if (!isValidPackageName("npm", name)) continue;
      const spec = typeof value === "string" ? value.trim().slice(0, 200) : "";
      const local = /^(workspace:|file:|link:|portal:|git\+|git:|github:|https?:)/.test(spec) || /^[\w.-]+\/[\w.-]+(#.*)?$/.test(spec);
      out.push({ ecosystem: "npm", name, spec, scope, manifest, local });
      if (out.length >= MAX_PARSED_PER_MANIFEST) return out;
    }
  }
  return out;
}

/*
 * Manifest text comes from any public repository, so every parser below is
 * linear: no regex puts two quantifiers that can match the same characters
 * next to each other, and multi-line patterns use [ \t]* rather than \s*.
 */

/** Longest requirement line that is parsed; the name comes first, so the rest is cut. */
const REQUIREMENT_MAX = 1000;

/** Splits on \n, \r\n and a lone \r. */
const splitLines = (text: string) => text.split(/\r\n?|\n/);

/** Parses one PEP 508 requirement ("name[extra] >=1.0; marker"). Returns null when it is not a registry requirement. */
export function parseRequirement(line: string): { name: string; spec: string; local: boolean } | null {
  const text = line.trim().slice(0, REQUIREMENT_MAX);
  const name = /^[A-Za-z0-9][A-Za-z0-9._-]*/.exec(text)?.[0];
  if (!name || !isValidPackageName("pypi", name)) return null;
  let rest = text.slice(name.length).trimStart();
  if (rest.startsWith("[")) {
    const close = rest.indexOf("]");
    if (close !== -1) rest = rest.slice(close + 1).trimStart();
  }
  rest = rest.replace(/\s+/g, " ").trim();
  return { name: normalizePypiName(name), spec: rest.slice(0, 200), local: rest.startsWith("@") };
}

/** Removes a requirements.txt comment: a # at the start of the line or after whitespace. */
function stripComment(line: string): string {
  for (let i = line.indexOf("#"); i !== -1; i = line.indexOf("#", i + 1)) if (i === 0 || /\s/.test(line[i - 1])) return line.slice(0, i);
  return line;
}

export function parseRequirementsTxt(text: string, manifest = "requirements.txt"): DeclaredDependency[] {
  const out: DeclaredDependency[] = [];
  for (const raw of splitLines(text)) {
    const line = stripComment(raw).trim();
    // Options (-r, -e, --index-url …) and bare URLs/paths are not registry requirements.
    if (!line || line.startsWith("-") || /^(https?:|git\+|\.|\/)/.test(line)) continue;
    const req = parseRequirement(line);
    if (req) out.push({ ecosystem: "pypi", ...req, scope: "runtime", manifest });
    if (out.length >= MAX_PARSED_PER_MANIFEST) break;
  }
  return out;
}

/** Splits TOML into [section] → body text. Tolerant: only what dependency extraction needs. */
function tomlSections(text: string): Map<string, string> {
  const sections = new Map<string, string>();
  let current = "";
  let body: string[] = [];
  for (const line of splitLines(text)) {
    const header = /^[ \t]*\[([^[\]]+)\][ \t]*(#.*)?$/.exec(line);
    if (header) {
      sections.set(current, (sections.get(current) ?? "") + body.join("\n"));
      current = header[1].trim();
      body = [];
    } else body.push(line);
  }
  sections.set(current, (sections.get(current) ?? "") + body.join("\n"));
  return sections;
}

/** Reads the array that opens at body[open] === "[" and returns its quoted strings and the index of its closing bracket. */
function readTomlArray(body: string, open: number): { items: string[]; end: number } {
  const items: string[] = [];
  let depth = 0;
  let quote: string | null = null;
  let stringStart = 0;
  let i = open;
  for (; i < body.length; i += 1) {
    const ch = body[i];
    if (quote) {
      if (quote === '"' && ch === "\\") i += 1;
      else if (ch === quote) {
        items.push(body.slice(stringStart, i).trim());
        quote = null;
      }
    } else if (ch === '"' || ch === "'") {
      quote = ch;
      stringStart = i + 1;
    } else if (ch === "#") while (i < body.length && body[i] !== "\n") i += 1;
    else if (ch === "[") depth += 1;
    else if (ch === "]" && --depth === 0) break;
  }
  return { items, end: i };
}

/** Calls visit(key, strings) for every `key = [ … ]` in a TOML section body, in one pass over the text. */
function tomlArrays(body: string, visit: (key: string, items: string[]) => void): void {
  const re = /^[ \t]*([A-Za-z0-9_.-]+)[ \t]*=[ \t]*\[/gm;
  for (let m = re.exec(body); m; m = re.exec(body)) {
    const { items, end } = readTomlArray(body, re.lastIndex - 1);
    visit(m[1], items);
    re.lastIndex = Math.max(re.lastIndex, end + 1);
  }
}

export function parsePyprojectToml(text: string, manifest = "pyproject.toml"): DeclaredDependency[] {
  const sections = tomlSections(text);
  const out: DeclaredDependency[] = [];
  const push = (items: string[], scope: DependencyScope) => {
    for (const item of items) {
      if (out.length >= MAX_PARSED_PER_MANIFEST) return;
      const req = parseRequirement(item);
      if (req) out.push({ ecosystem: "pypi", ...req, scope, manifest });
    }
  };
  // PEP 621
  const project = sections.get("project");
  if (project)
    tomlArrays(project, (key, items) => {
      if (key === "dependencies") push(items, "runtime");
    });
  const optional = sections.get("project.optional-dependencies");
  if (optional) tomlArrays(optional, (_key, items) => push(items, "optional"));
  // PEP 735 dependency groups
  const groups = sections.get("dependency-groups");
  if (groups) tomlArrays(groups, (_key, items) => push(items, "dev"));
  // Poetry
  for (const [section, scope] of [
    ["tool.poetry.dependencies", "runtime"],
    ["tool.poetry.dev-dependencies", "dev"],
    ["tool.poetry.group.dev.dependencies", "dev"],
  ] as Array<[string, DependencyScope]>) {
    const body = sections.get(section);
    if (!body) continue;
    for (const m of body.matchAll(/^[ \t]*["']?([A-Za-z0-9][A-Za-z0-9._-]*)["']?[ \t]*=[ \t]*(.+)$/gm)) {
      if (out.length >= MAX_PARSED_PER_MANIFEST) break;
      if (m[1].toLowerCase() === "python" || !isValidPackageName("pypi", m[1])) continue;
      const value = m[2].slice(0, REQUIREMENT_MAX).trim();
      let spec: string;
      if (/^["']/.test(value)) {
        const close = value.indexOf(value[0], 1);
        spec = close === -1 ? value.slice(1) : value.slice(1, close);
      } else {
        const hash = value.indexOf("#");
        spec = (hash === -1 ? value : value.slice(0, hash)).trimEnd();
      }
      const local = /\b(path|git|url)[ \t]*=/.test(value);
      out.push({ ecosystem: "pypi", name: normalizePypiName(m[1]), spec: spec.slice(0, 200), scope, manifest, local });
    }
  }
  return out;
}

export type ManifestState = "observed" | "not_found" | "parse_error" | "provider_blocked";

export interface DependencyReport {
  repository: { owner: string; name: string };
  manifests: Array<{ path: string; ecosystem: Ecosystem; state: ManifestState; url?: string; count: number }>;
  dependencies: DeclaredDependency[];
  truncated: boolean;
  coverage: { dependencies: "observed" | "not_found" | "provider_blocked"; vulnerabilities: "unsupported" };
  notes: string[];
  source: { provider: "github"; fetchedAt: string; cache: "hit" | "miss" | "stale" };
}

export const DEPENDENCY_NOTES = [
  "Only manifests at the repository root are read; workspaces and subdirectories are not inspected.",
  "Versions are the declared ranges, not installed versions, so no vulnerability status is inferred.",
];

/** Combines parsed manifests into a deterministic report. */
export function buildDependencyReport(input: {
  owner: string;
  repo: string;
  manifests: Array<{ path: string; state: ManifestState; text?: string; url?: string }>;
  fetchedAt: string;
  cache: "hit" | "miss" | "stale";
}): DependencyReport {
  const manifests: DependencyReport["manifests"] = [];
  const all: DeclaredDependency[] = [];
  for (const m of input.manifests) {
    const ecosystem = DEPENDENCY_MANIFESTS[m.path];
    if (!ecosystem) continue;
    let state = m.state;
    let deps: DeclaredDependency[] = [];
    if (state === "observed") {
      try {
        const text = m.text ?? "";
        deps = m.path === "package.json" ? parsePackageJson(text) : m.path === "pyproject.toml" ? parsePyprojectToml(text) : parseRequirementsTxt(text);
      } catch {
        state = "parse_error";
      }
    }
    manifests.push({ path: m.path, ecosystem, state, url: m.url, count: deps.length });
    for (const d of deps) all.push(d);
  }
  const seen = new Set<string>();
  const unique = all.filter((d) => {
    const key = `${d.ecosystem}:${d.name}:${d.scope}:${d.manifest}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
  const scopeOrder: Record<DependencyScope, number> = { runtime: 0, peer: 1, optional: 2, dev: 3 };
  unique.sort((a, b) => a.manifest.localeCompare(b.manifest) || scopeOrder[a.scope] - scopeOrder[b.scope] || (a.name < b.name ? -1 : a.name > b.name ? 1 : 0));
  const observed = manifests.some((m) => m.state === "observed");
  const blocked = manifests.some((m) => m.state === "provider_blocked");
  return {
    repository: { owner: input.owner, name: input.repo },
    manifests,
    dependencies: unique.slice(0, MAX_DEPENDENCIES),
    truncated: unique.length > MAX_DEPENDENCIES,
    coverage: { dependencies: observed ? "observed" : blocked ? "provider_blocked" : "not_found", vulnerabilities: "unsupported" },
    notes: [...DEPENDENCY_NOTES],
    source: { provider: "github", fetchedAt: input.fetchedAt, cache: input.cache },
  };
}

/* ---------- Registry metadata for one selected package ---------- */

export interface PackageMetadata {
  ecosystem: Ecosystem;
  name: string;
  latestVersion?: string;
  license?: string;
  /** Deprecation message for npm, or "yanked: reason" for the latest PyPI release. */
  deprecated?: string;
  summary?: string;
  requiresPython?: string;
  latestReleasedAt?: string;
  registryUrl: string;
  sourceUrl?: string;
  fetchedAt: string;
}

const clean = (v: unknown, max = 300): string | undefined =>
  typeof v === "string" && v.trim() ? v.replace(/\s+/g, " ").trim().slice(0, max) : undefined;

/** Keeps only https links to well-known code hosts. */
export function safeSourceUrl(value: unknown): string | undefined {
  const raw = clean(value, 500)?.replace(/^git\+/, "").replace(/\.git(#.*)?$/, "");
  if (!raw) return undefined;
  try {
    const url = new URL(raw.replace(/^git:\/\//, "https://").replace(/^ssh:\/\/git@/, "https://"));
    return url.protocol === "https:" && /^(github\.com|gitlab\.com|bitbucket\.org)$/.test(url.hostname) ? url.toString() : undefined;
  } catch {
    return undefined;
  }
}

/** Normalizes registry.npmjs.org/<name>/latest. */
export function normalizeNpmLatest(json: unknown, fetchedAt: string): PackageMetadata {
  const d = (json ?? {}) as Record<string, unknown>;
  const name = clean(d.name, 214) ?? "";
  const repo = d.repository;
  const license = typeof d.license === "string" ? d.license : clean((d.license as { type?: unknown } | undefined)?.type);
  return {
    ecosystem: "npm",
    name,
    latestVersion: clean(d.version, 80),
    license: clean(license, 120),
    deprecated: clean(d.deprecated, 300),
    summary: clean(d.description),
    registryUrl: `https://www.npmjs.com/package/${name}`,
    sourceUrl: safeSourceUrl(typeof repo === "string" ? repo : (repo as { url?: unknown } | undefined)?.url),
    fetchedAt,
  };
}

/** Normalizes pypi.org/pypi/<name>/json; release history is ignored. */
export function normalizePypiProject(json: unknown, fetchedAt: string): PackageMetadata {
  const d = (json ?? {}) as { info?: Record<string, unknown>; urls?: Array<Record<string, unknown>> };
  const info = d.info ?? {};
  const name = normalizePypiName(clean(info.name, 214) ?? "");
  const classifierLicense = Array.isArray(info.classifiers)
    ? (info.classifiers as unknown[]).find((c): c is string => typeof c === "string" && c.startsWith("License :: "))?.split(" :: ").pop()
    : undefined;
  const expression = clean(info.license_expression, 120);
  const declared = clean(info.license, 400);
  // Some projects paste the whole licence text into `license`; only short values are identifiers.
  const license = expression ?? (declared && declared.length <= 120 ? declared : undefined) ?? classifierLicense;
  const uploads = (d.urls ?? []).map((u) => clean(u.upload_time_iso_8601, 40)).filter((x): x is string => Boolean(x)).sort();
  const projectUrls = (info.project_urls ?? {}) as Record<string, unknown>;
  const source = Object.entries(projectUrls).map(([, v]) => safeSourceUrl(v)).find(Boolean) ?? safeSourceUrl(info.home_page);
  return {
    ecosystem: "pypi",
    name,
    latestVersion: clean(info.version, 80),
    license,
    deprecated: info.yanked === true ? `yanked${clean(info.yanked_reason) ? `: ${clean(info.yanked_reason)}` : ""}` : undefined,
    summary: clean(info.summary),
    requiresPython: clean(info.requires_python, 80),
    latestReleasedAt: uploads[uploads.length - 1],
    registryUrl: `https://pypi.org/project/${name}/`,
    sourceUrl: source,
    fetchedAt,
  };
}

/** Registry URL for one package; names are validated first. */
export function registryUrl(ecosystem: Ecosystem, name: string): string {
  if (!isValidPackageName(ecosystem, name)) throw new Error("Invalid package name.");
  return ecosystem === "npm" ? `https://registry.npmjs.org/${name.replace("/", "%2f")}/latest` : `https://pypi.org/pypi/${normalizePypiName(name)}/json`;
}

export function dependenciesToCsv(report: DependencyReport): string {
  const esc = (v: string) => {
    const s = /^[=+\-@\t\r]/.test(v) ? `'${v}` : v;
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const rows = [["ecosystem", "name", "declared", "scope", "manifest", "local"]];
  for (const d of report.dependencies) rows.push([d.ecosystem, d.name, d.spec, d.scope, d.manifest, String(d.local)]);
  return rows.map((r) => r.map(esc).join(",")).join("\n") + "\n";
}
