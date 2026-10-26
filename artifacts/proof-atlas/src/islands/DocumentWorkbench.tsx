import { Fragment, useCallback, useEffect, useId, useLayoutEffect, useMemo, useRef, useState, type KeyboardEvent, type SyntheticEvent } from "react";
import {
  ACCEPTED_EXTENSIONS,
  DOCUMENT_LIMITS,
  buildEvidencePacket,
  evidencePacketToMarkdown,
  type EvidenceResult,
  type RankingMode,
} from "@workspace/proof-atlas-core/documents/index";
import type { WorkerRequest, WorkerResponse } from "../workers/local-index.worker";
import { SAMPLES } from "../lib/sample-documents";
import { IslandBoundary } from "./IslandBoundary";
import { downloadText, useClientValue } from "./util";

type Phase = "empty" | "loading-file" | "indexing" | "parser-failed" | "searchable" | "searching" | "results" | "exporting" | "worker-failed";

interface LoadedDoc {
  id: string;
  name: string;
  chunks: number;
  characters: number;
  sha256: string;
}

const escapeRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

function Highlighted({ text, terms, phrase }: { text: string; terms: string[]; phrase?: string }) {
  const needles = [phrase, ...terms].filter((t): t is string => Boolean(t && t.trim()));
  if (!needles.length) return <>{text}</>;
  const re = new RegExp(`(${needles.map(escapeRe).sort((a, b) => b.length - a.length).join("|")})`, "giu");
  const parts = text.split(re);
  return (
    <>
      {parts.map((part, i) => (i % 2 === 1 ? <mark key={i}>{part}</mark> : <Fragment key={i}>{part}</Fragment>))}
    </>
  );
}

function DocumentWorkbenchInner() {
  const id = useId();
  const worker = useRef<Worker | null>(null);
  const requestId = useRef(0);
  const [phase, setPhase] = useState<Phase>("empty");
  const [docs, setDocs] = useState<LoadedDoc[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [paste, setPaste] = useState("");
  // Optional ?sample= preset (synthetic text): its query fills the form until the visitor types.
  const sampleKey = useClientValue(() => new URLSearchParams(location.search).get("sample") ?? "", "");
  const preset = Object.hasOwn(SAMPLES, sampleKey) ? SAMPLES[sampleKey] : undefined;
  const [typedQuery, setQuery] = useState<string | null>(null);
  const query = typedQuery ?? preset?.query ?? "";
  const [searchedQuery, setLastQuery] = useState<string | null>(null);
  const lastQuery = searchedQuery ?? preset?.query ?? "";
  const [mode, setMode] = useState<RankingMode>("fused");
  /** The ranking that produced the current results; labels and exports use it, not the toggle. */
  const [resultMode, setResultMode] = useState<RankingMode>("fused");
  const [results, setResults] = useState<EvidenceResult[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [announce, setAnnounce] = useState("");
  const pending = useRef(0);
  // The worker's messages arrive outside React's render; these mirror the latest state for them.
  const docsRef = useRef<LoadedDoc[]>([]);
  const resultsRef = useRef<EvidenceResult[]>([]);
  useLayoutEffect(() => {
    docsRef.current = docs;
    resultsRef.current = results;
  }, [docs, results]);

  const handleMessage = useCallback((event: MessageEvent<WorkerResponse>) => {
    const msg = event.data;
    if (msg.type === "added") {
      pending.current = Math.max(0, pending.current - 1);
      setDocs((d) => [...d.filter((x) => x.id !== msg.id), { id: msg.id, name: msg.fileName ?? "Pasted text", chunks: msg.chunks, characters: msg.characters, sha256: msg.sha256 }]);
      setAnnounce(`${msg.fileName ?? "Pasted text"} indexed: ${msg.chunks} passages.`);
      if (!pending.current) setPhase((p) => (p === "results" ? p : "searchable"));
    } else if (msg.type === "error") {
      pending.current = Math.max(0, pending.current - 1);
      setErrors((e) => [...e, msg.message]);
      setAnnounce(`Error: ${msg.message}`);
      setPhase((p) => (p === "indexing" || p === "loading-file" ? "parser-failed" : p));
    } else if (msg.type === "results") {
      if (msg.requestId !== requestId.current) return;
      setResults(msg.results);
      setPhase("results");
      setAnnounce(msg.results.length ? `${msg.results.length} ${msg.results.length === 1 ? "passage" : "passages"} found.` : "No passages match.");
    } else if (msg.type === "removed") {
      // Results and selections from a removed document go with it.
      const removed = docsRef.current.find((x) => x.id === msg.id);
      const restDocs = docsRef.current.filter((x) => x.id !== msg.id);
      const restResults = resultsRef.current.filter((r) => r.documentId !== msg.id);
      setDocs(restDocs);
      setResults(restResults);
      setSelected((sel) => new Set([...sel].filter((k) => !k.startsWith(`${msg.id}::`))));
      if (removed) setAnnounce(`${removed.name} removed.`);
      if (!restDocs.length) setPhase("empty");
      else if (!restResults.length) setPhase((p) => (p === "results" ? "searchable" : p));
    }
  }, []);

  const startWorker = useCallback(() => {
    try {
      const w = new Worker(new URL("../workers/local-index.worker.ts", import.meta.url), { type: "module", name: "local-index" });
      w.addEventListener("message", handleMessage);
      w.addEventListener("error", () => setPhase("worker-failed"));
      worker.current = w;
    } catch {
      // Report a worker that cannot be constructed on the next tick, the same way as one that fails to load.
      queueMicrotask(() => setPhase("worker-failed"));
    }
  }, [handleMessage]);

  useEffect(() => {
    startWorker();
    return () => worker.current?.terminate();
  }, [startWorker]);

  const send = (msg: WorkerRequest) => worker.current?.postMessage(msg);

  /** Queues a document for indexing, within the document limit. Returns false when the limit is reached. */
  const addText = (text: string, fileName?: string, byteLength?: number, kind?: "markdown" | "text", docId: string = crypto.randomUUID()) => {
    if (docs.length + pending.current >= DOCUMENT_LIMITS.maxDocuments) {
      setErrors((e) => [...e, `Up to ${DOCUMENT_LIMITS.maxDocuments} documents at a time. Remove one first.`]);
      return false;
    }
    pending.current += 1;
    setPhase("indexing");
    send({ type: "add", id: docId, fileName, text, byteLength, ...(kind ? { kind } : {}) });
    return true;
  };

  // Index the preset and run its query. The worker handles messages in order, so the search runs after indexing.
  useEffect(() => {
    if (!preset || !worker.current) return;
    pending.current += 1;
    requestId.current += 1;
    worker.current.postMessage({ type: "add", id: `sample-${sampleKey}`, fileName: preset.fileName, text: preset.text, kind: preset.fileName.endsWith(".md") ? "markdown" : "text" } satisfies WorkerRequest);
    worker.current.postMessage({ type: "search", requestId: requestId.current, query: preset.query, mode: "fused" } satisfies WorkerRequest);
  }, [preset, sampleKey]);

  const onFiles = async (files: FileList | null) => {
    if (!files) return;
    setErrors([]);
    for (const file of [...files]) {
      const lower = file.name.toLowerCase();
      if (!ACCEPTED_EXTENSIONS.some((ext) => lower.endsWith(ext))) {
        setErrors((e) => [...e, `${file.name}: unsupported type. PDF, DOCX, images and archives are not supported in this version — paste the text instead.`]);
        continue;
      }
      if (file.size > DOCUMENT_LIMITS.maxBytes) {
        setErrors((e) => [...e, `${file.name}: ${(file.size / 1024 / 1024).toFixed(1)} MiB is over the 15 MiB limit.`]);
        continue;
      }
      setPhase("loading-file");
      try {
        addText(await file.text(), file.name, file.size);
      } catch {
        setErrors((e) => [...e, `${file.name}: the file could not be read.`]);
      }
    }
  };

  const runSearch = (q: string, ranking: RankingMode) => {
    requestId.current += 1;
    setPhase("searching");
    setLastQuery(q);
    setResultMode(ranking);
    setSelected(new Set());
    send({ type: "search", requestId: requestId.current, query: q, mode: ranking });
  };

  const search = (e?: SyntheticEvent) => {
    e?.preventDefault();
    const q = query.trim();
    if (!q || !docs.length) return;
    runSearch(q, mode);
  };

  /** Changing the ranking re-runs the current search, so results always match their label. */
  const changeMode = (next: RankingMode) => {
    setMode(next);
    if (next !== resultMode && lastQuery && docs.length && (phase === "results" || phase === "searching")) runSearch(lastQuery, next);
  };

  const reset = () => {
    worker.current?.terminate();
    setDocs([]);
    setResults([]);
    setSelected(new Set());
    setErrors([]);
    setPaste("");
    setQuery("");
    setLastQuery("");
    setResultMode(mode);
    pending.current = 0;
    setPhase("empty");
    startWorker();
    setAnnounce("All local documents and results were cleared.");
  };

  const key = (r: EvidenceResult) => `${r.documentId}::${r.chunk.id}`;
  const toggle = (r: EvidenceResult) =>
    setSelected((s) => {
      const next = new Set(s);
      if (next.has(key(r))) next.delete(key(r));
      else next.add(key(r));
      return next;
    });

  const comparison = useMemo(
    () =>
      docs.map((d) => {
        const own = results.filter((r) => r.documentId === d.id);
        return { id: d.id, name: d.name, matches: own.length, best: own.reduce((m, r) => Math.max(m, r.coverage), 0) };
      }),
    [docs, results],
  );

  const exportPacket = (format: "json" | "md") => {
    setPhase("exporting");
    const chosen = results.filter((r) => selected.has(key(r)));
    const byDoc = new Map<string, EvidenceResult[]>();
    for (const r of chosen.length ? chosen : results) byDoc.set(r.documentId, [...(byDoc.get(r.documentId) ?? []), r]);
    const packets = [...byDoc.entries()].flatMap(([docId, selections]) => {
      const d = docs.find((x) => x.id === docId);
      if (!d) return [];
      return [buildEvidencePacket({ document: { localId: d.id, fileName: d.name, sha256: d.sha256 }, query: lastQuery, mode: resultMode, selections })];
    });
    if (!packets.length) {
      setPhase("results");
      setAnnounce("Nothing to export: the results belonged to a removed document.");
      return;
    }
    if (format === "json") downloadText("evidence-packet.json", JSON.stringify(packets.length === 1 ? packets[0] : packets, null, 2), "application/json");
    else downloadText("evidence-packet.md", packets.map(evidencePacketToMarkdown).join("\n---\n\n"), "text/markdown");
    setPhase("results");
    setAnnounce(`Evidence packet downloaded (${format.toUpperCase()}).`);
  };

  const quoted = /^"(.+)"$/.exec(lastQuery)?.[1];
  // Shown inside typographic quotes, so a quoted phrase is not quoted twice.
  const shownQuery = quoted ?? lastQuery;

  /** Up and Down move between results' checkboxes; Tab order is unchanged. */
  const onResultKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== "ArrowDown" && e.key !== "ArrowUp") return;
    const items = [...(e.currentTarget.closest("ol")?.querySelectorAll<HTMLInputElement>("input[type=checkbox]") ?? [])];
    const index = items.indexOf(e.currentTarget);
    e.preventDefault();
    items[Math.min(items.length - 1, Math.max(0, index + (e.key === "ArrowDown" ? 1 : -1)))]?.focus();
  };

  if (phase === "worker-failed")
    return (
      <p className="notice" role="alert">
        The local search worker could not start in this browser. Nothing was uploaded. Try a current version of Chrome, Firefox, Safari or Edge.
      </p>
    );

  return (
    <div className="tool">
      <p className="notice notice--tech small">
        <strong>Runs only in your browser.</strong> Files and text are processed here and never uploaded. Reset clears everything.
      </p>

      <div className="grid grid--2 inputs">
        <div className="field">
          <label htmlFor={`${id}-file`}>Add files</label>
          <input id={`${id}-file`} className="file-input" type="file" multiple accept={ACCEPTED_EXTENSIONS.join(",")} onChange={(e) => void onFiles(e.target.files)} aria-describedby={`${id}-file-hint`} />
          <p id={`${id}-file-hint`} className="hint">
            .txt, .md, .json or .csv · up to 15 MiB and 2,000,000 characters each · up to 3 documents.
          </p>
        </div>
        <form
          className="field"
          onSubmit={(e) => {
            e.preventDefault();
            if (paste.trim()) {
              addText(paste);
              setPaste("");
            }
          }}
        >
          <label htmlFor={`${id}-paste`}>Or paste text</label>
          <textarea id={`${id}-paste`} className="textarea" value={paste} onChange={(e) => setPaste(e.target.value)} rows={4} />
          <div className="cluster">
            <button className="button button--ghost button--small" type="submit" disabled={!paste.trim()}>
              Add pasted text
            </button>
            {Object.entries(SAMPLES).map(([k, s]) => (
              <button
                key={k}
                type="button"
                className="chip example"
                onClick={() => addText(s.text, s.fileName, undefined, s.fileName.endsWith(".md") ? "markdown" : "text", `sample-${k}-${Date.now()}`)}
              >
                Load {s.fileName}
              </button>
            ))}
          </div>
        </form>
      </div>

      {errors.length > 0 && (
        <ul className="notice errors" role="alert">
          {errors.map((e, i) => (
            <li key={i}>{e}</li>
          ))}
        </ul>
      )}

      {docs.length > 0 && (
        <div className="docs">
          <h2 className="h4">Documents</h2>
          <ul>
            {docs.map((d) => (
              <li key={d.id} className="doc-row">
                <span className="doc-name">{d.name}</span>
                <span className="muted small">
                  {d.chunks} passages · {d.characters.toLocaleString("en")} characters · SHA-256 {d.sha256.slice(0, 12)}…
                </span>
                <button type="button" className="button button--ghost button--small" onClick={() => send({ type: "remove", id: d.id })}>
                  Remove<span className="visually-hidden"> {d.name}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      <form className="search-form" onSubmit={search}>
        <div className="field">
          <label htmlFor={`${id}-q`}>Question or phrase</label>
          <div className="tool-row">
            <input id={`${id}-q`} className="input" value={query} onChange={(e) => setQuery(e.target.value)} placeholder='e.g. What handles a scanned PDF?  or  "rank fusion"' disabled={!docs.length} aria-describedby={`${id}-q-hint`} />
            <button className="button" type="submit" disabled={!docs.length || !query.trim() || phase === "searching"}>
              Search
            </button>
          </div>
          <p id={`${id}-q-hint`} className="hint">
            Wrap a phrase in double quotes for an exact match.
          </p>
        </div>
        <fieldset className="mode">
          <legend className="label">Ranking</legend>
          <div className="segmented">
            <button type="button" aria-pressed={mode === "fused"} onClick={() => changeMode("fused")}>
              RRF of BM25 + term coverage
            </button>
            <button type="button" aria-pressed={mode === "bm25"} onClick={() => changeMode("bm25")}>
              BM25 only
            </button>
          </div>
        </fieldset>
      </form>

      <p className="small muted" role="status" aria-live="polite">
        {phase === "indexing" ? "Indexing locally…" : phase === "searching" ? "Searching…" : announce}
      </p>

      {phase === "results" || phase === "exporting" ? (
        <section className="tool-result" aria-labelledby={`${id}-results`}>
          <div className="result-bar">
            <h2 id={`${id}-results`} className="h4">
              {results.length ? `Evidence for “${shownQuery}”` : quoted ? `No passage contains the exact phrase “${shownQuery}”` : `No passages match “${shownQuery}”`}
            </h2>
            {results.length > 0 && (
              <div className="cluster">
                <button type="button" className="button button--small" onClick={() => exportPacket("json")}>
                  Export packet (JSON)
                </button>
                <button type="button" className="button button--ghost button--small" onClick={() => exportPacket("md")}>
                  Export Markdown
                </button>
              </div>
            )}
          </div>
          {results.length > 0 && <p className="hint">Select passages to export only those; otherwise all results are exported.</p>}
          {docs.length > 1 && results.length > 0 && (
            <div className="table-wrap compare">
              <table>
                <caption className="visually-hidden">Document comparison for this query</caption>
                <thead>
                  <tr>
                    <th scope="col">Document</th>
                    <th scope="col" className="num">
                      Matching passages
                    </th>
                    <th scope="col" className="num">
                      Best term coverage
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {comparison.map((c) => (
                    <tr key={c.id}>
                      <th scope="row">{c.name}</th>
                      <td className="num">{c.matches}</td>
                      <td className="num">{Math.round(c.best * 100)}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <ol className="results" aria-label="Matching passages (use the up and down arrow keys to move between them)">
            {results.map((r, i) => (
              <li key={key(r)} className="result card">
                <div className="result-meta">
                  <label className="check">
                    <input type="checkbox" checked={selected.has(key(r))} onChange={() => toggle(r)} onKeyDown={onResultKey} />
                    <span>
                      #{i + 1} · {r.location}
                    </span>
                  </label>
                  <span className="mono small muted">
                    {resultMode === "fused" ? `RRF ${r.score.toFixed(4)} · ` : ""}BM25 {r.bm25.toFixed(2)} · coverage {Math.round(r.coverage * 100)}%
                  </span>
                </div>
                <blockquote className="quote">
                  <Highlighted text={r.chunk.text} terms={quoted ? [] : r.matchedTerms} phrase={quoted} />
                </blockquote>
                {!quoted && r.missingTerms.length > 0 && <p className="hint">Not in this passage: {r.missingTerms.join(", ")}</p>}
              </li>
            ))}
          </ol>
        </section>
      ) : null}

      {(docs.length > 0 || results.length > 0) && (
        <p>
          <button type="button" className="button button--ghost button--small" onClick={reset}>
            Reset and clear everything
          </button>
        </p>
      )}
    </div>
  );
}

export default function DocumentWorkbench() {
  return (
    <IslandBoundary name="document-workbench">
      <DocumentWorkbenchInner />
    </IslandBoundary>
  );
}
