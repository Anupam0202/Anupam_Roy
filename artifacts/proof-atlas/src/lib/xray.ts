/**
 * Architecture X-Ray: a representative RAG pipeline. The responsibility,
 * failure modes and tradeoffs are general engineering guidance (illustrative).
 * The "NexusRAG" lines point to ledger claims, so each one can be checked.
 */

export type LayerStatus = "runtime" | "partial" | "research" | "site";

export const LAYER_STATUS_LABEL: Record<LayerStatus, string> = {
  runtime: "In NexusRAG's deployed gateway",
  partial: "Partly in the gateway; more in the research path",
  research: "Research path only",
  site: "Also used on this site",
};

export interface XrayLayer {
  id: string;
  name: string;
  responsibility: string;
  input: string;
  output: string;
  failureModes: string[];
  tradeoffs: string[];
  nexusrag: { text: string; claimId: string }[];
  status: LayerStatus;
  /** Optional deep link into a Lab or Workbench tool. */
  try?: { label: string; href: string };
}

export const layers: XrayLayer[] = [
  {
    id: "user",
    name: "User and request",
    responsibility: "Turn a person's question into a request that is authenticated and scoped to one workspace.",
    input: "A question, a signed-in session and a workspace.",
    output: "A scoped request the rest of the pipeline can trust.",
    failureModes: ["Request reaches another tenant's data.", "Instructions hidden in the question try to change system behaviour.", "The question is too vague to retrieve anything useful."],
    tradeoffs: ["Sending chat history helps follow-up questions but widens what reaches the model and what can leak."],
    nexusrag: [
      { text: "Supabase Auth is the only identity and session authority.", claimId: "nexus-auth" },
      { text: "The gateway sends only the current question, not prior chat history.", claimId: "nexus-runtime-settings" },
    ],
    status: "runtime",
  },
  {
    id: "ingestion",
    name: "Ingestion",
    responsibility: "Accept files, extract their text and hand heavy work to a queue.",
    input: "Uploaded files.",
    output: "Extracted text with document metadata.",
    failureModes: ["Unsupported or oversized files.", "Scanned PDFs with no text layer produce empty documents.", "A crash mid-extraction leaves a half-indexed document."],
    tradeoffs: ["OCR recovers scanned pages but adds latency, cost and recognition errors.", "Retries recover from transient failures but must not duplicate work."],
    nexusrag: [
      { text: "The gateway accepts eleven formats up to 10,000,000 bytes; Excel, GIF and BMP are not supported there.", claimId: "nexus-formats" },
      { text: "Heavy ingestion runs through a queue with up to 3 retries and a dead-letter queue.", claimId: "nexus-queue" },
      { text: "OCR is reported off in the deployed gateway.", claimId: "nexus-capabilities" },
      { text: "The research path has OCR with a circuit breaker.", claimId: "nexus-research-pipeline" },
    ],
    status: "partial",
  },
  {
    id: "indexing",
    name: "Indexing",
    responsibility: "Split text into chunks, embed them and store vectors next to the authoritative records.",
    input: "Extracted text.",
    output: "Chunks, vectors and source records.",
    failureModes: ["A chunk boundary splits the fact a question needs.", "The vector index drifts out of sync with the source records.", "Changing the embedding model silently invalidates old vectors."],
    tradeoffs: ["Semantic chunking keeps ideas together but costs more compute than fixed-size chunks.", "A reconstructible index is simpler to trust than one that holds the only copy."],
    nexusrag: [
      { text: "Supabase is authoritative; Qdrant vectors are reconstructible.", claimId: "nexus-data-authority" },
      { text: "Semantic chunking is reported off in the deployed gateway.", claimId: "nexus-capabilities" },
      { text: "The research path has semantic and hierarchical chunking.", claimId: "nexus-research-pipeline" },
    ],
    status: "partial",
  },
  {
    id: "retrieval",
    name: "Retrieval",
    responsibility: "Find candidate passages for the question.",
    input: "The question and the index.",
    output: "Candidate lists from dense (vector) and lexical search.",
    failureModes: ["Lexical search misses synonyms.", "Dense search returns passages that are similar but wrong.", "Too few candidates drop the answer; too many add noise."],
    tradeoffs: ["Retrieving more chunks raises recall but costs tokens and can dilute the answer."],
    nexusrag: [
      { text: "Hybrid search is reported on in the deployed gateway.", claimId: "nexus-capabilities" },
      { text: "Retrieval is limited to between 1 and 12 chunks.", claimId: "nexus-runtime-settings" },
    ],
    status: "runtime",
    try: { label: "Search your own files with BM25 and fusion", href: "/workbench/documents/" },
  },
  {
    id: "ranking",
    name: "Ranking",
    responsibility: "Merge the candidate lists into one order.",
    input: "Two or more ranked candidate lists.",
    output: "One ordered list of passages.",
    failureModes: ["Raw scores from different systems are not comparable.", "Ties are broken by accident of input order.", "One list dominates the result."],
    tradeoffs: ["Rank-based fusion is robust to score scales but ignores how confident each system was.", "A cross-encoder reranker is usually more precise but slower and costlier."],
    nexusrag: [
      { text: "The gateway blends rank contributions: α·dense + (1−α)·(lexical + 0.02·coverage).", claimId: "nexus-fusion" },
      { text: "Reranking is reported off in the deployed gateway.", claimId: "nexus-capabilities" },
      { text: "The research path has BM25 + vector retrieval with RRF and cross-encoder reranking.", claimId: "nexus-research-pipeline" },
    ],
    status: "partial",
    try: { label: "Compare RRF with the gateway blend", href: "/lab/retrieval-fusion/?preset=nexusrag" },
  },
  {
    id: "generation",
    name: "Generation",
    responsibility: "Write an answer using only the retrieved passages, marking which passage supports each statement.",
    input: "The question and the ranked passages.",
    output: "A draft answer with source markers.",
    failureModes: ["Statements the passages do not support.", "The model ignores the passages and answers from memory.", "The model provider is slow or unavailable."],
    tradeoffs: ["Streaming shows text sooner, but text shown before validation may later be withdrawn."],
    nexusrag: [
      { text: "Streaming is reported off in the deployed gateway.", claimId: "nexus-capabilities" },
      { text: "A user's own Gemini key is stored encrypted and never returned to the browser.", claimId: "nexus-byok" },
    ],
    status: "runtime",
  },
  {
    id: "validation",
    name: "Validation and citations",
    responsibility: "Check that every citation points to a passage that was actually retrieved; abstain otherwise.",
    input: "The draft answer and the list of retrieved source ids.",
    output: "A published answer, or an abstention.",
    failureModes: ["Citations to sources that were never retrieved.", "A real citation attached to a statement it does not support — a reference check cannot catch this."],
    tradeoffs: ["A strict gate abstains more often; a loose one publishes unsupported answers."],
    nexusrag: [
      { text: "Answers are published only if every [S#] citation refers to a retrieved source; otherwise the system abstains.", claimId: "nexus-citation-gate" },
      { text: "The evaluation harness measures citation precision and answer support.", claimId: "nexus-evals" },
      { text: "This site's Ask the Atlas applies the same rule to its own evidence ledger.", claimId: "site-ask-public-only" },
    ],
    status: "site",
    try: { label: "Ask the Atlas", href: "/sources/#ask" },
  },
  {
    id: "safeguards",
    name: "Safeguards",
    responsibility: "Refuse what cannot be enforced, keep tenants apart and keep secrets out of the browser.",
    input: "Every request and data operation.",
    output: "A refusal, or an action with a truthful record.",
    failureModes: ["A filter that is not enforced reports success anyway.", "Data leaks across workspaces.", "Keys reach the client."],
    tradeoffs: ["Failing closed blocks some legitimate requests in exchange for never claiming what did not happen."],
    nexusrag: [
      { text: "Unsupported filters, retention and erasure fail closed; no success receipt is fabricated.", claimId: "nexus-fail-closed" },
      { text: "The evaluation harness measures cross-workspace leakage.", claimId: "nexus-evals" },
      { text: "Cloudflare is the public security and routing boundary.", claimId: "nexus-data-authority" },
    ],
    status: "runtime",
  },
];
