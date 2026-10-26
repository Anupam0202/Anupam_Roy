/// <reference lib="webworker" />
/**
 * Document Workbench worker: parsing, chunking, indexing and search happen
 * here, off the main thread. It makes no network requests.
 */
import {
  DocumentError,
  buildBm25Index,
  buildDocument,
  detectKind,
  searchDocuments,
  sha256Hex,
  type Bm25Index,
  type EvidenceResult,
  type LocalDocument,
  type RankingMode,
} from "@workspace/proof-atlas-core/documents/index";

export type WorkerRequest =
  | { type: "add"; id: string; fileName?: string; kind?: LocalDocument["kind"]; text: string; byteLength?: number }
  | { type: "remove"; id: string }
  | { type: "search"; requestId: number; query: string; mode: RankingMode }
  | { type: "reset" };

export type WorkerResponse =
  | { type: "added"; id: string; fileName?: string; chunks: number; characters: number; sha256: string }
  | { type: "removed"; id: string }
  | { type: "results"; requestId: number; results: EvidenceResult[] }
  | { type: "error"; id?: string; code: string; message: string }
  | { type: "reset-done" };

const docs = new Map<string, LocalDocument & { index: Bm25Index; sha256: string }>();
const post = (msg: WorkerResponse) => (self as unknown as DedicatedWorkerGlobalScope).postMessage(msg);

self.addEventListener("message", async (event: MessageEvent<WorkerRequest>) => {
  const msg = event.data;
  try {
    if (msg.type === "add") {
      const kind = msg.kind ?? (msg.fileName ? detectKind(msg.fileName) : "paste");
      const doc = buildDocument(msg.text, { localId: msg.id, fileName: msg.fileName, kind, byteLength: msg.byteLength });
      const sha256 = await sha256Hex(doc.text);
      docs.set(msg.id, { ...doc, index: buildBm25Index(doc.chunks), sha256 });
      post({ type: "added", id: msg.id, fileName: msg.fileName, chunks: doc.chunks.length, characters: doc.text.length, sha256 });
    } else if (msg.type === "remove") {
      docs.delete(msg.id);
      post({ type: "removed", id: msg.id });
    } else if (msg.type === "search") {
      const results = searchDocuments([...docs.values()], msg.query, { mode: msg.mode, limit: 12 });
      post({ type: "results", requestId: msg.requestId, results });
    } else if (msg.type === "reset") {
      docs.clear();
      post({ type: "reset-done" });
    }
  } catch (error) {
    const code = error instanceof DocumentError ? error.code : "parser-failed";
    post({ type: "error", id: "id" in msg ? msg.id : undefined, code, message: error instanceof Error ? error.message : "The document could not be processed." });
  }
});
