import { describe, expect, it } from "vitest";
import {
  bibtexKey,
  compareRecords,
  dedupeDoiList,
  normalizeCrossref,
  normalizeDatacite,
  normalizeDoi,
  toBibtex,
  toCslJson,
  toRis,
} from "./index";

// Synthetic fixtures shaped like Crossref `/works/{doi}` and DataCite
// `/dois/{doi}` responses. They are not real records.
const crossrefMessage = {
  DOI: "10.5555/Example.2024.001",
  title: ["Hybrid <i>Retrieval</i>   for Operations"],
  author: [
    { given: "Ada", family: "Lovelace" },
    { name: "Retrieval Working Group" },
  ],
  "container-title": ["Journal of Synthetic Fixtures"],
  publisher: "Example Press",
  issued: { "date-parts": [[2024, 3, 9]] },
  type: "journal-article",
  volume: "12",
  issue: "4",
  page: "101-118",
  indexed: { "date-time": "2026-10-01T00:00:00Z" },
  abstract: "<jats:p>Should never be kept.</jats:p>",
};

const dataciteData = {
  id: "10.5555/example.2024.001",
  attributes: {
    doi: "10.5555/example.2024.001",
    titles: [{ title: "Hybrid Retrieval for Operations" }, { title: "Subtitle", titleType: "Subtitle" }],
    creators: [{ nameType: "Personal", givenName: "Ada", familyName: "Lovelace", name: "Lovelace, Ada" }],
    publisher: "Example Press",
    publicationYear: 2024,
    types: { citeproc: "article-journal", resourceTypeGeneral: "JournalArticle" },
    updated: "2026-09-30T12:00:00Z",
    descriptions: [{ description: "Abstract text" }],
  },
};

const FETCHED = "2026-10-25T00:00:00.000Z";

describe("normalizeDoi", () => {
  it.each([
    ["10.1000/xyz123", "10.1000/xyz123"],
    ["  DOI: 10.1000/XYZ123 ", "10.1000/xyz123"],
    ["https://doi.org/10.1000/abc%2Fdef", "10.1000/abc/def"],
    ["http://dx.doi.org/10.1000/xyz.", "10.1000/xyz"],
  ])("normalizes %s", (input, expected) => {
    expect(normalizeDoi(input)).toBe(expected);
  });

  it.each(["", "11.1000/x", "10.12/x", "10.1000/", "https://example.com/10.1000/x", "10.1000/<script>", "10.1000/a b"])(
    "rejects %j",
    (input) => {
      expect(normalizeDoi(input)).toBeNull();
    },
  );

  it("dedupes pasted lists in first-seen order", () => {
    expect(dedupeDoiList("10.1000/A\nhttps://doi.org/10.1000/a, 10.1000/b; junk\n\n10.1000/C")).toEqual({
      dois: ["10.1000/a", "10.1000/b", "10.1000/c"],
      rejected: ["junk"],
      duplicates: 1,
      skipped: [],
    });
  });

  it("reports valid DOIs beyond the limit instead of dropping them", () => {
    expect(dedupeDoiList("10.1000/a 10.1000/b 10.1000/c 10.1000/b", 2)).toEqual({ dois: ["10.1000/a", "10.1000/b"], rejected: [], duplicates: 1, skipped: ["10.1000/c"] });
  });
});

describe("provider normalization", () => {
  it("normalizes Crossref and drops abstracts and markup", () => {
    const r = normalizeCrossref(crossrefMessage, FETCHED);
    expect(r).toMatchObject({
      doi: "10.5555/example.2024.001",
      title: "Hybrid Retrieval for Operations",
      authors: [{ given: "Ada", family: "Lovelace" }, { literal: "Retrieval Working Group" }],
      containerTitle: "Journal of Synthetic Fixtures",
      issued: { year: 2024, month: 3, day: 9 },
      url: "https://doi.org/10.5555/example.2024.001",
      provider: "crossref",
      providerUpdatedAt: "2026-10-01T00:00:00Z",
      missing: [],
    });
    expect(JSON.stringify(r)).not.toMatch(/abstract|never be kept/i);
  });

  it("normalizes DataCite and reports missing fields", () => {
    const r = normalizeDatacite(dataciteData, FETCHED);
    expect(r).toMatchObject({
      title: "Hybrid Retrieval for Operations",
      authors: [{ given: "Ada", family: "Lovelace" }],
      issued: { year: 2024 },
      type: "article-journal",
      provider: "datacite",
      missing: ["containerTitle"],
    });
    expect(JSON.stringify(r)).not.toMatch(/Abstract text/);
  });

  it("reports every missing field for an empty record", () => {
    expect(normalizeCrossref({ DOI: "10.1000/x" }, FETCHED).missing).toEqual([
      "title",
      "authors",
      "issued",
      "containerTitle",
      "publisher",
      "type",
    ]);
  });

  it("compares providers field by field, ignoring case and punctuation", () => {
    const rows = compareRecords(normalizeCrossref(crossrefMessage, FETCHED), normalizeDatacite(dataciteData, FETCHED));
    expect(Object.fromEntries(rows.map((r) => [r.field, r.agrees]))).toEqual({
      title: true,
      year: true,
      firstAuthor: true,
      publisher: true,
      type: false,
    });
  });
});

describe("exports", () => {
  const record = normalizeCrossref(crossrefMessage, FETCHED);

  it("produces deterministic CSL-JSON with sorted keys", () => {
    const csl = toCslJson([record]);
    expect(csl).toBe(toCslJson([record]));
    const [item] = JSON.parse(csl);
    expect(Object.keys(item)).toEqual([...Object.keys(item)].sort());
    expect(item).toMatchObject({ type: "article-journal", issued: { "date-parts": [[2024, 3, 9]] }, page: "101-118" });
  });

  it("produces BibTeX with escaped fields and unique keys", () => {
    expect(bibtexKey(record)).toBe("lovelace2024hybrid");
    const bib = toBibtex([record, { ...record, doi: "10.5555/other" }]);
    expect(bib).toContain("@article{lovelace2024hybrid,");
    expect(bib).toContain("@article{lovelace2024hybrida,");
    expect(bib).toContain("author = {Lovelace, Ada and {Retrieval Working Group}}");
    expect(bib).toContain("pages = {101--118}");
    expect(toBibtex([{ ...record, title: "50% of R&D_costs {are} #1" }])).toContain(
      "title = {50\\% of R\\&D\\_costs \\{are\\} \\#1}",
    );
  });

  it("produces RIS with one tag per line and a closing ER", () => {
    const ris = toRis([record]);
    expect(ris.split("\n")).toEqual([
      "TY  - JOUR",
      "TI  - Hybrid Retrieval for Operations",
      "AU  - Lovelace, Ada",
      "AU  - Retrieval Working Group",
      "T2  - Journal of Synthetic Fixtures",
      "PB  - Example Press",
      "PY  - 2024",
      "VL  - 12",
      "IS  - 4",
      "SP  - 101",
      "EP  - 118",
      "DO  - 10.5555/example.2024.001",
      "UR  - https://doi.org/10.5555/example.2024.001",
      "ER  - ",
      "",
    ]);
  });
});

describe("hostile metadata", () => {
  it("strips markup from titles in linear time", () => {
    const t = performance.now();
    const record = normalizeCrossref({ DOI: "10.1234/x", title: ["<".repeat(100_000) + "Title <i>x</i>"] }, "2026-10-25T00:00:00.000Z");
    expect(performance.now() - t).toBeLessThan(250);
    expect(record.title?.endsWith("Title x")).toBe(true);
  });
});

describe("normalizeDoi path segments", () => {
  it("rejects dot segments that would change the registry path", () => {
    expect(normalizeDoi("10.1234/../x")).toBeNull();
    expect(normalizeDoi("10.1234/./x")).toBeNull();
    expect(normalizeDoi("https://doi.org/10.1234/%2e%2e/x")).toBeNull();
    expect(normalizeDoi("10.1234/a.b..c")).toBe("10.1234/a.b..c");
  });
});
