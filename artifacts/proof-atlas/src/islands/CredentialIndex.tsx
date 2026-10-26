import { useEffect, useId, useMemo, useRef, useState } from "react";
import {
  credentials,
  displayTitle,
  formatCredentialDate,
  LINK_CHECK_LABEL,
  PDF_CHECK_LABEL,
  yearCounts,
  type Credential,
} from "@workspace/proof-atlas-core/data/credentials";
import { IslandBoundary } from "./IslandBoundary";
import { useClientValue, useHydrated } from "./util";

type Sort = "issued-desc" | "issued-asc" | "title" | "issuer";
type View = "grid" | "list";

const ISSUERS = [...new Set(credentials.map((c) => c.issuer))].sort((a, b) => a.localeCompare(b, "en"));
/** Issue years present in the data, newest first. */
const YEARS = yearCounts().map((y) => y.year);
const SORTS: Array<[Sort, string]> = [
  ["issued-desc", "Newest first"],
  ["issued-asc", "Oldest first"],
  ["title", "Title A–Z"],
  ["issuer", "Issuer"],
];

const fmt = formatCredentialDate;

/** Verification states present in the data, as "pdf:<state>" or "link:<state>". */
const CHECKS: Array<[string, string]> = [
  ...[...new Set(credentials.map((c) => c.pdfCheck))].map((v): [string, string] => [`pdf:${v}`, PDF_CHECK_LABEL[v]]),
  ...[...new Set(credentials.map((c) => c.linkCheck))].map((v): [string, string] => [`link:${v}`, LINK_CHECK_LABEL[v]]),
];
const matchesCheck = (c: Credential, check: string) =>
  !check || (check.startsWith("pdf:") ? c.pdfCheck === check.slice(4) : c.linkCheck === check.slice(5));
/** The usual state, stated once above the list; cards mention only exceptions. */
const isUsualCheck = (c: Credential) => c.pdfCheck === "text_matched" && c.linkCheck === "link_unchecked";

interface Filters {
  q: string;
  issuer: string;
  year: string;
  check: string;
  sort: Sort;
  view: View;
}
const DEFAULT_FILTERS: Filters = { q: "", issuer: "", year: "", check: "", sort: "issued-desc", view: "grid" };

/** Filters from a query string; unknown values fall back to the defaults. */
function readParams(search: string): Filters {
  const p = new URLSearchParams(search);
  return {
    q: p.get("q") ?? "",
    issuer: ISSUERS.includes(p.get("issuer") ?? "") ? (p.get("issuer") as string) : "",
    year: YEARS.includes(p.get("year") ?? "") ? (p.get("year") as string) : "",
    check: CHECKS.some(([v]) => v === p.get("check")) ? (p.get("check") as string) : "",
    sort: (SORTS.map((s) => s[0]) as string[]).includes(p.get("sort") ?? "") ? (p.get("sort") as Sort) : ("issued-desc" as Sort),
    view: p.get("view") === "list" ? ("list" as View) : ("grid" as View),
  };
}

function CredentialCard({ c, view }: { c: Credential; view: View }) {
  return (
    <li className={`cred card cred--${view}`}>
      {view === "grid" && (
        <a className="cred-thumb" href={`/${c.pdf}`} target="_blank" rel="noopener noreferrer" tabIndex={-1} aria-hidden="true">
          <img
            src={`/${c.thumbnail.replace("cert-thumbs/", "cert-thumbs-480/")}`}
            srcSet={`/${c.thumbnail.replace("cert-thumbs/", "cert-thumbs-480/")} 480w, /${c.thumbnail} ${c.thumbnailSize[0]}w`}
            sizes="(min-width: 640px) 320px, 90vw"
            alt=""
            width={c.thumbnailSize[0]}
            height={c.thumbnailSize[1]}
            loading="lazy"
            decoding="async"
          />
        </a>
      )}
      <div className="cred-body">
        <p className="eyebrow">
          {c.issuer} · {c.level}
        </p>
        <h3 className="cred-title">{displayTitle(c.title)}</h3>
        <p className="small muted">
          Issued on <time dateTime={c.issuedOn}>{fmt(c.issuedOn)}</time>
        </p>
        {!isUsualCheck(c) && (
          <p className="hint">
            {PDF_CHECK_LABEL[c.pdfCheck]} · {LINK_CHECK_LABEL[c.linkCheck]}
          </p>
        )}
        {c.credentialId && (
          <p className="mono small cred-id">
            ID <span>{c.credentialId}</span>
          </p>
        )}
        {c.notes.map((n) => (
          <p key={n} className="hint">
            {n}
          </p>
        ))}
        <p className="cluster cred-links small">
          <a href={`/${c.pdf}`} target="_blank" rel="noopener noreferrer">
            Certificate PDF<span className="visually-hidden"> for {displayTitle(c.title)} (opens in a new tab)</span>
          </a>
          <a href={c.verifyUrl} target="_blank" rel="noopener noreferrer">
            Issuer page<span className="visually-hidden"> for {displayTitle(c.title)} (opens in a new tab)</span>
          </a>
        </p>
      </div>
    </li>
  );
}

function CredentialIndexInner() {
  const searchId = useId();
  // Server render and hydration use the default filters; the browser's URL follows.
  const hydrated = useHydrated();
  const search = useClientValue(() => window.location.search, "");
  const fromUrl = useMemo(() => readParams(search), [search]);
  const [changed, setChanged] = useState<Partial<Filters>>({});
  const { q, issuer, year, check, sort, view } = { ...fromUrl, ...changed };
  const set = <K extends keyof Filters>(key: K) => (value: Filters[K]) => setChanged((c) => ({ ...c, [key]: value }));
  const [setQ, setIssuer, setYear, setCheck, setSort, setView] = [set("q"), set("issuer"), set("year"), set("check"), set("sort"), set("view")];
  const searchRef = useRef<HTMLInputElement>(null);

  // The search box at the top of the page sends its query here.
  useEffect(() => {
    const onSearch = (e: Event) => {
      setChanged((c) => ({ ...c, q: String((e as CustomEvent<string>).detail ?? "") }));
      searchRef.current?.focus();
    };
    window.addEventListener("credential-search", onSearch);
    return () => window.removeEventListener("credential-search", onSearch);
  }, []);

  // Keep the URL in step with the filters, once the browser's own URL has been read.
  useEffect(() => {
    if (!hydrated) return;
    const p = new URLSearchParams();
    if (q) p.set("q", q);
    if (issuer) p.set("issuer", issuer);
    if (year) p.set("year", year);
    if (check) p.set("check", check);
    if (sort !== "issued-desc") p.set("sort", sort);
    if (view !== "grid") p.set("view", view);
    const query = p.toString();
    window.history.replaceState(null, "", `${query ? `?${query}` : window.location.pathname}${window.location.hash}`);
  }, [q, issuer, year, check, sort, view, hydrated]);

  const rows = useMemo(() => {
    const term = q.trim().toLowerCase();
    const list = credentials.filter(
      (c) =>
        (!issuer || c.issuer === issuer) &&
        (!year || c.issuedOn.startsWith(year)) &&
        matchesCheck(c, check) &&
        (!term || `${c.title} ${c.issuer} ${c.level} ${c.credentialId ?? ""}`.toLowerCase().includes(term)),
    );
    const byTitle = (a: Credential, b: Credential) => a.title.localeCompare(b.title, "en") || a.id.localeCompare(b.id);
    list.sort((a, b) =>
      sort === "title"
        ? byTitle(a, b)
        : sort === "issuer"
          ? a.issuer.localeCompare(b.issuer, "en") || byTitle(a, b)
          : sort === "issued-asc"
            ? a.issuedOn.localeCompare(b.issuedOn) || byTitle(a, b)
            : b.issuedOn.localeCompare(a.issuedOn) || byTitle(a, b),
    );
    return list;
  }, [q, issuer, year, check, sort]);

  const reset = () => setChanged({ ...DEFAULT_FILTERS });

  return (
    <div className="cred-index">
      <form className="cred-controls" role="search" aria-label="Filter credentials" onSubmit={(e) => e.preventDefault()}>
        <div className="field cred-search">
          <label htmlFor={`${searchId}-q`}>Search titles, issuers and IDs</label>
          <input ref={searchRef} id={`${searchId}-q`} className="input" type="search" value={q} onChange={(e) => setQ(e.target.value)} autoComplete="off" />
        </div>
        <div className="field">
          <label htmlFor={`${searchId}-issuer`}>Issuer</label>
          <select id={`${searchId}-issuer`} className="select" value={issuer} onChange={(e) => setIssuer(e.target.value)}>
            <option value="">All issuers</option>
            {ISSUERS.map((i) => (
              <option key={i} value={i}>
                {i}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label htmlFor={`${searchId}-year`}>Issued in</label>
          <select id={`${searchId}-year`} className="select" value={year} onChange={(e) => setYear(e.target.value)}>
            <option value="">Any year</option>
            {YEARS.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label htmlFor={`${searchId}-check`}>Verification</label>
          <select id={`${searchId}-check`} className="select" value={check} onChange={(e) => setCheck(e.target.value)}>
            <option value="">All verification states</option>
            {CHECKS.map(([v, l]) => (
              <option key={v} value={v}>
                {l}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label htmlFor={`${searchId}-sort`}>Sort</label>
          <select id={`${searchId}-sort`} className="select" value={sort} onChange={(e) => setSort(e.target.value as Sort)}>
            {SORTS.map(([v, l]) => (
              <option key={v} value={v}>
                {l}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <span className="label" id={`${searchId}-view`}>
            View
          </span>
          <div className="segmented" role="group" aria-labelledby={`${searchId}-view`}>
            {(["grid", "list"] as View[]).map((v) => (
              <button key={v} type="button" aria-pressed={view === v} onClick={() => setView(v)}>
                {v === "grid" ? "Grid" : "List"}
              </button>
            ))}
          </div>
        </div>
        <button type="button" className="button button--ghost button--small cred-reset" onClick={reset}>
          Reset
        </button>
      </form>
      <p className="small muted" role="status" aria-live="polite">
        {rows.length} of {credentials.length} records
      </p>
      <p className="hint">
        Each record shows the issue date printed on its certificate. Unless a record says otherwise, its issue date and credential ID match the text of its certificate PDF,
        and its issuer link has not been checked yet.
      </p>
      {rows.length ? (
        <ol className={`cred-list cred-list--${view}`}>
          {rows.map((c) => (
            <CredentialCard key={c.id} c={c} view={view} />
          ))}
        </ol>
      ) : (
        <p className="notice">
          No records match these filters.{" "}
          <button type="button" className="button button--ghost button--small" onClick={reset}>
            Reset filters
          </button>
        </p>
      )}
    </div>
  );
}

export default function CredentialIndex() {
  return (
    <IslandBoundary name="credential-index">
      <CredentialIndexInner />
    </IslandBoundary>
  );
}
