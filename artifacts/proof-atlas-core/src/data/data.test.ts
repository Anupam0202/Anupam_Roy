import { createHash } from "node:crypto";
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { claims, claimById } from "./claims";
import { CREDENTIAL_DISCLOSURE, FEATURED_TITLES, credentials, displayTitle, featuredCredentials, formatCredentialDate, issuerCounts, yearCounts } from "./credentials";
import { projects } from "./projects";
import { roles } from "./experience";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../../..");

describe("credentials", () => {
  it("has 74 records with unique deterministic ids", () => {
    expect(credentials).toHaveLength(74);
    for (const c of credentials) {
      const expected = "cred-" + createHash("sha256").update(`${c.issuer}|${c.title}|${c.verifyUrl}`).digest("hex").slice(0, 12);
      expect(c.id).toBe(expected);
    }
    expect(new Set(credentials.map((c) => c.id)).size).toBe(74);
  });

  it("records an ISO issue date and no expiry for every credential (owner decision D4)", () => {
    for (const c of credentials) {
      expect(c.issuedOn).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(Number.isNaN(Date.parse(`${c.issuedOn}T00:00:00Z`))).toBe(false);
      expect(c.issuedOn <= "2026-10-26").toBe(true);
      expect(Object.keys(c).filter((k) => /expir|valid/i.test(k))).toEqual([]);
    }
  });

  it("keeps every issuer link marked unchecked and every verify URL on HTTPS", () => {
    for (const c of credentials) {
      expect(c.linkCheck).toBe("link_unchecked");
      expect(new URL(c.verifyUrl).protocol).toBe("https:");
    }
    expect(CREDENTIAL_DISCLOSURE).not.toMatch(/verified certifications/i);
  });

  it("has a PDF and thumbnail on disk for every record", () => {
    const pub = path.join(repoRoot, "artifacts/proof-atlas/public");
    for (const c of credentials) {
      expect(existsSync(path.join(pub, c.pdf)), c.pdf).toBe(true);
      expect(existsSync(path.join(pub, c.thumbnail)), c.thumbnail).toBe(true);
    }
  });

  it("documents the one transcribed record", () => {
    const transcribed = credentials.filter((c) => c.pdfCheck === "image_transcribed");
    expect(transcribed.map((c) => c.title)).toEqual(["Data Engineer Associate"]);
    expect(transcribed[0]).toMatchObject({ issuedOn: "2024-06-19", credentialId: "106488721" });
    expect(transcribed[0].notes[0]).toMatch(/transcribed/);
  });

  it("counts records by issue year, newest first", () => {
    const years = yearCounts();
    expect(years.map((y) => y.year)).toEqual(["2026", "2025", "2024", "2023"]);
    expect(years.reduce((n, y) => n + y.count, 0)).toBe(74);
    expect(years).toEqual([
      { year: "2026", count: 4 },
      { year: "2025", count: 13 },
      { year: "2024", count: 46 },
      { year: "2023", count: 11 },
    ]);
  });

  it("resolves every owner-selected highlight, in order and regardless of date", () => {
    expect(featuredCredentials().map((c) => c.title)).toEqual([...FEATURED_TITLES]);
    expect(FEATURED_TITLES).toHaveLength(8);
  });

  it("formats titles and dates one way for display", () => {
    expect(displayTitle("ML Engineer - Associate")).toBe("ML Engineer – Associate");
    expect(formatCredentialDate("2026-05-01")).toBe("1 May 2026");
    expect(CREDENTIAL_DISCLOSURE.startsWith(`${credentials.length} credential records`)).toBe(true);
  });

  it("summarizes issuers", () => {
    expect(issuerCounts()[0]).toMatchObject({ issuer: "Microsoft", count: 46 });
  });
});

describe("claims ledger", () => {
  it("has unique ids and every project claim reference resolves", () => {
    expect(new Set(claims.map((c) => c.id)).size).toBe(claims.length);
    for (const p of projects) for (const id of p.claimIds) expect(claimById(id), `${p.slug} → ${id}`).toBeDefined();
  });

  it("pins repository claims to a commit and quotes the source", () => {
    for (const c of claims.filter((c) => c.status === "repository_documented" && c.method !== "executed-test" && c.method !== "certificate-document")) {
      if (c.id === "archive-readmes") continue;
      expect(c.commitSha, c.id).toMatch(/^[0-9a-f]{40}$/);
      expect(c.sourceUrl, c.id).toContain(c.commitSha);
      expect(c.sourceExcerpt, c.id).toBeTruthy();
    }
  });

  it("points executed-test claims at test files that exist", () => {
    for (const c of claims.filter((c) => c.method === "executed-test")) {
      expect(existsSync(path.join(repoRoot, c.path!)), c.path).toBe(true);
    }
  });

  it("qualifies the owner-reported outcomes", () => {
    expect(claimById("exp-outcomes")?.limitations).toContain("Approximate improvements reported by Anupam; not independently audited.");
  });

  it("never marks a README-only claim as verified", () => {
    for (const c of claims) if (c.method === "repository-documentation") expect(c.status).not.toBe("verified_public_source");
  });
});

describe("experience and projects", () => {
  it("keeps job titles as held", () => {
    expect(roles.map((r) => r.title)).toEqual(["Associate Software Engineer", "AI/ML Analyst"]);
  });

  it("lists every public project repository, flagships first", () => {
    expect(projects.map((p) => p.slug)).toEqual([
      "nexusrag",
      "plantpal",
      "cutline",
      "food-bank-recall-closure-agent",
      "raceproof",
      "ahawin",
      "pantryproof",
      "rag",
      "contextual-rag-chatbot",
      "boxshield-arena",
      "recordcheck",
      "mavunoguard-ai",
      "handwritten-chemical-compound-detection",
      "my-portfolio",
      "anupam-portfolio",
      "real-estate",
      "modern-ui-ux-gpt3",
    ]);
    expect(new Set(projects.map((p) => p.slug)).size).toBe(projects.length);
    expect(projects.filter((p) => p.rank === "flagship").map((p) => p.slug)).toEqual(["nexusrag", "plantpal"]);
  });

  it("pins every project to a full commit and gives each one ledger evidence", () => {
    for (const p of projects) {
      expect(p.repository.commit, p.slug).toMatch(/^[0-9a-f]{40}$/);
      expect(p.repository.url, p.slug).toMatch(/^https:\/\/github\.com\/Anupam0202\//);
      expect(p.claimIds.length, p.slug).toBeGreaterThan(0);
    }
  });

  it("does not link the flagship live apps (decisions D15, D16)", () => {
    expect(projects.find((p) => p.slug === "nexusrag")?.site).toBeUndefined();
    expect(projects.find((p) => p.slug === "plantpal")?.site).toBeUndefined();
  });
});
