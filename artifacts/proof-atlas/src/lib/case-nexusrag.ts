/**
 * NexusRAG case-study structure. Every row cites a ledger claim; wording stays
 * within what the repository at 85b14f1 documents or implements.
 */
export type CellState = "on" | "off" | "gated" | "absent" | "documented";

export interface LaneNode {
  name: string;
  detail: string;
}

export const runtimeLane: LaneNode[] = [
  { name: "Next.js 16 frontend", detail: "Served from Cloudflare through OpenNext." },
  { name: "Cloudflare gateway", detail: "The public security and routing boundary; tenant-scoped API." },
  { name: "Supabase", detail: "Auth, Postgres and Storage — the authoritative records." },
  { name: "Qdrant", detail: "Tenant- and version-fenced vectors; reconstructible from Supabase." },
  { name: "Gemini", detail: "Embeddings and generation, admitted under quota and budget gates." },
  { name: "Cited answer or abstention", detail: "Published only when every [S#] citation points at a retrieved source." },
];

export const researchLane: LaneNode[] = [
  { name: "Multi-format ingestion", detail: "Loaders for PDF, DOCX, Excel/CSV, images and text, with OCR." },
  { name: "Smart chunking", detail: "Recursive, semantic and hierarchical strategies." },
  { name: "Hybrid retrieval", detail: "BM25 with Qdrant or FAISS, fused with RRF." },
  { name: "Cross-encoder rerank", detail: "ms-marco-MiniLM-L-6-v2 over the fused candidates." },
  { name: "Query shaping", detail: "Multi-query expansion, adaptive K, history-aware reformulation, semantic cache." },
  { name: "FastAPI + WebSocket", detail: "Token streaming with source panels." },
];

export interface FeatureRow {
  feature: string;
  runtime: { state: CellState; note: string };
  research: { state: CellState; note: string };
  claimId: string;
}

export const featureMatrix: FeatureRow[] = [
  {
    feature: "Hybrid lexical + dense retrieval",
    runtime: { state: "on", note: "Term-coverage lexical list blended with Qdrant dense ranks (α = 0.6)." },
    research: { state: "documented", note: "BM25 + Qdrant/FAISS with RRF fusion." },
    claimId: "nexus-fusion",
  },
  {
    feature: "Cross-encoder reranking",
    runtime: { state: "off", note: "reranking: false" },
    research: { state: "documented", note: "ms-marco-MiniLM-L-6-v2" },
    claimId: "nexus-capabilities",
  },
  {
    feature: "Contextual chunk enrichment",
    runtime: { state: "off", note: "enable_contextual_enrichment: false" },
    research: { state: "documented", note: "Optional; quality gain not established." },
    claimId: "nexus-runtime-settings",
  },
  {
    feature: "Semantic cache",
    runtime: { state: "off", note: "semantic_cache: false" },
    research: { state: "documented", note: "Embedding-similarity cache." },
    claimId: "nexus-capabilities",
  },
  {
    feature: "Token streaming",
    runtime: { state: "off", note: "streaming: false" },
    research: { state: "documented", note: "WebSocket frames." },
    claimId: "nexus-capabilities",
  },
  {
    feature: "OCR for scans and images",
    runtime: { state: "gated", note: "ocr: false; Gemini extraction needs approved processing, rights and budget." },
    research: { state: "documented", note: "Gemini Vision with Cloud Vision fallback and a circuit breaker." },
    claimId: "nexus-formats",
  },
  {
    feature: "Conversation history in prompts",
    runtime: { state: "off", note: "Only the current question is sent." },
    research: { state: "documented", note: "History-aware reformulation." },
    claimId: "nexus-runtime-settings",
  },
  {
    feature: "Cite-or-abstain answers",
    runtime: { state: "on", note: "Invalid or missing [S#] citations become an abstention." },
    research: { state: "absent", note: "Not described for this lane." },
    claimId: "nexus-citation-gate",
  },
  {
    feature: "Encrypted bring-your-own Gemini key",
    runtime: { state: "on", note: "AES-GCM per account; never returned to the browser." },
    research: { state: "documented", note: "Runtime key entry on quota errors." },
    claimId: "nexus-byok",
  },
  {
    feature: "Retrieval evaluation harness",
    runtime: { state: "absent", note: "Not part of the gateway." },
    research: { state: "documented", note: "recall@k, MRR, nDCG, citation precision, leakage." },
    claimId: "nexus-evals",
  },
];

export const CELL_LABEL: Record<CellState, string> = {
  on: "On",
  off: "Off",
  gated: "Gated",
  absent: "Not in this lane",
  documented: "Documented",
};

export const constraints = [
  { title: "Workspace boundary", detail: "Every document, vector and finding is scoped to a workspace; Qdrant points are fenced by workspace and version.", claimId: "nexus-data-authority" },
  { title: "Bounded input", detail: "Uploads are capped at 10,000,000 bytes and a fixed list of formats; Excel, GIF and BMP are refused at the gateway.", claimId: "nexus-formats" },
  { title: "Spend and rights gates", detail: "Gemini extraction of binary files requires approved non-sensitive processing, rights and budgets; metered operations stay REVIEW_REQUIRED.", claimId: "nexus-formats" },
  { title: "Small retrieval budget", detail: "1–12 chunks per answer and only the current question in the prompt.", claimId: "nexus-runtime-settings" },
  { title: "No fabricated success", detail: "Unsupported filters, retention and erasure fail closed; blocked deletions stay tombstoned.", claimId: "nexus-fail-closed" },
];

export const lifecycle = [
  { step: "Upload", detail: "A bounded file enters a workspace and is stored in Supabase Storage." },
  { step: "Queue", detail: "Heavy processing runs through a Cloudflare Queue with up to 3 retries and a dead-letter queue." },
  { step: "Index", detail: "Chunks (1600 characters, 240 overlap) are embedded and written to Qdrant with workspace and version ids." },
  { step: "Retrieve", detail: "Dense and lexical candidates are blended and capped at 12." },
  { step: "Answer", detail: "Gemini answers from the retrieved sources; the citation gate publishes or abstains." },
  { step: "Review", detail: "Private, versioned findings with independent review and export receipts." },
];

export const notEstablished = [
  "Production readiness or defect-free operation (the repository says so explicitly).",
  "That retrieval or answer quality is good in production — the evaluation harness uses a small synthetic set.",
  "That contextual enrichment improves answers.",
  "Two-identity, end-to-end product flows, invitations, and complete multi-product workflows.",
  "An availability SLA — the Qdrant free tier can suspend after inactivity.",
  "That any given research-lane feature runs in the deployed gateway.",
];
