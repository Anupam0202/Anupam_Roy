import raw from "./credentials.json";

export interface Credential {
  /** Deterministic: "cred-" + first 12 hex of sha256(`${issuer}|${title}|${verifyUrl}`). */
  id: string;
  issuer: string;
  issuerKey: string;
  title: string;
  level: string;
  /** Issue date as printed on the certificate (ISO). The only date the site records. */
  issuedOn: string;
  credentialId: string | null;
  pdf: string;
  thumbnail: string;
  /** Intrinsic thumbnail size [width, height], used to reserve layout space. */
  thumbnailSize: [number, number];
  verifyUrl: string;
  pdfCheck: "text_matched" | "image_transcribed";
  linkCheck: "link_unchecked" | "link_verified" | "link_failed";
  notes: string[];
}

export const credentials = raw as Credential[];

/** Titles are stored as issued ("ML Engineer - Associate"); display uses an en dash. */
export const displayTitle = (title: string) => title.replace(/ - /g, " – ");

/** "1 May 2026", the one date format used for credentials. */
export const formatCredentialDate = (iso: string) =>
  new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });

export const PDF_CHECK_LABEL: Record<Credential["pdfCheck"], string> = {
  text_matched: "PDF text matches issue date and ID",
  image_transcribed: "Read from certificate image",
};

export const LINK_CHECK_LABEL: Record<Credential["linkCheck"], string> = {
  link_unchecked: "Issuer link not yet checked",
  link_verified: "Issuer link checked",
  link_failed: "Issuer link failed",
};

/** Owner-selected highlights (previous portfolio), shown in this order. */
export const FEATURED_TITLES = [
  "ML Engineer - Associate",
  "Generative AI Leader",
  "Professional ML Engineer",
  "Professional Cloud Architect",
  "Generative AI Engineer Associate",
  "Claude Certified Architect - Foundations",
  "GitHub Copilot Certification",
  "SnowPro Specialty: Gen AI",
] as const;

export function featuredCredentials(): Credential[] {
  return FEATURED_TITLES.map((t) => credentials.find((c) => c.title === t)).filter((c): c is Credential => Boolean(c));
}

export function issuerCounts(): Array<{ issuer: string; issuerKey: string; count: number }> {
  const map = new Map<string, { issuer: string; issuerKey: string; count: number }>();
  for (const c of credentials) {
    const entry = map.get(c.issuerKey) ?? { issuer: c.issuer, issuerKey: c.issuerKey, count: 0 };
    entry.count += 1;
    map.set(c.issuerKey, entry);
  }
  return [...map.values()].sort((a, b) => b.count - a.count || a.issuer.localeCompare(b.issuer, "en"));
}

/** Records per issue year, newest year first. */
export function yearCounts(): Array<{ year: string; count: number }> {
  const map = new Map<string, number>();
  for (const c of credentials) map.set(c.issuedOn.slice(0, 4), (map.get(c.issuedOn.slice(0, 4)) ?? 0) + 1);
  return [...map.entries()].map(([year, count]) => ({ year, count })).sort((a, b) => b.year.localeCompare(a.year));
}

export const CREDENTIAL_DISCLOSURE = `${credentials.length} credential records, each with a certificate PDF. Issue dates and credential IDs were checked against the PDFs; issuer links have not yet been individually checked.`;
