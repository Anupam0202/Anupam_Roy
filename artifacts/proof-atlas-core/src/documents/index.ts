/**
 * Client-local document evidence engine used by the Proof Workbench.
 * Pure functions only: no network, no storage, no timers.
 */
import { reciprocalRankFusion } from "../algorithms/rrf";
import { TOKENIZER_VERSION, sanitizeText, tokenize } from "./text";

export const DOCUMENT_LIMITS = {
  maxBytes: 15 * 1024 * 1024,
  maxCharacters: 2_000_000,
  maxDocuments: 3,
  targetChunkCharacters: 900,
} as const;

export const ACCEPTED_EXTENSIONS = [".txt", ".md", ".markdown", ".json", ".csv"] as const;

export type DocumentErrorCode =
  | "unsupported-type"
  | "oversized"
  | "too-many-characters"
  | "empty"
  | "parser-failed";

export class DocumentError extends Error {
  constructor(
    readonly code: DocumentErrorCode,
    message: string,
  ) {
    super(message);
    this.name = "DocumentError";
  }
}

export interface Chunk {
  id: string;
  index: number;
  /** Character offsets into the normalized document text, [start, end). */
  start: number;
  end: number;
  lineStart: number;
  lineEnd: number;
  text: string;
}

export interface LocalDocument {
  localId: string;
  fileName?: string;
  kind: "text" | "markdown" | "json" | "csv" | "paste";
  text: string;
  chunks: Chunk[];
}

export function detectKind(fileName: string): LocalDocument["kind"] {
  const lower = fileName.toLowerCase();
  if (lower.endsWith(".md") || lower.endsWith(".markdown")) return "markdown";
  if (lower.endsWith(".json")) return "json";
  if (lower.endsWith(".csv")) return "csv";
  if (lower.endsWith(".txt")) return "text";
  if (/\.(pdf|docx?|zip|gz|tar|7z|rar|png|jpe?g|gif|webp|tiff?)$/.test(lower))
    throw new DocumentError(
      "unsupported-type",
      `${fileName}: this file type is not supported in the launch version. PDF and DOCX extraction, OCR and archives are not available; paste the text instead.`,
    );
  throw new DocumentError(
    "unsupported-type",
    `${fileName}: unsupported file type. Use .txt, .md, .json or .csv, or paste text.`,
  );
}

const MAX_PRETTY_JSON_DEPTH = 64;

/** Deepest array or object nesting in JSON text, in one pass; brackets inside strings are skipped. */
export function jsonDepth(text: string): number {
  let depth = 0;
  let max = 0;
  let inString = false;
  for (let i = 0; i < text.length; i += 1) {
    const ch = text.charCodeAt(i);
    if (inString) {
      if (ch === 92) i += 1; // a backslash escapes the next character
      else if (ch === 34) inString = false;
    } else if (ch === 34) inString = true;
    else if (ch === 91 || ch === 123) max = Math.max(max, ++depth);
    else if (ch === 93 || ch === 125) depth -= 1;
  }
  return max;
}

/** Validates size and normalizes text before chunking. JSON is pretty-printed when that stays within the limits. */
export function prepareText(raw: string, kind: LocalDocument["kind"], byteLength?: number): string {
  if (byteLength !== undefined && byteLength > DOCUMENT_LIMITS.maxBytes)
    throw new DocumentError(
      "oversized",
      `The file is ${(byteLength / 1024 / 1024).toFixed(1)} MiB; the limit is 15 MiB.`,
    );
  if (raw.length > DOCUMENT_LIMITS.maxCharacters)
    throw new DocumentError(
      "too-many-characters",
      `The text has ${raw.length.toLocaleString("en")} characters; the limit is 2,000,000.`,
    );
  let text = sanitizeText(raw, DOCUMENT_LIMITS.maxCharacters);
  if (kind === "json") {
    let value: unknown;
    try {
      value = JSON.parse(text);
    } catch {
      throw new DocumentError("parser-failed", "The JSON file could not be parsed.");
    }
    // Pretty-print for readable passages unless nesting or size would make the indented
    // copy explode (deep nesting grows it quadratically); then index the text as written.
    if (jsonDepth(text) <= MAX_PRETTY_JSON_DEPTH) {
      const pretty = JSON.stringify(value, null, 2);
      if (pretty.length <= DOCUMENT_LIMITS.maxCharacters) text = pretty;
    }
  }
  if (!text.trim()) throw new DocumentError("empty", "The document has no text.");
  return text;
}

/**
 * Splits text into chunks on line boundaries, aiming for ~900 characters.
 * Chunk ids are stable for the same text: c0, c1, ….
 */
export function chunkText(text: string, target: number = DOCUMENT_LIMITS.targetChunkCharacters): Chunk[] {
  // Segments are whole lines, except very long lines, which are split at a
  // space (or hard-cut) so no chunk grows without bound.
  const segments: Array<{ text: string; line: number }> = [];
  const lines = text.split("\n");
  lines.forEach((line, i) => {
    let rest = i < lines.length - 1 ? `${line}\n` : line;
    while (rest.length > target * 1.5) {
      const space = rest.lastIndexOf(" ", target);
      const cut = space >= target / 2 ? space + 1 : target;
      segments.push({ text: rest.slice(0, cut), line: i + 1 });
      rest = rest.slice(cut);
    }
    if (rest) segments.push({ text: rest, line: i + 1 });
  });

  const chunks: Chunk[] = [];
  let cursor = 0;
  let start = 0;
  let firstLine = 1;
  let current = "";
  const flush = () => {
    const trimmed = current.trimEnd();
    if (trimmed.trim()) {
      chunks.push({
        id: `c${chunks.length}`,
        index: chunks.length,
        start,
        end: start + trimmed.length,
        lineStart: firstLine,
        lineEnd: firstLine + (trimmed.match(/\n/g)?.length ?? 0),
        text: trimmed,
      });
    }
    current = "";
  };
  for (const segment of segments) {
    const blank = !segment.text.trim();
    if (current && (current.length + segment.text.length > target || (blank && current.length >= target / 3))) flush();
    if (!current && blank) {
      // Skip blank lines between chunks.
    } else {
      if (!current) {
        start = cursor;
        firstLine = segment.line;
      }
      current += segment.text;
    }
    cursor += segment.text.length;
  }
  flush();
  return chunks;
}

export function buildDocument(
  raw: string,
  options: { localId: string; fileName?: string; kind: LocalDocument["kind"]; byteLength?: number },
): LocalDocument {
  const text = prepareText(raw, options.kind, options.byteLength);
  return { localId: options.localId, fileName: options.fileName, kind: options.kind, text, chunks: chunkText(text) };
}

export interface Bm25Index {
  chunkIds: string[];
  termFrequencies: Map<string, number>[];
  lengths: number[];
  documentFrequency: Map<string, number>;
  averageLength: number;
}

export const BM25_PARAMETERS = { k1: 1.2, b: 0.75 } as const;

export function buildBm25Index(chunks: readonly Chunk[]): Bm25Index {
  const termFrequencies: Map<string, number>[] = [];
  const documentFrequency = new Map<string, number>();
  const lengths: number[] = [];
  for (const chunk of chunks) {
    const tf = new Map<string, number>();
    const tokens = tokenize(chunk.text);
    for (const t of tokens) tf.set(t, (tf.get(t) ?? 0) + 1);
    for (const t of tf.keys()) documentFrequency.set(t, (documentFrequency.get(t) ?? 0) + 1);
    termFrequencies.push(tf);
    lengths.push(tokens.length);
  }
  const total = lengths.reduce((a, b) => a + b, 0);
  return {
    chunkIds: chunks.map((c) => c.id),
    termFrequencies,
    lengths,
    documentFrequency,
    averageLength: chunks.length ? total / chunks.length : 0,
  };
}

/** Okapi BM25 with the non-negative IDF variant ln(1 + (N − n + 0.5)/(n + 0.5)). */
export function bm25Scores(index: Bm25Index, query: string): Map<string, number> {
  const { k1, b } = BM25_PARAMETERS;
  const terms = [...new Set(tokenize(query))];
  const n = index.chunkIds.length;
  const scores = new Map<string, number>();
  index.chunkIds.forEach((id, i) => {
    let score = 0;
    for (const term of terms) {
      const f = index.termFrequencies[i].get(term) ?? 0;
      if (!f) continue;
      const df = index.documentFrequency.get(term) ?? 0;
      const idf = Math.log(1 + (n - df + 0.5) / (df + 0.5));
      const norm = index.averageLength ? index.lengths[i] / index.averageLength : 1;
      score += idf * ((f * (k1 + 1)) / (f + k1 * (1 - b + b * norm)));
    }
    if (score > 0) scores.set(id, score);
  });
  return scores;
}

export interface PhraseMatch {
  start: number;
  end: number;
}

/** Case-insensitive exact phrase occurrences, as offsets into `text`. */
export function findPhrase(text: string, phrase: string, limit = 50): PhraseMatch[] {
  const needle = phrase.trim().toLowerCase();
  if (!needle) return [];
  const haystack = text.toLowerCase();
  const matches: PhraseMatch[] = [];
  let from = 0;
  while (matches.length < limit) {
    const at = haystack.indexOf(needle, from);
    if (at === -1) break;
    matches.push({ start: at, end: at + needle.length });
    from = at + Math.max(needle.length, 1);
  }
  return matches;
}

/** Share of distinct query terms that appear in the chunk (0–1). */
export function termCoverage(chunkText: string, query: string): { coverage: number; matched: string[]; missing: string[] } {
  const terms = [...new Set(tokenize(query))];
  if (!terms.length) return { coverage: 0, matched: [], missing: [] };
  const present = new Set(tokenize(chunkText));
  const matched = terms.filter((t) => present.has(t));
  return { coverage: matched.length / terms.length, matched, missing: terms.filter((t) => !present.has(t)) };
}

export type RankingMode = "bm25" | "fused";

export interface EvidenceResult {
  documentId: string;
  fileName?: string;
  chunk: Chunk;
  location: string;
  bm25: number;
  coverage: number;
  matchedTerms: string[];
  missingTerms: string[];
  phraseMatches: PhraseMatch[];
  /** Score used for ordering (BM25, or RRF of BM25 and coverage rankings). */
  score: number;
}

export function describeLocation(doc: Pick<LocalDocument, "fileName" | "localId">, chunk: Chunk): string {
  const name = doc.fileName ?? doc.localId;
  return chunk.lineStart === chunk.lineEnd
    ? `${name}, line ${chunk.lineStart}`
    : `${name}, lines ${chunk.lineStart}–${chunk.lineEnd}`;
}

export function searchDocuments(
  docs: ReadonlyArray<LocalDocument & { index?: Bm25Index }>,
  query: string,
  { mode = "fused" as RankingMode, limit = 10 } = {},
): EvidenceResult[] {
  const results: EvidenceResult[] = [];
  const quoted = /^"(.+)"$/.exec(query.trim())?.[1];
  for (const doc of docs) {
    const index = doc.index ?? buildBm25Index(doc.chunks);
    const bm25 = bm25Scores(index, quoted ?? query);
    const candidates = doc.chunks
      .map((chunk) => {
        const cov = termCoverage(chunk.text, quoted ?? query);
        const phraseMatches = findPhrase(chunk.text, quoted ?? query, 20);
        return {
          documentId: doc.localId,
          fileName: doc.fileName,
          chunk,
          location: describeLocation(doc, chunk),
          bm25: bm25.get(chunk.id) ?? 0,
          coverage: cov.coverage,
          matchedTerms: cov.matched,
          missingTerms: cov.missing,
          phraseMatches,
          score: 0,
        } satisfies EvidenceResult;
      })
      .filter((r) => (quoted ? r.phraseMatches.length > 0 : r.bm25 > 0 || r.phraseMatches.length > 0));
    results.push(...candidates);
  }
  const key = (r: EvidenceResult) => `${r.documentId}::${r.chunk.id}`;
  if (mode === "fused" && results.length) {
    const byBm25 = [...results].sort((a, b) => b.bm25 - a.bm25 || (key(a) < key(b) ? -1 : 1)).map(key);
    const byCoverage = [...results]
      .sort((a, b) => b.coverage - a.coverage || b.phraseMatches.length - a.phraseMatches.length || (key(a) < key(b) ? -1 : 1))
      .map(key);
    const fused = new Map(
      reciprocalRankFusion([
        { label: "BM25", ids: byBm25 },
        { label: "Term coverage", ids: byCoverage },
      ]).results.map((r) => [r.id, r.score]),
    );
    for (const r of results) r.score = fused.get(key(r)) ?? 0;
  } else {
    for (const r of results) r.score = r.bm25;
  }
  return results.sort((a, b) => b.score - a.score || (key(a) < key(b) ? -1 : 1)).slice(0, limit);
}

export interface EvidencePacket {
  version: 1;
  createdAt: string;
  document: { localId: string; fileName?: string; sha256?: string };
  query: string;
  method: { tokenizerVersion: string; ranking: string; parameters: Record<string, number | string> };
  selections: Array<{ chunkId: string; location: string; quote: string; score?: number }>;
}

export async function sha256Hex(text: string): Promise<string> {
  const digest = await globalThis.crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

export function buildEvidencePacket(input: {
  document: { localId: string; fileName?: string; sha256?: string };
  query: string;
  mode: RankingMode;
  selections: ReadonlyArray<EvidenceResult>;
  createdAt?: Date;
}): EvidencePacket {
  return {
    version: 1,
    createdAt: (input.createdAt ?? new Date()).toISOString(),
    document: input.document,
    query: input.query,
    method: {
      tokenizerVersion: TOKENIZER_VERSION,
      ranking: input.mode === "fused" ? "rrf(bm25, term-coverage)" : "bm25",
      parameters: {
        k1: BM25_PARAMETERS.k1,
        b: BM25_PARAMETERS.b,
        ...(input.mode === "fused" ? { rrfK: 60 } : {}),
        chunkTargetCharacters: DOCUMENT_LIMITS.targetChunkCharacters,
      },
    },
    selections: input.selections.map((r) => ({
      chunkId: r.chunk.id,
      location: r.location,
      quote: r.chunk.text,
      score: Number(r.score.toFixed(6)),
    })),
  };
}

/** One-line Markdown text: line breaks become spaces, and characters that start links, emphasis, code or HTML are escaped. */
const inlineMarkdown = (text: string) => text.replace(/[\r\n\u2028\u2029]+/g, " ").replace(/[\\`*_[\]<>]/g, "\\$&");

/**
 * Markdown view of a packet. User-supplied text (query, file name, quotes)
 * cannot add headings, links or HTML: inline fields are escaped, and every
 * quote line, whatever its line ending, stays inside the blockquote.
 */
export function evidencePacketToMarkdown(packet: EvidencePacket): string {
  const lines = [
    `# Evidence packet`,
    ``,
    `- Query: ${inlineMarkdown(packet.query)}`,
    `- Document: ${inlineMarkdown(packet.document.fileName ?? packet.document.localId)}${packet.document.sha256 ? ` (SHA-256 ${packet.document.sha256})` : ""}`,
    `- Created: ${packet.createdAt}`,
    `- Method: ${packet.method.ranking}, tokenizer ${packet.method.tokenizerVersion}`,
    ``,
  ];
  packet.selections.forEach((s, i) => {
    lines.push(`## ${i + 1}. ${inlineMarkdown(s.location)}`, ``);
    for (const line of s.quote.split(/\r\n|[\r\n\u2028\u2029]/)) lines.push(`> ${line.replace(/</g, "\\<")}`);
    lines.push(``);
  });
  return lines.join("\n");
}
