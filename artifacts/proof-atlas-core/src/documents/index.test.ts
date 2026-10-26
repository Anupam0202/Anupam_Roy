import { describe, expect, it } from "vitest";
import {
  DocumentError,
  buildBm25Index,
  buildDocument,
  buildEvidencePacket,
  bm25Scores,
  chunkText,
  detectKind,
  evidencePacketToMarkdown,
  findPhrase,
  jsonDepth,
  DOCUMENT_LIMITS,
  prepareText,
  searchDocuments,
  sha256Hex,
  termCoverage,
} from "./index";
import { sanitizeText, tokenize } from "./text";

const SAMPLE = [
  "Ingestion",
  "Scanned PDFs are routed to optical character recognition before chunking.",
  "",
  "Retrieval",
  "Hybrid retrieval combines lexical BM25 scores with dense vector similarity.",
  "Reciprocal rank fusion merges the two rankings.",
  "",
  "Answering",
  "The model answers only from retrieved chunks and cites each source.",
].join("\n");

describe("text utilities", () => {
  it("tokenizes Unicode text and drops stopwords", () => {
    expect(tokenize("The Café serves 3 crêpes!")).toEqual(["café", "serve", "3", "crêpe"]);
    expect(tokenize("the and of", { keepStopwords: true })).toEqual(["the", "and", "of"]);
  });

  it("folds simple plurals without touching -ss, -us or -is words", () => {
    expect(tokenize("credentials requests class status analysis bus gas")).toEqual(["credential", "request", "class", "status", "analysis", "bus", "gas"]);
    for (const word of ["credentials", "policies", "passes"]) expect(word.startsWith(tokenize(word)[0])).toBe(true);
  });

  it("removes control and invisible characters, normalizes newlines and clamps", () => {
    expect(sanitizeText("a\u0000b\r\nc​d\u0007", 100)).toBe("ab\ncd");
    expect(sanitizeText("abcdef", 3)).toBe("abc");
  });
});

describe("file handling", () => {
  it("accepts launch file types and rejects others with a clear code", () => {
    expect(detectKind("notes.MD")).toBe("markdown");
    expect(detectKind("data.csv")).toBe("csv");
    expect(() => detectKind("scan.pdf")).toThrow(/not supported in the launch version/);
    expect(() => detectKind("archive.zip")).toThrowError(DocumentError);
    expect(() => detectKind("binary.exe")).toThrow(/unsupported file type/);
  });

  it("enforces byte and character limits", () => {
    expect(() => prepareText("x", "text", 16 * 1024 * 1024)).toThrow(/limit is 15 MiB/);
    expect(() => prepareText("x".repeat(2_000_001), "text")).toThrow(/2,000,000/);
    expect(() => prepareText("   \n ", "text")).toThrow(/no text/);
  });

  it("pretty-prints JSON and reports invalid JSON", () => {
    expect(prepareText('{"a":[1,2]}', "json")).toBe('{\n  "a": [\n    1,\n    2\n  ]\n}');
    expect(() => prepareText("{bad", "json")).toThrow(/could not be parsed/);
  });
});

describe("chunkText", () => {
  it("produces chunks whose offsets point at exactly their text", () => {
    const text = Array.from({ length: 60 }, (_, i) => `Line ${i} ${"word ".repeat(i % 9)}`.trim()).join("\n");
    const chunks = chunkText(text, 200);
    expect(chunks.length).toBeGreaterThan(3);
    for (const chunk of chunks) {
      expect(text.slice(chunk.start, chunk.end)).toBe(chunk.text);
      expect(chunk.text.length).toBeLessThanOrEqual(200);
    }
    expect(chunks.map((c) => c.id)).toEqual(chunks.map((_, i) => `c${i}`));
  });

  it("reports one-based line ranges that ignore trailing blank lines", () => {
    const chunks = chunkText(SAMPLE, 120);
    for (const c of chunks) {
      const lines = SAMPLE.split("\n").slice(c.lineStart - 1, c.lineEnd).join("\n");
      expect(lines).toBe(c.text);
    }
  });

  it("splits very long single lines without losing text", () => {
    const text = "alpha ".repeat(1000).trim();
    const chunks = chunkText(text, 300);
    expect(chunks.length).toBeGreaterThan(5);
    for (const c of chunks) expect(text.slice(c.start, c.end)).toBe(c.text);
    expect(chunks.map((c) => c.text).join(" ").replace(/\s+/g, " ")).toBe(text);
  });

  it("is stable for the same input", () => {
    expect(chunkText(SAMPLE)).toEqual(chunkText(SAMPLE));
  });
});

describe("search", () => {
  const doc = buildDocument(SAMPLE, { localId: "doc-1", fileName: "pipeline.md", kind: "markdown" });
  const small = { ...doc, chunks: chunkText(doc.text, 120) };

  it("ranks the chunk that answers the question first", () => {
    const results = searchDocuments([small], "What handles a scanned PDF?");
    expect(results[0].chunk.text).toMatch(/Scanned PDFs/);
    expect(results[0].location).toMatch(/^pipeline\.md, line/);
  });

  it("supports exact phrase search with quotes", () => {
    const results = searchDocuments([small], '"rank fusion"');
    expect(results).toHaveLength(1);
    expect(results[0].phraseMatches).toHaveLength(1);
    const m = results[0].phraseMatches[0];
    expect(results[0].chunk.text.slice(m.start, m.end).toLowerCase()).toBe("rank fusion");
  });

  it("returns nothing when no chunk matches", () => {
    expect(searchDocuments([small], "kubernetes autoscaling")).toEqual([]);
  });

  it("computes BM25 only for chunks containing a query term", () => {
    const index = buildBm25Index(small.chunks);
    const scores = bm25Scores(index, "dense vector");
    expect([...scores.keys()]).toHaveLength(1);
    expect([...scores.values()][0]).toBeGreaterThan(0);
  });

  it("reports term coverage with matched and missing terms", () => {
    expect(termCoverage("BM25 lexical scores", "lexical dense scores")).toEqual({
      coverage: 2 / 3,
      matched: ["lexical", "score"],
      missing: ["dense"],
    });
  });

  it("finds every case-insensitive phrase occurrence", () => {
    expect(findPhrase("Abc abc ABC", "abc")).toEqual([
      { start: 0, end: 3 },
      { start: 4, end: 7 },
      { start: 8, end: 11 },
    ]);
  });

  it("searches across multiple documents and labels each result", () => {
    const other = buildDocument("Scanned invoices go through OCR first.", { localId: "doc-2", fileName: "ops.txt", kind: "text" });
    const results = searchDocuments([small, other], "scanned");
    expect(new Set(results.map((r) => r.documentId))).toEqual(new Set(["doc-1", "doc-2"]));
  });
});

describe("evidence packet", () => {
  it("records method, parameters and exact quotes", async () => {
    const doc = buildDocument(SAMPLE, { localId: "doc-1", fileName: "pipeline.md", kind: "markdown" });
    const results = searchDocuments([doc], "scanned PDF", { mode: "bm25" });
    const sha = await sha256Hex(doc.text);
    const packet = buildEvidencePacket({
      document: { localId: doc.localId, fileName: doc.fileName, sha256: sha },
      query: "scanned PDF",
      mode: "bm25",
      selections: results.slice(0, 1),
      createdAt: new Date("2026-10-25T00:00:00Z"),
    });
    expect(packet).toMatchObject({
      version: 1,
      createdAt: "2026-10-25T00:00:00.000Z",
      method: { tokenizerVersion: "pa-tok-2", ranking: "bm25", parameters: { k1: 1.2, b: 0.75 } },
    });
    expect(sha).toMatch(/^[0-9a-f]{64}$/);
    expect(doc.text).toContain(packet.selections[0].quote);
    const md = evidencePacketToMarkdown(packet);
    expect(md).toContain("# Evidence packet");
    expect(md).toContain("> ");
  });
});

describe("sanitizeText hardening", () => {
  it("strips bidi overrides, isolates, invisible operators and soft hyphens", () => {
    expect(sanitizeText("a\u202Eb\u2066c\u2069d\u2060e\u00ADf", 100)).toBe("abcdef");
  });

  it("never ends on half of a surrogate pair", () => {
    expect(sanitizeText("ab\u{1F600}", 3)).toBe("ab");
    expect(sanitizeText("ab\u{1F600}", 4)).toBe("ab\u{1F600}");
  });
});

describe("Markdown export with hostile text", () => {
  const hostile = (quote: string, query = "q") =>
    evidencePacketToMarkdown(
      buildEvidencePacket({
        document: { localId: "d", fileName: "notes](https://evil.io)\n# Owned.md" },
        query,
        mode: "bm25",
        selections: [{ chunk: { id: "c0", index: 0, start: 0, end: quote.length, lineStart: 1, lineEnd: 1, text: quote }, location: "lines 1", documentId: "d", score: 1, bm25: 1, coverage: 1, matchedTerms: [], missingTerms: [], phraseMatches: [] }],
        createdAt: new Date("2026-10-25T00:00:00Z"),
      }),
    );

  it("keeps every quote line inside the blockquote, whatever its line ending", () => {
    const md = hostile('He said "stop"\r# Injected heading - [link](https://evil.io)\r\n```\n<script>alert(1)</script>');
    const body = md.split("\n").slice(md.split("\n").indexOf("## 1. lines 1") + 2).filter(Boolean);
    expect(body.every((line) => line.startsWith("> "))).toBe(true);
    expect(md).not.toMatch(/^# Injected/m);
    expect(md).toContain('> He said "stop"');
    expect(md).toContain("> \\<script>alert(1)\\</script>");
  });

  it("escapes the query and file name so they cannot add lines, links or HTML", () => {
    const md = hostile("quote", 'x"\n# Heading\n[click](https://evil.io) <img src=x onerror=alert(1)> *bold* `code`');
    const lines = md.split("\n");
    expect(lines.filter((l) => l.startsWith("# "))).toEqual(["# Evidence packet"]);
    expect(md).toContain('- Query: x" # Heading \\[click\\](https://evil.io) \\<img src=x onerror=alert(1)\\> \\*bold\\* \\`code\\`');
    expect(md).toContain("- Document: notes\\](https://evil.io) # Owned.md");
  });
});

describe("parser bombs", () => {
  const time = <T>(fn: () => T): [T, number] => {
    const t = performance.now();
    const out = fn();
    return [out, performance.now() - t];
  };

  it("measures JSON nesting in one pass, ignoring brackets inside strings", () => {
    expect(jsonDepth('{"a":[1,{"b":"[[[{{{"}]}')).toBe(3);
    expect(jsonDepth('"\\"[["')).toBe(0);
  });

  it("indexes deeply nested JSON as written instead of expanding it quadratically", () => {
    const deep = "[".repeat(5_000) + "]".repeat(5_000);
    const [doc, ms] = time(() => buildDocument(deep, { localId: "d", fileName: "deep.json", kind: "json" }));
    expect(ms).toBeLessThan(500);
    expect(doc.text).toBe(deep);
  });

  it("never lets an extremely deep document escape as a stack overflow", () => {
    const deeper = "[".repeat(900_000) + "]".repeat(900_000);
    const [outcome, ms] = time(() => {
      try {
        return buildDocument(deeper, { localId: "d", fileName: "deeper.json", kind: "json" }).text.length;
      } catch (error) {
        return error;
      }
    });
    expect(ms).toBeLessThan(2_000);
    if (typeof outcome !== "number") expect(outcome).toBeInstanceOf(DocumentError);
  });

  it("keeps a large array as written when pretty-printing would pass the character limit", () => {
    const wide = `[${"1,".repeat(990_000)}1]`;
    const doc = buildDocument(wide, { localId: "d", fileName: "wide.json", kind: "json" });
    expect(doc.text.length).toBeLessThanOrEqual(DOCUMENT_LIMITS.maxCharacters);
    expect(doc.text).toBe(wide);
  });

  it("splits a CSV with one enormous line into bounded passages quickly", () => {
    const line = "a,".repeat(999_000);
    const [doc, ms] = time(() => buildDocument(line, { localId: "d", fileName: "one-line.csv", kind: "csv" }));
    expect(ms).toBeLessThan(1_500);
    expect(Math.max(...doc.chunks.map((c) => c.text.length))).toBeLessThanOrEqual(DOCUMENT_LIMITS.targetChunkCharacters * 1.5);
  });

  it("handles two million line breaks and a cell without spaces", () => {
    const [blank, ms] = time(() => buildDocument(`${"\n".repeat(1_999_990)}x,y`, { localId: "d", fileName: "blank.csv", kind: "csv" }));
    expect(ms).toBeLessThan(1_500);
    expect(blank.chunks).toHaveLength(1);
    const [solid] = time(() => buildDocument("x".repeat(1_999_000), { localId: "d", fileName: "solid.csv", kind: "csv" }));
    expect(solid.chunks.every((c) => c.text.length <= DOCUMENT_LIMITS.targetChunkCharacters * 1.5)).toBe(true);
  });
});
