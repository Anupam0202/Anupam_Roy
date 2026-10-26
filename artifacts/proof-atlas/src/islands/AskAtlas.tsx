import { useId, useRef, useState, type SyntheticEvent } from "react";
import type { CorpusEntry } from "@workspace/proof-atlas-core/ai/atlas";
import { sanitizeText } from "@workspace/proof-atlas-core/documents/text";
import { STATUS_LABEL } from "@workspace/proof-atlas-core/evidence/types";
import { IslandBoundary } from "./IslandBoundary";

type Phase = "idle" | "loading" | "answered" | "abstained" | "evidence-only" | "rate-limited" | "error";

interface EvidenceRef {
  id: string;
  claimId: string;
  title: string;
  provenance: CorpusEntry["provenance"];
}

type Reason = "disabled" | "provider-error" | "no-evidence" | "budget" | "busy" | "blocked" | "incomplete";

interface AskResponse {
  mode: "ai" | "deterministic";
  reason?: Reason;
  result?: { answer: string; citationIds: string[]; state: "answered" | "abstained" };
  corpusVersion?: string;
  evidence: EvidenceRef[];
}

/** Why the closest ledger entries are shown instead of an AI answer. */
const REASON_TEXT: Record<Reason, string> = {
  disabled: "AI is turned off. Showing the closest ledger entries.",
  "provider-error": "The assistant could not answer. Showing the closest ledger entries.",
  "no-evidence": "Nothing in the ledger matches this question.",
  budget: "The assistant has reached today's limit. Showing the closest ledger entries.",
  busy: "The assistant is busy right now. Showing the closest ledger entries.",
  blocked: "The assistant's safety filter withheld its answer. Showing the closest ledger entries.",
  incomplete: "The assistant's answer was cut off, so it is not shown. Showing the closest ledger entries.",
};

/** Same rules as the server: sanitized, whitespace collapsed, at least three characters. */
function normalizeQuestion(input: string): string | null {
  const q = sanitizeText(input, 500).replace(/\s+/g, " ").trim();
  return q.length >= 3 ? q : null;
}

const SUGGESTIONS = [
  "Is NexusRAG production ready?",
  "What did Anupam build at Accenture?",
  "Are the credentials verified?",
  "Does PlantPal measure carbon exactly?",
];

/** The ledger corpus and retrieval load only when the browser has to answer on its own. */
let localCorpus: Promise<{ corpus: CorpusEntry[]; version: string; retrieve: (q: string) => CorpusEntry[] }> | null = null;
const loadCorpus = () =>
  (localCorpus ??= import("@workspace/proof-atlas-core/ai/atlas").then(
    (atlas) => {
      const corpus = atlas.buildCorpus();
      return { corpus, version: atlas.corpusVersion(corpus), retrieve: (q: string) => atlas.retrieveEvidence(q, corpus, 4) };
    },
    (error) => {
      // A failed download (for example offline) is retried on the next question.
      localCorpus = null;
      throw error;
    },
  ));

async function localFallback(question: string, reason: Reason): Promise<AskResponse> {
  const { retrieve, version } = await loadCorpus();
  return {
    mode: "deterministic",
    reason,
    corpusVersion: version,
    evidence: retrieve(question).map(({ id, claimId, title, provenance }) => ({ id, claimId, title, provenance })),
  };
}

function AnswerText({ text, evidence }: { text: string; evidence: EvidenceRef[] }) {
  const byId = new Map(evidence.map((e) => [e.id, e]));
  const parts = text.split(/(\[E\d{1,3}\])/g);
  return (
    <p className="atlas-answer">
      {parts.map((part, i) => {
        const id = /^\[(E\d{1,3})\]$/.exec(part)?.[1];
        const ref = id ? byId.get(id) : undefined;
        if (!ref) return <span key={i}>{part}</span>;
        return (
          <a key={i} href={`#${ref.claimId}`} className="atlas-cite" aria-label={`Source ${id}: ${ref.title}`}>
            [{id}]
          </a>
        );
      })}
    </p>
  );
}

function AskAtlasInner() {
  const inputId = useId();
  const [question, setQuestion] = useState("");
  const [phase, setPhase] = useState<Phase>("idle");
  const [response, setResponse] = useState<AskResponse | null>(null);
  const [message, setMessage] = useState("");
  const controller = useRef<AbortController | null>(null);

  /** Neither the assistant nor the ledger code could be loaded, which usually means the connection is down. */
  function unreachable() {
    setResponse(null);
    setPhase("error");
    setMessage("The assistant could not be reached. Check your connection and try again; the ledger below is unchanged.");
  }

  async function ask(raw: string) {
    const q = normalizeQuestion(raw);
    if (!q) {
      // Evidence from an earlier question must not look like the answer to this one.
      controller.current?.abort();
      setResponse(null);
      setPhase("error");
      setMessage("Ask a question of at least three characters.");
      return;
    }
    controller.current?.abort();
    const ac = new AbortController();
    controller.current = ac;
    setPhase("loading");
    setMessage("");
    try {
      const res = await fetch("/api/ai/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ question: q }),
        signal: AbortSignal.any ? AbortSignal.any([ac.signal, AbortSignal.timeout(25_000)]) : ac.signal,
      });
      if (res.status === 429) {
        const fallback = await localFallback(q, "busy").catch(() => null);
        if (ac !== controller.current) return;
        if (!fallback) return unreachable();
        setResponse(fallback);
        setPhase("rate-limited");
        return;
      }
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = (await res.json()) as AskResponse;
      if (ac !== controller.current) return;
      setResponse(data);
      setPhase(data.result ? (data.result.state === "answered" && data.mode === "ai" ? "answered" : "abstained") : "evidence-only");
    } catch {
      if (ac !== controller.current) return;
      const fallback = await localFallback(q, "provider-error").catch(() => null);
      if (ac !== controller.current) return;
      if (!fallback) return unreachable();
      setResponse(fallback);
      setPhase("evidence-only");
      setMessage("The assistant could not be reached, so these are the closest ledger entries.");
    }
  }

  function onSubmit(event: SyntheticEvent) {
    event.preventDefault();
    void ask(question);
  }

  const status =
    phase === "loading"
      ? "Retrieving public evidence…"
      : phase === "answered"
        ? "Answer ready. AI-generated from the cited ledger entries."
        : phase === "abstained"
          ? "The assistant declined: the evidence does not cover this question."
          : phase === "evidence-only"
            ? message || (response?.reason ? REASON_TEXT[response.reason] : "Showing the closest ledger entries without AI.")
            : phase === "rate-limited"
              ? "Too many questions for now. Showing the closest ledger entries instead."
              : phase === "error"
                ? message
                : "";

  const evidence = response?.evidence ?? [];
  return (
    <div className="atlas">
      <form className="atlas-form" onSubmit={onSubmit}>
        <label htmlFor={inputId} className="label">
          Your question <span className="chip">AI · public evidence only</span>
        </label>
        <div className="atlas-row">
          <input
            id={inputId}
            className="input"
            value={question}
            maxLength={500}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="e.g. Is NexusRAG production ready?"
            autoComplete="off"
          />
          <button className="button" type="submit" disabled={phase === "loading"}>
            {phase === "loading" ? "Asking…" : "Ask"}
          </button>
        </div>
        <div className="cluster atlas-suggestions" role="group" aria-label="Suggested questions">
          {SUGGESTIONS.map((s) => (
            <button
              key={s}
              type="button"
              className="chip atlas-suggestion"
              onClick={() => {
                setQuestion(s);
                void ask(s);
              }}
            >
              {s}
            </button>
          ))}
        </div>
      </form>
      <p className="small muted atlas-status" role="status" aria-live="polite">
        {status}
      </p>
      {response && (phase === "answered" || phase === "abstained") && response.result && (
        <div className="card atlas-result">
          {phase === "answered" ? <AnswerText text={response.result.answer} evidence={evidence} /> : <p>{response.result.answer}</p>}
        </div>
      )}
      {evidence.length > 0 && (
        <div className="atlas-evidence">
          <p className="eyebrow">{phase === "answered" ? "Evidence cited" : "Closest ledger entries"}</p>
          <ol>
            {evidence.map((e) => (
              <li key={e.id}>
                <span className="mono muted">{e.id}</span>{" "}
                <a href={`#${e.claimId}`}>{e.title}</a>{" "}
                <span className="badge" data-status={e.provenance}>
                  {STATUS_LABEL[e.provenance]}
                </span>
              </li>
            ))}
          </ol>
        </div>
      )}
      {response && evidence.length === 0 && phase !== "loading" && (
        <p className="small">No ledger entries match. Try the search filters below.</p>
      )}
      {response?.corpusVersion && phase !== "loading" && (
        <p className="hint atlas-version">
          Searched ledger version <span className="mono">{response.corpusVersion}</span>.
        </p>
      )}
    </div>
  );
}

export default function AskAtlas() {
  return (
    <IslandBoundary name="ask-atlas">
      <AskAtlasInner />
    </IslandBoundary>
  );
}
