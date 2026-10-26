import { useId, useState } from "react";
import { dependenciesToCsv, type DependencyReport, type PackageMetadata } from "@workspace/proof-atlas-core/github/dependencies";
import { downloadText, formatDateTime, postJson, useClientValue, type ApiError } from "./util";

type Lookup = { state: "loading" } | { state: "done"; meta: PackageMetadata } | { state: "error"; message: string; registryUrl?: string };

const MANIFEST_STATE: Record<string, { text: string; tone: string }> = {
  observed: { text: "Read", tone: "ok" },
  not_found: { text: "Not present", tone: "neutral" },
  parse_error: { text: "Could not be read", tone: "warning" },
  provider_blocked: { text: "Blocked by provider", tone: "warning" },
};
const REGISTRY: Record<string, string> = { npm: "npm", pypi: "PyPI" };

/** Spec: at most five package enrichments a visitor chooses per session. */
export const MAX_LOOKUPS_PER_SESSION = 5;
const LOOKUP_KEY = "pa-package-lookups";
let memoryLookups = 0;
const lookupsUsed = (): number => {
  try {
    return Number(sessionStorage.getItem(LOOKUP_KEY)) || 0;
  } catch {
    return memoryLookups;
  }
};
const countLookup = () => {
  memoryLookups = lookupsUsed() + 1;
  try {
    sessionStorage.setItem(LOOKUP_KEY, String(memoryLookups));
  } catch {
    /* storage blocked: the in-memory count still applies on this page */
  }
};
/** The registry's own page, for when the lookup limit is reached. */
const registryPage = (ecosystem: string, name: string) =>
  ecosystem === "npm" ? `https://www.npmjs.com/package/${name}` : `https://pypi.org/project/${name}/`;

/**
 * Optional second step of the Repository Evidence Graph: declared dependencies
 * from root manifests, and registry metadata for packages the visitor picks.
 */
export default function DependencyEvidence({ owner, repo, onLoaded }: { owner: string; repo: string; onLoaded?: (report: DependencyReport) => void }) {
  const id = useId();
  const [phase, setPhase] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [report, setReport] = useState<DependencyReport | null>(null);
  const [error, setError] = useState<ApiError | null>(null);
  const [lookups, setLookups] = useState<Record<string, Lookup>>({});
  const [announce, setAnnounce] = useState("");
  // Lookups already used this session (from sessionStorage), until this view records more.
  const stored = useClientValue(lookupsUsed, 0);
  const [counted, setUsed] = useState<number | null>(null);
  const used = counted ?? stored;
  const limitReached = used >= MAX_LOOKUPS_PER_SESSION;

  async function load() {
    setPhase("loading");
    setError(null);
    const res = await postJson<DependencyReport>("/api/repository/dependencies", { owner, repo });
    if (!res.ok) {
      setError(res.error);
      setPhase("error");
      return;
    }
    setReport(res.data);
    setPhase("done");
    setAnnounce(`${res.data.dependencies.length} declared dependencies read.`);
    onLoaded?.(res.data);
  }

  async function lookup(ecosystem: string, name: string) {
    const key = `${ecosystem}:${name}`;
    if (lookupsUsed() >= MAX_LOOKUPS_PER_SESSION) {
      setUsed(lookupsUsed());
      return;
    }
    countLookup();
    setUsed(lookupsUsed());
    setLookups((l) => ({ ...l, [key]: { state: "loading" } }));
    const res = await postJson<{ package: PackageMetadata }>("/api/packages/lookup", { ecosystem, name });
    if (res.ok) {
      setLookups((l) => ({ ...l, [key]: { state: "done", meta: res.data.package } }));
      setAnnounce(`${name}: latest ${res.data.package.latestVersion ?? "unknown"}${res.data.package.deprecated ? ", deprecated" : ""}.`);
    } else {
      setLookups((l) => ({ ...l, [key]: { state: "error", message: res.error.message } }));
      setAnnounce(`${name}: ${res.error.message}`);
    }
  }

  return (
    <section className="deps" aria-labelledby={`${id}-h`}>
      <h3 id={`${id}-h`} className="h4">
        Declared dependencies
      </h3>
      <p className="small muted">
        Reads <code>package.json</code>, <code>pyproject.toml</code> and <code>requirements.txt</code> at the repository root — one extra GitHub request for each one present. The
        versions are the declared ranges, not what is installed, so no vulnerability status is shown. npm or PyPI is contacted only for a package you choose.
      </p>
      {phase !== "done" && (
        <button type="button" className="button button--small" onClick={() => void load()} disabled={phase === "loading"}>
          {phase === "loading" ? "Reading manifests…" : "Read declared dependencies"}
        </button>
      )}
      <p className="small" role="status" aria-live="polite">
        {phase === "error" ? error?.message : announce}
      </p>

      {report && (
        <>
          <ul className="cluster manifest-list" aria-label="Root manifests">
            {report.manifests.map((m) => (
              <li key={m.path}>
                <span className="badge" data-status={MANIFEST_STATE[m.state].tone}>
                  <span className="mono">{m.path}</span>: {MANIFEST_STATE[m.state].text}
                  {m.state === "observed" ? ` (${m.count})` : ""}
                </span>
              </li>
            ))}
          </ul>
          {report.dependencies.length === 0 ? (
            <p className="small muted">No registry dependencies are declared in these files.</p>
          ) : (
            <div className="table-wrap">
              <table>
                <caption className="visually-hidden">Declared dependencies</caption>
                <thead>
                  <tr>
                    <th scope="col">Package</th>
                    <th scope="col">Declared</th>
                    <th scope="col">Scope</th>
                    <th scope="col">Registry</th>
                  </tr>
                </thead>
                <tbody>
                  {report.dependencies.map((d) => {
                    const key = `${d.ecosystem}:${d.name}`;
                    const l = lookups[key];
                    return (
                      <tr key={`${d.manifest}:${d.scope}:${d.name}`}>
                        <th scope="row" className="mono">
                          {d.name}
                          <span className="dep-manifest">{d.manifest}</span>
                        </th>
                        <td className="mono">{d.spec || "any"}</td>
                        <td>{d.scope}</td>
                        <td>
                          {d.local ? (
                            <span className="muted small">Local or URL reference</span>
                          ) : !l && limitReached ? (
                            <a href={registryPage(d.ecosystem, d.name)} target="_blank" rel="noopener noreferrer" className="small">
                              {REGISTRY[d.ecosystem]} page
                              <span className="visually-hidden"> for {d.name} (opens in a new tab)</span>
                            </a>
                          ) : !l ? (
                            <button type="button" className="link-button" onClick={() => void lookup(d.ecosystem, d.name)}>
                              Look up on {REGISTRY[d.ecosystem]}
                              <span className="visually-hidden"> {d.name}</span>
                            </button>
                          ) : l.state === "loading" ? (
                            <span className="muted small">Looking up…</span>
                          ) : l.state === "error" ? (
                            <span className="small">{l.message}</span>
                          ) : (
                            <span className="dep-meta small">
                              <span>
                                Latest <span className="mono">{l.meta.latestVersion ?? "—"}</span>
                                {l.meta.license ? ` · ${l.meta.license}` : " · licence not stated"}
                              </span>
                              {l.meta.deprecated && (
                                <span className="badge" data-status="warning" title={l.meta.deprecated}>
                                  {l.meta.ecosystem === "npm" ? "Deprecated" : "Yanked"}
                                </span>
                              )}
                              <a href={l.meta.registryUrl} target="_blank" rel="noopener noreferrer">
                                {REGISTRY[l.meta.ecosystem]}
                                <span className="visually-hidden"> page for {l.meta.name} (opens in a new tab)</span>
                              </a>
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
          {report.truncated && <p className="hint">Only the first {report.dependencies.length} dependencies are shown.</p>}
          <p className="hint" aria-live="polite">
            {limitReached
              ? `You have looked up ${MAX_LOOKUPS_PER_SESSION} packages in this visit, the limit for this tool; the remaining rows link to the registry instead.`
              : `Package lookups this visit: ${used} of ${MAX_LOOKUPS_PER_SESSION}.`}
          </p>
          <ul className="small muted dep-notes">
            {report.notes.map((n) => (
              <li key={n}>{n}</li>
            ))}
            <li>
              Read from GitHub {formatDateTime(report.source.fetchedAt)} · cache {report.source.cache}.
            </li>
          </ul>
          <div className="cluster downloads">
            <button
              type="button"
              className="button button--ghost button--small"
              onClick={() => downloadText(`${report.repository.owner}-${report.repository.name}-dependencies.csv`, dependenciesToCsv(report), "text/csv")}
            >
              Download dependencies CSV
            </button>
          </div>
        </>
      )}
    </section>
  );
}
