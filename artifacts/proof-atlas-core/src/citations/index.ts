/**
 * Citation Integrity: DOI normalization, provider normalization (Crossref,
 * DataCite), comparison and deterministic exports. Abstracts are never kept.
 */

export type CitationProvider = "crossref" | "datacite";

export interface CitationAuthor {
  given?: string;
  family?: string;
  literal?: string;
}

export interface CitationRecord {
  doi: string;
  title: string | null;
  authors: CitationAuthor[];
  containerTitle: string | null;
  publisher: string | null;
  issued: { year: number; month?: number; day?: number } | null;
  type: string | null;
  url: string;
  volume: string | null;
  issue: string | null;
  page: string | null;
  provider: CitationProvider;
  /** Provider's own last-updated timestamp, when supplied. */
  providerUpdatedAt: string | null;
  fetchedAt: string;
  missing: string[];
}

const DOI_PATTERN = /^10\.\d{4,9}\/\S+$/;

/**
 * Accepts bare DOIs, `doi:` prefixes and doi.org / dx.doi.org URLs.
 * Returns the DOI lowercased (DOIs are case-insensitive) or null.
 */
export function normalizeDoi(input: string): string | null {
  let value = input.trim();
  if (!value || value.length > 300) return null;
  value = value.replace(/^doi:\s*/i, "");
  const url = /^https?:\/\/(?:dx\.)?doi\.org\/(.+)$/i.exec(value);
  if (url) {
    try {
      value = decodeURIComponent(url[1]);
    } catch {
      return null;
    }
  }
  value = value.replace(/[.,;]+$/, "").toLowerCase();
  // "." and ".." path segments would change which record the registry URL names.
  if (value.split("/").some((segment) => segment === "." || segment === "..")) return null;
  // Control characters and URL-unsafe punctuation are not valid in a DOI; matching them is the point.
  // eslint-disable-next-line no-control-regex
  if (/[\u0000-\u001F\u007F<>"{}|\\^`]/.test(value)) return null;
  return DOI_PATTERN.test(value) ? value : null;
}

/**
 * Splits pasted text into unique DOIs (first-seen order), rejected lines, and
 * valid DOIs beyond `max` that were not checked (reported, never dropped silently).
 */
export function dedupeDoiList(text: string, max = 50): { dois: string[]; rejected: string[]; duplicates: number; skipped: string[] } {
  const dois: string[] = [];
  const rejected: string[] = [];
  const skipped: string[] = [];
  let duplicates = 0;
  for (const raw of text.split(/[\n,;\s]+/)) {
    const line = raw.trim();
    if (!line) continue;
    const doi = normalizeDoi(line);
    if (!doi) rejected.push(line);
    else if (dois.includes(doi) || skipped.includes(doi)) duplicates += 1;
    else if (dois.length < max) dois.push(doi);
    else skipped.push(doi);
  }
  return { dois, rejected, duplicates, skipped };
}

const REQUIRED_FIELDS = ["title", "authors", "issued", "containerTitle", "publisher", "type"] as const;

function missingFields(record: Omit<CitationRecord, "missing">): string[] {
  return REQUIRED_FIELDS.filter((field) => {
    const value = record[field];
    return value === null || (Array.isArray(value) && value.length === 0);
  });
}

const firstString = (value: unknown): string | null => {
  if (typeof value === "string") return value.trim() || null;
  if (Array.isArray(value)) for (const item of value) if (typeof item === "string" && item.trim()) return item.trim();
  return null;
};

const cleanText = (value: string | null) =>
  value ? value.replace(/<[^<>]*>/g, "").replace(/\s+/g, " ").trim() || null : null;

function dateParts(parts: unknown): CitationRecord["issued"] {
  if (!Array.isArray(parts) || !Array.isArray(parts[0])) return null;
  const [year, month, day] = parts[0] as unknown[];
  if (typeof year !== "number" || !Number.isInteger(year)) return null;
  return {
    year,
    ...(typeof month === "number" ? { month } : {}),
    ...(typeof day === "number" ? { day } : {}),
  };
}

/** Normalizes a Crossref `/works/{doi}` `message` object. */
export function normalizeCrossref(message: unknown, fetchedAt: string): CitationRecord {
  const m = (message ?? {}) as Record<string, unknown>;
  const doi = normalizeDoi(String(m.DOI ?? "")) ?? String(m.DOI ?? "").toLowerCase();
  const issuedSource =
    (m.issued as { "date-parts"?: unknown } | undefined)?.["date-parts"] ??
    (m["published-print"] as { "date-parts"?: unknown } | undefined)?.["date-parts"] ??
    (m["published-online"] as { "date-parts"?: unknown } | undefined)?.["date-parts"];
  const authors = Array.isArray(m.author)
    ? (m.author as Array<Record<string, unknown>>).slice(0, 100).map((a) =>
        typeof a.family === "string" || typeof a.given === "string"
          ? { ...(typeof a.given === "string" ? { given: a.given } : {}), ...(typeof a.family === "string" ? { family: a.family } : {}) }
          : { literal: String(a.name ?? "Unknown") },
      )
    : [];
  const base = {
    doi,
    title: cleanText(firstString(m.title)),
    authors,
    containerTitle: cleanText(firstString(m["container-title"])),
    publisher: cleanText(firstString(m.publisher)),
    issued: dateParts(issuedSource),
    type: firstString(m.type),
    url: `https://doi.org/${doi}`,
    volume: firstString(m.volume),
    issue: firstString(m.issue),
    page: firstString(m.page),
    provider: "crossref" as const,
    providerUpdatedAt: firstString((m.indexed as { "date-time"?: unknown } | undefined)?.["date-time"]),
    fetchedAt,
  };
  return { ...base, missing: missingFields(base) };
}

/** Normalizes a DataCite `/dois/{doi}` JSON:API `data` object. */
export function normalizeDatacite(data: unknown, fetchedAt: string): CitationRecord {
  const d = (data ?? {}) as { id?: unknown; attributes?: Record<string, unknown> };
  const a = d.attributes ?? {};
  const doi = normalizeDoi(String(a.doi ?? d.id ?? "")) ?? String(a.doi ?? d.id ?? "").toLowerCase();
  const titles = Array.isArray(a.titles) ? (a.titles as Array<{ title?: unknown; titleType?: unknown }>) : [];
  const mainTitle = titles.find((t) => !t.titleType) ?? titles[0];
  const creators = Array.isArray(a.creators) ? (a.creators as Array<Record<string, unknown>>) : [];
  const types = (a.types ?? {}) as Record<string, unknown>;
  const container = (a.container ?? {}) as Record<string, unknown>;
  const publisher =
    typeof a.publisher === "string" ? a.publisher : firstString((a.publisher as { name?: unknown } | undefined)?.name);
  const year = typeof a.publicationYear === "number" ? a.publicationYear : Number.parseInt(String(a.publicationYear ?? ""), 10);
  const base = {
    doi,
    title: cleanText(firstString(mainTitle?.title)),
    authors: creators.slice(0, 100).map((c) =>
      c.nameType === "Organizational" || (!c.familyName && !c.givenName)
        ? { literal: String(c.name ?? "Unknown") }
        : {
            ...(typeof c.givenName === "string" ? { given: c.givenName } : {}),
            ...(typeof c.familyName === "string" ? { family: c.familyName } : {}),
          },
    ),
    containerTitle: cleanText(firstString(container.title)),
    publisher: cleanText(publisher),
    issued: Number.isInteger(year) ? { year } : null,
    type: firstString(types.citeproc) ?? firstString(types.resourceTypeGeneral),
    url: `https://doi.org/${doi}`,
    volume: firstString(container.volume),
    issue: firstString(container.issue),
    page: firstString(container.firstPage),
    provider: "datacite" as const,
    providerUpdatedAt: firstString(a.updated),
    fetchedAt,
  };
  return { ...base, missing: missingFields(base) };
}

export interface FieldComparison {
  field: "title" | "year" | "firstAuthor" | "publisher" | "type";
  crossref: string | null;
  datacite: string | null;
  agrees: boolean;
}

const fold = (s: string | null) => (s ? s.toLowerCase().normalize("NFKD").replace(/[^\p{L}\p{N}]+/gu, " ").trim() : null);

export function authorLabel(author: CitationAuthor | undefined): string | null {
  if (!author) return null;
  if (author.literal) return author.literal;
  return [author.given, author.family].filter(Boolean).join(" ") || null;
}

export function compareRecords(crossref: CitationRecord, datacite: CitationRecord): FieldComparison[] {
  const rows: Array<[FieldComparison["field"], string | null, string | null]> = [
    ["title", crossref.title, datacite.title],
    ["year", crossref.issued ? String(crossref.issued.year) : null, datacite.issued ? String(datacite.issued.year) : null],
    ["firstAuthor", authorLabel(crossref.authors[0]), authorLabel(datacite.authors[0])],
    ["publisher", crossref.publisher, datacite.publisher],
    ["type", crossref.type, datacite.type],
  ];
  return rows.map(([field, a, b]) => ({ field, crossref: a, datacite: b, agrees: fold(a) === fold(b) }));
}

/* ---------- Deterministic exports ---------- */

function sortKeys(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sortKeys);
  if (value && typeof value === "object")
    return Object.fromEntries(
      Object.keys(value as Record<string, unknown>)
        .sort()
        .map((k) => [k, sortKeys((value as Record<string, unknown>)[k])]),
    );
  return value;
}

const CSL_TYPES: Record<string, string> = {
  "journal-article": "article-journal",
  "proceedings-article": "paper-conference",
  "book-chapter": "chapter",
  "posted-content": "article",
  dataset: "dataset",
  book: "book",
  report: "report",
  Dataset: "dataset",
  Text: "article",
  Software: "software",
};

export function toCslJson(records: readonly CitationRecord[]): string {
  const items = records.map((r) => {
    const item: Record<string, unknown> = {
      id: r.doi,
      DOI: r.doi,
      URL: r.url,
      type: (r.type && CSL_TYPES[r.type]) ?? r.type ?? "article",
    };
    if (r.title) item.title = r.title;
    if (r.authors.length) item.author = r.authors;
    if (r.containerTitle) item["container-title"] = r.containerTitle;
    if (r.publisher) item.publisher = r.publisher;
    if (r.issued) item.issued = { "date-parts": [[r.issued.year, r.issued.month, r.issued.day].filter((x) => x !== undefined)] };
    if (r.volume) item.volume = r.volume;
    if (r.issue) item.issue = r.issue;
    if (r.page) item.page = r.page;
    return sortKeys(item);
  });
  return `${JSON.stringify(items, null, 2)}\n`;
}

const bibEscape = (s: string) => s.replace(/([&%$#_{}])/g, "\\$1").replace(/~/g, "\\textasciitilde{}").replace(/\^/g, "\\textasciicircum{}");

export function bibtexKey(r: CitationRecord): string {
  const first = r.authors[0];
  const name = (first?.family ?? first?.literal ?? "anon").normalize("NFKD").replace(/[^A-Za-z0-9]/g, "").toLowerCase() || "anon";
  const word = (r.title ?? "untitled").normalize("NFKD").toLowerCase().match(/[a-z0-9]{4,}/)?.[0] ?? "untitled";
  return `${name}${r.issued?.year ?? "nd"}${word}`;
}

export function toBibtex(records: readonly CitationRecord[]): string {
  const used = new Map<string, number>();
  return records
    .map((r) => {
      let key = bibtexKey(r);
      const n = used.get(key) ?? 0;
      used.set(key, n + 1);
      if (n) key += String.fromCharCode(96 + n); // second use gets "a", third "b", …
      const entryType = r.type === "journal-article" ? "article" : r.type === "proceedings-article" ? "inproceedings" : r.type === "book" ? "book" : "misc";
      const fields: Array<[string, string | null]> = [
        ["title", r.title],
        [
          "author",
          r.authors.length
            ? r.authors
                .map((a) => (a.literal ? `{${bibEscape(a.literal)}}` : [a.family, a.given].filter(Boolean).map((s) => bibEscape(s as string)).join(", ")))
                .join(" and ")
            : null,
        ],
        [entryType === "article" ? "journal" : "booktitle", entryType === "misc" ? null : r.containerTitle],
        ["publisher", r.publisher],
        ["year", r.issued ? String(r.issued.year) : null],
        ["volume", r.volume],
        ["number", r.issue],
        ["pages", r.page ? r.page.replace(/-/g, "--") : null],
        ["doi", r.doi],
        ["url", r.url],
      ];
      const body = fields
        .filter(([, v]) => v)
        // url and doi stay raw; author parts were escaped individually above.
        .map(([k, v]) => `  ${k} = {${k === "url" || k === "doi" || k === "author" ? v : bibEscape(v as string)}}`)
        .join(",\n");
      return `@${entryType}{${key},\n${body}\n}`;
    })
    .join("\n\n")
    .concat("\n");
}

const RIS_TYPES: Record<string, string> = {
  "journal-article": "JOUR",
  "proceedings-article": "CPAPER",
  "book-chapter": "CHAP",
  book: "BOOK",
  dataset: "DATA",
  Dataset: "DATA",
  report: "RPRT",
  Software: "COMP",
};

export function toRis(records: readonly CitationRecord[]): string {
  return records
    .map((r) => {
      const lines = [`TY  - ${(r.type && RIS_TYPES[r.type]) ?? "GEN"}`];
      if (r.title) lines.push(`TI  - ${r.title}`);
      for (const a of r.authors) lines.push(`AU  - ${a.literal ?? [a.family, a.given].filter(Boolean).join(", ")}`);
      if (r.containerTitle) lines.push(`T2  - ${r.containerTitle}`);
      if (r.publisher) lines.push(`PB  - ${r.publisher}`);
      if (r.issued) lines.push(`PY  - ${r.issued.year}`);
      if (r.volume) lines.push(`VL  - ${r.volume}`);
      if (r.issue) lines.push(`IS  - ${r.issue}`);
      if (r.page) {
        const [sp, ep] = r.page.split(/-+/);
        lines.push(`SP  - ${sp}`);
        if (ep) lines.push(`EP  - ${ep}`);
      }
      lines.push(`DO  - ${r.doi}`, `UR  - ${r.url}`, `ER  - `);
      return lines.join("\n");
    })
    .join("\n\n")
    .concat("\n");
}
