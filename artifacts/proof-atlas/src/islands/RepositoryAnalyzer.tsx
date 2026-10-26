import { useId, useMemo, useRef, useState, type SyntheticEvent } from "react";
import {
  ALL_SECTIONS,
  evidenceGraph,
  evidenceToCsv,
  parseRepositoryInput,
  type CoverageState,
  type RepoAnalyzeResponse,
  type RepoSection,
} from "@workspace/proof-atlas-core/github/index";
import type { DependencyReport } from "@workspace/proof-atlas-core/github/dependencies";
import DependencyEvidence from "./DependencyEvidence";
import { IslandBoundary } from "./IslandBoundary";
import { downloadText, formatDateTime, postJson, useClientValue, waitText, type ApiError } from "./util";

/** "validating" happens synchronously before any request, so it has no visible state of its own. */
type Phase = "idle" | "fetching" | "success" | "invalid" | "rate-limited" | "unavailable" | "error";

const CACHE_TEXT = { miss: "read just now", hit: "from this site's recent copy", stale: "from an earlier copy, because GitHub was unavailable" } as const;

const SECTION_LABEL: Record<RepoSection, string> = {
  overview: "Overview",
  readme: "README",
  releases: "Releases",
  manifests: "Root manifests",
  languages: "Languages",
  license: "Licence",
};

const COVERAGE_TEXT: Record<CoverageState, string> = {
  observed: "Observed",
  not_found: "Not found",
  unsupported: "Not inspected (out of scope)",
  provider_blocked: "Blocked by provider",
  not_requested: "Not requested",
};
const COVERAGE_TONE: Record<CoverageState, string> = {
  observed: "ok",
  not_found: "neutral",
  unsupported: "warning",
  provider_blocked: "warning",
  not_requested: "neutral",
};
const COVERAGE_ORDER = ["overview", "readme", "releases", "manifests", "languages", "license", "dependencies", "vulnerabilities"];

function EvidenceGraphView({ data }: { data: RepoAnalyzeResponse }) {
  const graph = useMemo(() => evidenceGraph(data), [data]);
  const groups = graph.nodes.filter((n) => n.kind === "group");
  const leavesByGroup = new Map<string, string[]>();
  for (const e of graph.edges) {
    if (e.from === "repository") continue;
    const list = leavesByGroup.get(e.from) ?? [];
    list.push(e.to);
    leavesByGroup.set(e.from, list);
  }
  const label = (id: string) => graph.nodes.find((n) => n.id === id)?.label ?? id;
  // Column layout: repository → groups → evidence (README headings indented under the README).
  const rows: Array<{ id: string; depth: number; group: string }> = [];
  for (const g of groups) {
    for (const leaf of leavesByGroup.get(g.id) ?? []) {
      rows.push({ id: leaf, depth: 0, group: g.id });
      for (const child of leavesByGroup.get(leaf) ?? []) rows.push({ id: child, depth: 1, group: g.id });
    }
  }
  const rowH = 26;
  const height = Math.max(rows.length * rowH + 20, 120);
  const groupY = new Map<string, number>();
  for (const g of groups) {
    const ys = rows.map((r, i) => (r.group === g.id ? i * rowH + 20 : null)).filter((y): y is number => y !== null);
    groupY.set(g.id, ys.length ? (ys[0] + ys[ys.length - 1]) / 2 : 20);
  }
  const rootY = height / 2;
  const trim = (s: string, n: number) => (s.length > n ? `${s.slice(0, n - 1)}…` : s);
  return (
    <div className="graph-wrap" role="group" aria-label="Evidence graph drawing; the list view has the same content">
      <svg viewBox={`0 0 760 ${height}`} className="evidence-graph" aria-hidden="true" focusable="false">
        {groups.map((g) => (
          <path key={`e-${g.id}`} d={`M150 ${rootY} C200 ${rootY} 200 ${groupY.get(g.id)} 250 ${groupY.get(g.id)}`} className="g-edge" />
        ))}
        {rows.map((r, i) => {
          const y = i * rowH + 20;
          const x = 430 + r.depth * 22;
          const gy = groupY.get(r.group)!;
          return <path key={`l-${r.id}`} d={`M370 ${gy} C400 ${gy} 400 ${y} ${x - 8} ${y}`} className={`g-edge${r.depth ? " g-edge--child" : ""}`} />;
        })}
        <rect x="10" y={rootY - 18} width="140" height="36" rx="10" className="g-root" />
        <text x="80" y={rootY + 5} textAnchor="middle" className="g-root-text">
          {trim(label("repository"), 18)}
        </text>
        {groups.map((g) => (
          <g key={g.id}>
            <rect x="250" y={groupY.get(g.id)! - 14} width="120" height="28" rx="8" className="g-group" />
            <text x="310" y={groupY.get(g.id)! + 5} textAnchor="middle" className="g-group-text">
              {g.label}
            </text>
          </g>
        ))}
        {rows.map((r, i) => (
          <g key={r.id}>
            <circle cx={430 + r.depth * 22 - 4} cy={i * rowH + 20} r="4" className="g-leaf" />
            <text x={430 + r.depth * 22 + 6} y={i * rowH + 24} className="g-leaf-text">
              {trim(label(r.id), 46 - r.depth * 3)}
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
}

function EvidenceList({ data, filter = "" }: { data: RepoAnalyzeResponse; filter?: string }) {
  const term = filter.trim().toLowerCase();
  const matches = (e: RepoAnalyzeResponse["evidence"][number]) => !term || `${e.label} ${e.detail ?? ""}`.toLowerCase().includes(term);
  const groups: Array<[string, RepoAnalyzeResponse["evidence"]]> = [
    ["Licence", data.evidence.filter((e) => e.kind === "license" && matches(e))],
    ["Documentation", data.evidence.filter((e) => (e.kind === "readme" || e.kind === "readme-heading") && matches(e))],
    ["Releases", data.evidence.filter((e) => e.kind === "release" && matches(e))],
    ["Manifests", data.evidence.filter((e) => e.kind === "manifest" && matches(e))],
    ["Languages", data.evidence.filter((e) => e.kind === "language" && matches(e))],
  ];
  if (term && groups.every(([, items]) => !items.length)) return <p className="small muted">No evidence matches “{filter.trim()}”.</p>;
  return (
    <ul className="evidence-tree">
      {groups
        .filter(([, items]) => items.length)
        .map(([name, items]) => (
          <li key={name}>
            <span className="tree-group">{name}</span>
            <ul>
              {items.map((e) => (
                <li key={e.id} className={e.kind === "readme-heading" ? "tree-child" : undefined}>
                  {e.url ? (
                    <a href={e.url} target="_blank" rel="noopener noreferrer">
                      {e.label}
                      <span className="visually-hidden"> (opens in a new tab)</span>
                    </a>
                  ) : (
                    <span>{e.label}</span>
                  )}
                  {e.detail && <span className="muted small"> — {e.detail}</span>}
                </li>
              ))}
            </ul>
          </li>
        ))}
    </ul>
  );
}

function RepositoryAnalyzerInner({ initialRepo = "" }: { initialRepo?: string }) {
  const id = useId();
  // ?repo=owner/name prefills the field; the visitor still chooses to run it.
  const repoFromUrl = useClientValue(() => (new URLSearchParams(location.search).get("repo") ?? "").slice(0, 300), "");
  const [typed, setInput] = useState<string | null>(null);
  const input = typed ?? (initialRepo || repoFromUrl);
  const [sections, setSections] = useState<RepoSection[]>([...ALL_SECTIONS]);
  const [phase, setPhase] = useState<Phase>("idle");
  const [error, setError] = useState<ApiError | null>(null);
  const [data, setData] = useState<RepoAnalyzeResponse | null>(null);
  // The graph needs room; on phones the list view (same content) is the default.
  const narrow = useClientValue(() => window.matchMedia("(max-width: 639px)").matches, false);
  const [chosenView, setView] = useState<"graph" | "list" | null>(null);
  const view = chosenView ?? (narrow ? "list" : "graph");
  const [deps, setDeps] = useState<DependencyReport | null>(null);
  const [filter, setFilter] = useState("");
  const resultRef = useRef<HTMLHeadingElement>(null);

  async function analyze(value: string) {
    const parsed = parseRepositoryInput(value);
    if (!parsed.ok) {
      setPhase("invalid");
      setError({ kind: "invalid", message: parsed.message });
      return;
    }
    setPhase("fetching");
    setError(null);
    setFilter("");
    const res = await postJson<RepoAnalyzeResponse>("/api/repository/analyze", { owner: parsed.owner, repo: parsed.repo, include: sections });
    if (!res.ok) {
      setData(null);
      setError(res.error);
      setPhase(res.error.kind === "rate-limited" ? "rate-limited" : res.error.kind === "unavailable" ? "unavailable" : res.error.kind === "invalid" || res.error.kind === "not-found" ? "invalid" : "error");
      return;
    }
    setData(res.data);
    setDeps(null);
    setPhase("success");
    requestAnimationFrame(() => resultRef.current?.focus());
  }

  const onSubmit = (e: SyntheticEvent) => {
    e.preventDefault();
    void analyze(input);
  };
  const toggle = (s: RepoSection) =>
    setSections((cur) => (s === "overview" ? cur : cur.includes(s) ? cur.filter((x) => x !== s) : [...cur, s]));

  // An invalid name is explained next to the field only, not twice.
  const statusText =
    phase === "fetching"
      ? "Fetching public repository data…"
      : phase === "success" && data
        ? `Analysis ready: ${data.evidence.length} evidence items.`
        : phase === "rate-limited"
          ? `${error?.message ?? "GitHub's rate limit was reached."} ${waitText(error?.retryAfter)}`
          : phase === "invalid"
            ? ""
            : error?.message ?? "";

  return (
    <div className="tool">
      <form className="tool-form" onSubmit={onSubmit} noValidate>
        <div className="field">
          <label htmlFor={`${id}-repo`}>Public GitHub repository</label>
          <div className="tool-row">
            <input
              id={`${id}-repo`}
              className="input"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="owner/repo or a GitHub URL"
              aria-describedby={`${id}-hint ${id}-error`}
              aria-invalid={phase === "invalid"}
              autoComplete="off"
              spellCheck={false}
            />
            <button className="button" type="submit" disabled={phase === "fetching"}>
              {phase === "fetching" ? "Analysing…" : "Analyse"}
            </button>
          </div>
          <p id={`${id}-hint`} className="hint">
            Only the repository identity is sent; the server builds the GitHub API requests itself (at most five).
          </p>
          <p id={`${id}-error`} className="error" hidden={phase !== "invalid"}>
            {phase === "invalid" ? error?.message : ""}
          </p>
        </div>
        <fieldset className="tool-sections">
          <legend className="label">Include</legend>
          <div className="cluster">
            {ALL_SECTIONS.map((s) => (
              <label key={s} className="check">
                <input type="checkbox" checked={sections.includes(s)} disabled={s === "overview"} onChange={() => toggle(s)} />
                {SECTION_LABEL[s]}
              </label>
            ))}
          </div>
        </fieldset>
        <p className="cluster small">
          <span className="muted">Try:</span>
          {["Anupam0202/NexusRAG", "Anupam0202/PlantPal", "withastro/astro"].map((r) => (
            <button
              key={r}
              type="button"
              className="chip example"
              onClick={() => {
                setInput(r);
                void analyze(r);
              }}
            >
              {r}
            </button>
          ))}
        </p>
      </form>

      <p className="small tool-status" role="status" aria-live="polite">
        {statusText}
      </p>

      {phase === "success" && data && (
        <section className="tool-result" aria-label={`${data.repository.owner}/${data.repository.name}`}>
          <div className="result-head">
            <h2 id={`${id}-result`} className="h3" tabIndex={-1} ref={resultRef}>
              {data.repository.url ? (
                <a href={data.repository.url} target="_blank" rel="noopener noreferrer">
                  {data.repository.owner}/{data.repository.name}
                  <span className="visually-hidden"> (opens in a new tab)</span>
                </a>
              ) : (
                `${data.repository.owner}/${data.repository.name}`
              )}
            </h2>
            {data.repository.description && <p className="muted">{data.repository.description}</p>}
            <dl className="facts">
              <div>
                <dt>Default branch</dt>
                <dd>{data.repository.defaultBranch ?? "—"}</dd>
              </div>
              <div>
                <dt>Last push</dt>
                <dd>{data.repository.pushedAt ? formatDateTime(data.repository.pushedAt) : "—"}</dd>
              </div>
              <div>
                <dt>Licence</dt>
                <dd>{data.repository.license?.spdx ?? data.repository.license?.name ?? "None detected"}</dd>
              </div>
              <div>
                <dt>Read from GitHub</dt>
                <dd>
                  {formatDateTime(data.source.fetchedAt)} ({CACHE_TEXT[data.source.cache]})
                </dd>
              </div>
            </dl>
          </div>

          <h3 className="h4">Coverage</h3>
          <p className="small muted">What was and was not inspected. Absence of evidence here is not evidence of safety or quality.</p>
          <div className="table-wrap">
            <table>
              <caption className="visually-hidden">Coverage by section</caption>
              <thead>
                <tr>
                  <th scope="col">Section</th>
                  <th scope="col">State</th>
                </tr>
              </thead>
              <tbody>
                {COVERAGE_ORDER.filter((k) => k in data.coverage).map((k) => {
                  const state = k === "dependencies" && deps ? deps.coverage.dependencies : data.coverage[k];
                  return (
                    <tr key={k}>
                      <th scope="row">{SECTION_LABEL[k as RepoSection] ?? (k === "dependencies" ? "Declared dependencies" : "Vulnerability analysis")}</th>
                      <td>
                        <span className="badge" data-status={COVERAGE_TONE[state]}>
                          {COVERAGE_TEXT[state]}
                        </span>
                        {k === "dependencies" && !deps && <span className="small muted"> — optional step below</span>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {data.warnings.length > 0 && (
            <div className="notice warnings">
              <p>
                <strong>Warnings</strong>
              </p>
              <ul>
                {data.warnings.map((w) => (
                  <li key={w}>{w}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="result-bar">
            <h3 className="h4">Evidence</h3>
            <div className="segmented" role="group" aria-label="Evidence view">
              <button type="button" aria-pressed={view === "graph"} onClick={() => setView("graph")}>
                Graph
              </button>
              <button type="button" aria-pressed={view === "list"} onClick={() => setView("list")}>
                List
              </button>
            </div>
          </div>
          {view === "graph" ? (
            <>
              <EvidenceGraphView data={data} />
              <details className="disclosure">
                <summary>Same evidence as a list</summary>
                <div className="disclosure-body">
                  <EvidenceList data={data} />
                </div>
              </details>
            </>
          ) : (
            <>
              <div className="field evidence-filter">
                <label htmlFor={`${id}-filter`}>Search the evidence</label>
                <input id={`${id}-filter`} className="input" type="search" value={filter} onChange={(e) => setFilter(e.target.value)} autoComplete="off" />
              </div>
              <EvidenceList data={data} filter={filter} />
            </>
          )}

          <DependencyEvidence key={`${data.repository.owner}/${data.repository.name}`} owner={data.repository.owner} repo={data.repository.name} onLoaded={setDeps} />

          <div className="cluster downloads">
            <button
              type="button"
              className="button button--ghost button--small"
              onClick={() => downloadText(`${data.repository.owner}-${data.repository.name}-evidence.json`, JSON.stringify(data, null, 2), "application/json")}
            >
              Download JSON
            </button>
            <button
              type="button"
              className="button button--ghost button--small"
              onClick={() => downloadText(`${data.repository.owner}-${data.repository.name}-evidence.csv`, evidenceToCsv(data), "text/csv")}
            >
              Download CSV
            </button>
          </div>
        </section>
      )}
    </div>
  );
}

export default function RepositoryAnalyzer(props: { initialRepo?: string }) {
  return (
    <IslandBoundary name="repository-analyzer">
      <RepositoryAnalyzerInner {...props} />
    </IslandBoundary>
  );
}
