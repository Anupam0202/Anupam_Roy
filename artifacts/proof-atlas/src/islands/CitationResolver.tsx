import { useId, useState, type SyntheticEvent } from "react";
import {
  authorLabel,
  dedupeDoiList,
  normalizeDoi,
  toBibtex,
  toCslJson,
  toRis,
  type CitationRecord,
  type FieldComparison,
} from "@workspace/proof-atlas-core/citations/index";
import { IslandBoundary } from "./IslandBoundary";
import { copyText, downloadText, formatDateTime, postJson, waitText, type ApiError } from "./util";

type Mode = "doi" | "search" | "list";

interface ResolveResponse {
  record: CitationRecord;
  comparison?: FieldComparison[];
  alternate?: CitationRecord;
  /** True when the comparison registry failed: the record is complete, the comparison is not. */
  partial?: boolean;
  warnings: string[];
  source: { cache: "hit" | "miss" | "stale" };
}
interface SearchResponse {
  results: CitationRecord[];
  source: { fetchedAt: string; cache: "hit" | "miss" | "stale" };
}

const FIELD_LABEL: Record<string, string> = {
  title: "Title",
  authors: "Authors",
  issued: "Publication date",
  containerTitle: "Journal or container",
  publisher: "Publisher",
  type: "Type",
  year: "Year",
  firstAuthor: "First author",
};

function RecordCard({ r, onAdd, added }: { r: CitationRecord; onAdd?: () => void; added?: boolean }) {
  return (
    <article className="card citation">
      <p className="eyebrow">
        {r.provider === "crossref" ? "Crossref" : "DataCite"} · {r.type ?? "type not given"}
      </p>
      <h3 className="h4">{r.title ?? "Untitled record"}</h3>
      <p className="small">
        {r.authors.length ? r.authors.slice(0, 6).map(authorLabel).join(", ") + (r.authors.length > 6 ? `, and ${r.authors.length - 6} more` : "") : "No authors listed"}
      </p>
      <p className="small muted">
        {[r.containerTitle, r.publisher, r.issued ? [r.issued.year, r.issued.month, r.issued.day].filter(Boolean).join("-") : null].filter(Boolean).join(" · ")}
      </p>
      <p className="small">
        <a href={r.url} target="_blank" rel="noopener noreferrer">
          doi.org/{r.doi}
          <span className="visually-hidden"> (opens in a new tab)</span>
        </a>
      </p>
      {r.missing.length > 0 && (
        <p className="hint">
          <span className="badge" data-status="warning">
            Missing fields
          </span>{" "}
          {r.missing.map((m) => FIELD_LABEL[m] ?? m).join(", ")}
        </p>
      )}
      <p className="hint">
        Provider updated {r.providerUpdatedAt ? formatDateTime(r.providerUpdatedAt) : "date not given"} · fetched {formatDateTime(r.fetchedAt)}
      </p>
      {onAdd && (
        <button type="button" className="button button--ghost button--small" onClick={onAdd} disabled={added}>
          {added ? "In collection" : "Add to collection"}
        </button>
      )}
    </article>
  );
}

function CitationResolverInner() {
  const id = useId();
  const [mode, setMode] = useState<Mode>("doi");
  const [doi, setDoi] = useState("");
  const [compare, setCompare] = useState(false);
  const [query, setQuery] = useState("");
  const [list, setList] = useState("");
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("");
  const [error, setError] = useState<ApiError | null>(null);
  const [resolved, setResolved] = useState<ResolveResponse | null>(null);
  const [searchResults, setSearchResults] = useState<CitationRecord[]>([]);
  const [listReport, setListReport] = useState<{
    found: CitationRecord[];
    failed: Array<{ doi: string; reason: string }>;
    rejected: string[];
    duplicates: number;
    skipped: string[];
  } | null>(null);
  const [collection, setCollection] = useState<CitationRecord[]>([]);

  const add = (r: CitationRecord) => setCollection((c) => (c.some((x) => x.doi === r.doi) ? c : [...c, r]));
  const inCollection = (r: CitationRecord) => collection.some((x) => x.doi === r.doi);

  async function resolveDoi(e: SyntheticEvent) {
    e.preventDefault();
    const normalized = normalizeDoi(doi);
    if (!normalized) {
      setError({ kind: "invalid", message: "Enter a DOI like 10.1000/xyz123, doi:10.1000/xyz123 or https://doi.org/10.1000/xyz123." });
      return;
    }
    setBusy(true);
    setError(null);
    setResolved(null);
    setStatus("Resolving with Crossref…");
    const res = await postJson<ResolveResponse>("/api/citations/resolve", { doi: normalized, compare });
    setBusy(false);
    if (!res.ok) {
      setError(res.error);
      setStatus("");
      return;
    }
    setResolved(res.data);
    setStatus(`Resolved ${normalized} via ${res.data.record.provider === "crossref" ? "Crossref" : "DataCite"}.`);
  }

  async function runSearch(e: SyntheticEvent) {
    e.preventDefault();
    const q = query.trim();
    if (q.length < 3) {
      setError({ kind: "invalid", message: "Enter at least three characters." });
      return;
    }
    setBusy(true);
    setError(null);
    setStatus("Searching Crossref…");
    const res = await postJson<SearchResponse>("/api/citations/search", { query: q });
    setBusy(false);
    if (!res.ok) {
      setError(res.error);
      setStatus("");
      return;
    }
    setSearchResults(res.data.results);
    setStatus(`${res.data.results.length} results from Crossref.`);
  }

  async function checkList(e: SyntheticEvent) {
    e.preventDefault();
    const { dois, rejected, duplicates, skipped } = dedupeDoiList(list, 20);
    if (!dois.length) {
      setError({ kind: "invalid", message: "No valid DOIs found. Put one DOI per line." });
      return;
    }
    setBusy(true);
    setError(null);
    const found: CitationRecord[] = [];
    const failed: Array<{ doi: string; reason: string }> = [];
    const notChecked = [...skipped];
    for (const [i, d] of dois.entries()) {
      setStatus(`Checking ${i + 1} of ${dois.length}…`);
      const res = await postJson<ResolveResponse>("/api/citations/resolve", { doi: d });
      if (res.ok) found.push(res.data.record);
      else {
        failed.push({ doi: d, reason: res.error.kind === "rate-limited" ? `${res.error.message} ${waitText(res.error.retryAfter)}` : res.error.message });
        if (res.error.kind === "rate-limited") {
          notChecked.unshift(...dois.slice(i + 1));
          break;
        }
      }
    }
    setBusy(false);
    setListReport({ found, failed, rejected, duplicates, skipped: notChecked });
    setStatus(
      `Checked ${found.length + failed.length} DOIs: ${found.length} resolved, ${failed.length} failed${notChecked.length ? `, ${notChecked.length} not checked` : ""}.`,
    );
  }

  return (
    <div className="tool">
      <div className="segmented" role="group" aria-label="Citation tool mode">
        {(
          [
            ["doi", "Resolve a DOI"],
            ["search", "Search"],
            ["list", "Check a list"],
          ] as Array<[Mode, string]>
        ).map(([m, label]) => (
          <button
            key={m}
            type="button"
            aria-pressed={mode === m}
            onClick={() => {
              setMode(m);
              setError(null);
              setStatus("");
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {mode === "doi" && (
        <form className="tool-form" onSubmit={resolveDoi} noValidate>
          <div className="field">
            <label htmlFor={`${id}-doi`}>DOI</label>
            <div className="tool-row">
              <input
                id={`${id}-doi`}
                className="input"
                value={doi}
                onChange={(e) => setDoi(e.target.value)}
                placeholder="10.1038/nature14539"
                spellCheck={false}
                autoComplete="off"
                aria-invalid={error?.kind === "invalid"}
                aria-describedby={error ? `${id}-error` : undefined}
              />
              <button className="button" type="submit" disabled={busy}>
                Resolve
              </button>
            </div>
          </div>
          <label className="check">
            <input type="checkbox" checked={compare} onChange={(e) => setCompare(e.target.checked)} /> Also compare with DataCite
          </label>
        </form>
      )}
      {mode === "search" && (
        <form className="tool-form" onSubmit={runSearch} noValidate>
          <div className="field">
            <label htmlFor={`${id}-q`}>Title, authors or topic</label>
            <div className="tool-row">
              <input
                id={`${id}-q`}
                className="input"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                maxLength={200}
                autoComplete="off"
                aria-invalid={error?.kind === "invalid"}
                aria-describedby={error ? `${id}-error` : undefined}
              />
              <button className="button" type="submit" disabled={busy}>
                Search
              </button>
            </div>
            <p className="hint">Searches Crossref bibliographic metadata. Abstracts are never fetched or stored.</p>
          </div>
        </form>
      )}
      {mode === "list" && (
        <form className="tool-form" onSubmit={checkList} noValidate>
          <div className="field">
            <label htmlFor={`${id}-list`}>DOIs, one per line (up to 20)</label>
            <textarea
              id={`${id}-list`}
              className="textarea"
              value={list}
              onChange={(e) => setList(e.target.value)}
              rows={6}
              spellCheck={false}
              aria-invalid={error?.kind === "invalid"}
              aria-describedby={error ? `${id}-error` : undefined}
            />
          </div>
          <button className="button" type="submit" disabled={busy}>
            Check list
          </button>
        </form>
      )}

      <p className="small muted" role="status" aria-live="polite">
        {status}
      </p>
      {error && (
        <p id={`${id}-error`} className="error" role="alert">
          {error.message}
          {error.kind === "rate-limited" || error.retryAfter ? ` ${waitText(error.retryAfter)}` : ""}
        </p>
      )}

      {mode === "doi" && resolved && (
        <section className="tool-result" aria-labelledby={`${id}-resolved`}>
          <h2 id={`${id}-resolved`} className="visually-hidden">
            Resolved record
          </h2>
          {resolved.partial && (
            <p className="small">
              <span className="badge" data-status="warning">
                Partial result
              </span>{" "}
              The record is complete; the DataCite comparison could not be made.
            </p>
          )}
          <RecordCard r={resolved.record} onAdd={() => add(resolved.record)} added={inCollection(resolved.record)} />
          {resolved.warnings.map((w) => (
            <p key={w} className="notice small">
              {w}
            </p>
          ))}
          {resolved.comparison && (
            <div className="table-wrap">
              <table>
                <caption>Crossref and DataCite comparison</caption>
                <thead>
                  <tr>
                    <th scope="col">Field</th>
                    <th scope="col">Crossref</th>
                    <th scope="col">DataCite</th>
                    <th scope="col">Agreement</th>
                  </tr>
                </thead>
                <tbody>
                  {resolved.comparison.map((c) => (
                    <tr key={c.field}>
                      <th scope="row">{FIELD_LABEL[c.field] ?? c.field}</th>
                      <td>{c.crossref ?? "—"}</td>
                      <td>{c.datacite ?? "—"}</td>
                      <td>
                        <span className="badge" data-status={c.agrees ? "ok" : "warning"}>
                          {c.agrees ? "Agrees" : "Differs"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}

      {mode === "search" && searchResults.length > 0 && (
        <section aria-labelledby={`${id}-results`}>
          <h2 id={`${id}-results`} className="visually-hidden">
            Search results
          </h2>
          <ol className="citation-results">
            {searchResults.map((r) => (
              <li key={r.doi}>
                <RecordCard r={r} onAdd={() => add(r)} added={inCollection(r)} />
              </li>
            ))}
          </ol>
        </section>
      )}

      {mode === "list" && listReport && (
        <section className="tool-result" aria-labelledby={`${id}-report`}>
          <h2 id={`${id}-report`} className="visually-hidden">
            List check report
          </h2>
          <ul className="small">
            <li>{listReport.found.length} resolved</li>
            <li>{listReport.duplicates} duplicates removed</li>
            {listReport.rejected.length > 0 && <li>Not DOIs: {listReport.rejected.join(", ")}</li>}
            {listReport.skipped.length > 0 && <li>Not checked (over the limit of 20, or after a rate limit): {listReport.skipped.join(", ")}</li>}
            {listReport.failed.map((f) => (
              <li key={f.doi}>
                {f.doi}: {f.reason}
              </li>
            ))}
          </ul>
          <button type="button" className="button button--ghost button--small" onClick={() => listReport.found.forEach(add)}>
            Add all resolved to collection
          </button>
          <ol className="citation-results">
            {listReport.found.map((r) => (
              <li key={r.doi}>
                <RecordCard r={r} />
              </li>
            ))}
          </ol>
        </section>
      )}

      <section className="collection card" aria-labelledby={`${id}-collection`}>
        <h2 id={`${id}-collection`} className="h4">
          Collection ({collection.length})
        </h2>
        {collection.length === 0 ? (
          <p className="small muted">Add records to export them together.</p>
        ) : (
          <>
            <ul className="small">
              {collection.map((r) => (
                <li key={r.doi}>
                  {r.title ?? r.doi}{" "}
                  <button type="button" className="link-button" onClick={() => setCollection((c) => c.filter((x) => x.doi !== r.doi))}>
                    Remove<span className="visually-hidden"> {r.title ?? r.doi}</span>
                  </button>
                </li>
              ))}
            </ul>
            <div className="cluster">
              <button type="button" className="button button--small" onClick={() => downloadText("citations.bib", toBibtex(collection), "application/x-bibtex")}>
                BibTeX
              </button>
              <button type="button" className="button button--ghost button--small" onClick={() => downloadText("citations.ris", toRis(collection), "application/x-research-info-systems")}>
                RIS
              </button>
              <button type="button" className="button button--ghost button--small" onClick={() => downloadText("citations.json", toCslJson(collection), "application/json")}>
                CSL-JSON
              </button>
              <button
                type="button"
                className="button button--ghost button--small"
                onClick={async () => setStatus((await copyText(toBibtex(collection))) ? "BibTeX copied to the clipboard." : "Copy failed; use the download instead.")}
              >
                Copy BibTeX
              </button>
            </div>
          </>
        )}
      </section>
    </div>
  );
}

export default function CitationResolver() {
  return (
    <IslandBoundary name="citation-resolver">
      <CitationResolverInner />
    </IslandBoundary>
  );
}
