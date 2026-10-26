/**
 * ProviderPolicy registry (MASTER_PROMPT.md "API PROVIDER POLICY").
 *
 * `verifiedAt` records when these facts were last reviewed and by what method.
 * The 2026-10-25 entries come from the owner-supplied Proof Atlas 3.0
 * research; the implementation environment could not reach provider
 * documentation, so `verification` says so explicitly. Re-verify before
 * changing limits or enabling a disabled provider.
 */
import type { EgressPolicy } from "../security/egress";

export interface ProviderPolicy {
  id: string;
  enabled: boolean;
  purpose: string;
  docsUrl: string;
  termsUrl?: string;
  verifiedAt: string;
  /**
   * owner-supplied-research: terms taken from the owner's research brief.
   * official-docs-excerpt: excerpts of the provider's official pages retrieved by search on verifiedAt.
   * implementation-check: behaviour confirmed by calling the API.
   */
  verification: "owner-supplied-research" | "official-docs-excerpt" | "implementation-check";
  accessClass: "public" | "server-key" | "user-key" | "local-only";
  commercialUse: "allowed" | "restricted" | "unknown";
  attribution?: string;
  allowedHosts: string[];
  allowedPathPatterns: RegExp[];
  methodAllowlist: Array<"GET" | "POST">;
  timeoutMs: number;
  cacheTtlSeconds: number;
  staleIfErrorSeconds?: number;
  maxResponseBytes: number;
  maxRedirects: number;
  retryPolicy: { maxRetries: number; retryStatuses: number[]; obeyRetryAfter: true };
  dailyBudget?: number;
  /** Concurrent calls allowed per server instance; absent means not limited. */
  maxConcurrency?: number;
  /** Cache lifetimes per resource kind, where they differ from cacheTtlSeconds (spec "CACHE GUIDANCE"). */
  resourceTtlSeconds?: Record<string, number>;
  notes: string[];
}

const REVIEWED = "2026-10-25";

export const PROVIDER_POLICIES: Record<string, ProviderPolicy> = {
  github: {
    id: "github",
    enabled: true,
    purpose: "Repository Evidence Graph: public repository metadata, README, releases, languages and root manifests.",
    docsUrl: "https://docs.github.com/en/rest",
    termsUrl: "https://docs.github.com/en/site-policy/github-terms/github-terms-of-service",
    verifiedAt: REVIEWED,
    verification: "owner-supplied-research",
    accessClass: "server-key",
    commercialUse: "allowed",
    allowedHosts: ["api.github.com"],
    allowedPathPatterns: [
      /^\/repos\/[A-Za-z0-9-]+\/[A-Za-z0-9._-]+(\/(readme|releases|languages|contents\/?|contents\/(package\.json|pyproject\.toml|requirements\.txt)))?$/,
      // GitHub redirects renamed and transferred repositories to their numeric id.
      /^\/repositories\/\d+(\/(readme|releases|languages|contents\/?|contents\/(package\.json|pyproject\.toml|requirements\.txt)))?$/,
    ],
    methodAllowlist: ["GET"],
    timeoutMs: 5_000,
    cacheTtlSeconds: 600,
    staleIfErrorSeconds: 86_400,
    maxResponseBytes: 1_048_576,
    maxRedirects: 2,
    retryPolicy: { maxRetries: 0, retryStatuses: [], obeyRetryAfter: true },
    dailyBudget: 2_000,
    maxConcurrency: 2,
    resourceTtlSeconds: { repository: 600, contents: 600, readme: 1_800, manifest: 1_800, releases: 900, languages: 3_600 },
    notes: [
      "Unauthenticated: 60 requests/hour per server IP; with an optional read-only token: 5,000/hour. Secondary limits apply, so calls run at most two at a time.",
      "An analysis cache miss costs at most 5 calls; declared dependencies add at most 4 (root listing and up to 3 manifests). ETags are revalidated with If-None-Match.",
      "Renamed or transferred repositories redirect to /repositories/{id}; the redirect is followed and reported.",
      "Never infer security or health from absent evidence.",
    ],
  },
  crossref: {
    id: "crossref",
    enabled: true,
    purpose: "Citation Integrity baseline: DOI lookup and bibliographic search.",
    docsUrl: "https://www.crossref.org/documentation/retrieve-metadata/rest-api/",
    termsUrl: "https://www.crossref.org/documentation/retrieve-metadata/rest-api/rest-api-metadata-license-information/",
    verifiedAt: REVIEWED,
    verification: "owner-supplied-research",
    accessClass: "public",
    commercialUse: "allowed",
    attribution: "Metadata from Crossref.",
    allowedHosts: ["api.crossref.org"],
    allowedPathPatterns: [/^\/works(\/10\.\d{4,9}\/.+)?$/],
    methodAllowlist: ["GET"],
    timeoutMs: 5_000,
    cacheTtlSeconds: 604_800,
    staleIfErrorSeconds: 2_592_000,
    maxResponseBytes: 1_048_576,
    maxRedirects: 1,
    retryPolicy: { maxRetries: 0, retryStatuses: [], obeyRetryAfter: true },
    dailyBudget: 2_000,
    maxConcurrency: 1,
    resourceTtlSeconds: { doi: 604_800, search: 3_600 },
    notes: [
      "Polite pool requested via mailto in the User-Agent. Public pool: 5 req/s, concurrency 1; polite: 10 req/s, concurrency 3. This server sends one Crossref call at a time per instance.",
      "Bibliographic facts are reusable; abstracts may be copyrighted and are never stored or returned.",
      "Search results cache for 1 hour; DOI records for 7 days.",
    ],
  },
  datacite: {
    id: "datacite",
    enabled: true,
    purpose: "DOI fallback when Crossref has no record, and optional provider comparison.",
    docsUrl: "https://support.datacite.org/docs/api",
    termsUrl: "https://support.datacite.org/docs/datacite-metadata-license",
    verifiedAt: REVIEWED,
    verification: "owner-supplied-research",
    accessClass: "public",
    commercialUse: "allowed",
    attribution: "Metadata from DataCite (CC0).",
    allowedHosts: ["api.datacite.org"],
    allowedPathPatterns: [/^\/dois\/10\.\d{4,9}\/.+$/],
    methodAllowlist: ["GET"],
    timeoutMs: 5_000,
    cacheTtlSeconds: 604_800,
    staleIfErrorSeconds: 2_592_000,
    maxResponseBytes: 1_048_576,
    maxRedirects: 1,
    retryPolicy: { maxRetries: 0, retryStatuses: [], obeyRetryAfter: true },
    dailyBudget: 1_000,
    notes: ["Unidentified tier: 500 requests per 5 minutes. Metadata is CC0."],
  },
  gemini: {
    id: "gemini",
    enabled: true,
    purpose: "Ask the Atlas: answers about public portfolio evidence only, with server-validated citations.",
    docsUrl: "https://ai.google.dev/gemini-api/docs",
    termsUrl: "https://ai.google.dev/gemini-api/terms",
    verifiedAt: REVIEWED,
    verification: "owner-supplied-research",
    accessClass: "server-key",
    commercialUse: "allowed",
    allowedHosts: ["generativelanguage.googleapis.com"],
    allowedPathPatterns: [/^\/v1(beta)?\/models\/[a-z0-9.-]+:generateContent$/],
    methodAllowlist: ["POST"],
    timeoutMs: 20_000,
    cacheTtlSeconds: 0,
    maxResponseBytes: 262_144,
    maxRedirects: 0,
    retryPolicy: { maxRetries: 0, retryStatuses: [], obeyRetryAfter: true },
    dailyBudget: 500,
    notes: [
      "Owner decision D6: enabled only when GEMINI_API_KEY is set; AI_ASSISTANT_ENABLED=false disables it.",
      "Default model gemini-3.8-flash: Google's changelog (https://ai.google.dev/gemini-api/docs/changelog, entry of 2026-09-18, read 2026-10-25) recommends 3.8 Flash for new projects and serves the 2.5 models only to earlier users. GEMINI_MODEL overrides it.",
      "Free and paid tiers differ in data-use terms; only public portfolio evidence and the visitor's question are sent.",
      "Never sent: Workbench documents, contact messages, or anything private.",
    ],
  },
  npm: {
    id: "npm",
    enabled: true,
    purpose: "Repository Evidence Graph: metadata for one npm package a visitor selects (latest version, licence, deprecation).",
    docsUrl: "https://github.com/npm/registry/blob/main/docs/REGISTRY-API.md",
    termsUrl: "https://docs.npmjs.com/policies/open-source-terms",
    verifiedAt: REVIEWED,
    verification: "official-docs-excerpt",
    accessClass: "public",
    commercialUse: "allowed",
    allowedHosts: ["registry.npmjs.org"],
    allowedPathPatterns: [/^\/(@[a-z0-9-~][a-z0-9-._~]*%2f)?[A-Za-z0-9-~][A-Za-z0-9-._~]*\/latest$/],
    methodAllowlist: ["GET"],
    timeoutMs: 5_000,
    cacheTtlSeconds: 21_600,
    staleIfErrorSeconds: 604_800,
    maxResponseBytes: 262_144,
    maxRedirects: 1,
    retryPolicy: { maxRetries: 0, retryStatuses: [], obeyRetryAfter: true },
    dailyBudget: 2_000,
    notes: [
      "npm Open-Source Terms: replicating Public Registry data through the public APIs is permitted; automated access to the website is not, and the registry is not a general-purpose database.",
      "Only the small /latest document is requested, one package per visitor action, cached for 6 hours.",
    ],
  },
  pypi: {
    id: "pypi",
    enabled: true,
    purpose: "Repository Evidence Graph: metadata for one PyPI project a visitor selects (latest version, licence, yanked state).",
    docsUrl: "https://docs.pypi.org/api/json/",
    termsUrl: "https://pypi.org/policy/terms-of-use/",
    verifiedAt: REVIEWED,
    verification: "official-docs-excerpt",
    accessClass: "public",
    commercialUse: "allowed",
    allowedHosts: ["pypi.org"],
    allowedPathPatterns: [/^\/pypi\/[a-z0-9]([a-z0-9-]*[a-z0-9])?\/json$/],
    methodAllowlist: ["GET"],
    timeoutMs: 8_000,
    cacheTtlSeconds: 21_600,
    staleIfErrorSeconds: 604_800,
    maxResponseBytes: 4_194_304,
    maxRedirects: 2,
    retryPolicy: { maxRetries: 0, retryStatuses: [], obeyRetryAfter: true },
    dailyBudget: 2_000,
    notes: [
      "docs.pypi.org/api: no edge rate limiting on the JSON API; send a unique User-Agent with contact details, avoid bursts and cache.",
      "Project JSON includes the release history (about 3.7 MB for numpy); larger responses are refused rather than truncated.",
    ],
  },
  resend: {
    id: "resend",
    enabled: true,
    purpose: "Contact form: delivers a visitor's message to Anupam by email.",
    docsUrl: "https://resend.com/docs/api-reference/emails/send-email",
    termsUrl: "https://resend.com/legal/terms-of-service",
    verifiedAt: REVIEWED,
    verification: "official-docs-excerpt",
    accessClass: "server-key",
    commercialUse: "allowed",
    allowedHosts: ["api.resend.com"],
    allowedPathPatterns: [/^\/emails$/],
    methodAllowlist: ["POST"],
    timeoutMs: 8_000,
    cacheTtlSeconds: 0,
    maxResponseBytes: 16_384,
    maxRedirects: 0,
    retryPolicy: { maxRetries: 0, retryStatuses: [], obeyRetryAfter: true },
    dailyBudget: 100,
    maxConcurrency: 1,
    notes: [
      "Enabled only when RESEND_API_KEY and CONTACT_TO_EMAIL are set.",
      "resend.com/docs/api-reference/rate-limit: 10 requests/s per team by default; 429 carries retry-after. The Free plan allows 100 emails per UTC day and 3,000 per month, so the daily budget is 100.",
      "Sends only what the visitor typed into the form; nothing is stored on this server.",
    ],
  },
  openalex: {
    id: "openalex",
    enabled: false,
    purpose: "Optional scholarly graph enrichment for citations.",
    docsUrl: "https://developers.openalex.org/",
    verifiedAt: REVIEWED,
    verification: "owner-supplied-research",
    accessClass: "server-key",
    commercialUse: "allowed",
    allowedHosts: ["api.openalex.org"],
    allowedPathPatterns: [/^\/works(\/.+)?$/],
    methodAllowlist: ["GET"],
    timeoutMs: 5_000,
    cacheTtlSeconds: 604_800,
    maxResponseBytes: 1_048_576,
    maxRedirects: 1,
    retryPolicy: { maxRetries: 0, retryStatuses: [], obeyRetryAfter: true },
    notes: ["Disabled by default (D10). Needs an API key and a daily credit budget; no key is configured."],
  },
  ror: {
    id: "ror",
    enabled: false,
    purpose: "Optional organization normalization for citation affiliations.",
    docsUrl: "https://ror.readme.io/docs/rest-api",
    verifiedAt: REVIEWED,
    verification: "owner-supplied-research",
    accessClass: "public",
    commercialUse: "allowed",
    allowedHosts: ["api.ror.org"],
    allowedPathPatterns: [/^\/v2\/organizations(\/.+)?$/],
    methodAllowlist: ["GET"],
    timeoutMs: 5_000,
    cacheTtlSeconds: 2_592_000,
    maxResponseBytes: 524_288,
    maxRedirects: 1,
    retryPolicy: { maxRetries: 0, retryStatuses: [], obeyRetryAfter: true },
    notes: ["Disabled by default (D10). Client-ID policy was in transition when researched."],
  },
  "open-meteo": {
    id: "open-meteo",
    enabled: false,
    purpose: "Environmental context for a live PlantPal exhibit.",
    docsUrl: "https://open-meteo.com/en/docs",
    termsUrl: "https://open-meteo.com/en/terms",
    verifiedAt: REVIEWED,
    verification: "owner-supplied-research",
    accessClass: "public",
    commercialUse: "restricted",
    allowedHosts: ["api.open-meteo.com"],
    allowedPathPatterns: [/^\/v1\/forecast$/],
    methodAllowlist: ["GET"],
    timeoutMs: 5_000,
    cacheTtlSeconds: 900,
    maxResponseBytes: 524_288,
    maxRedirects: 0,
    retryPolicy: { maxRetries: 0, retryStatuses: [], obeyRetryAfter: true },
    notes: ["Free hosted tier is non-commercial. Disabled (D9); the PlantPal page uses labelled synthetic data."],
  },
};

export interface PolicyIssue {
  provider: string;
  message: string;
}

export const MAX_POLICY_AGE_DAYS = 180;

/** Returns every reason an enabled provider must not run. */
export function validateProviderPolicies(
  policies: Record<string, ProviderPolicy> = PROVIDER_POLICIES,
  today: Date = new Date(),
): PolicyIssue[] {
  const issues: PolicyIssue[] = [];
  for (const [key, p] of Object.entries(policies)) {
    const add = (message: string) => issues.push({ provider: key, message });
    if (p.id !== key) add("id does not match its registry key");
    if (!/^\d{4}-\d{2}-\d{2}$/.test(p.verifiedAt)) add("verifiedAt must be an ISO date");
    if (!p.enabled) continue;
    if (p.commercialUse !== "allowed") add(`commercial use is "${p.commercialUse}"`);
    if (!p.allowedHosts.length) add("no allowed hosts");
    if (!p.allowedPathPatterns.length) add("no allowed path patterns");
    if (!p.methodAllowlist.length) add("no allowed methods");
    if (!(p.timeoutMs > 0 && p.timeoutMs <= 30_000)) add("timeout missing or above 30 s");
    if (!(p.maxResponseBytes > 0 && p.maxResponseBytes <= 4_194_304)) add("response size cap missing or above 4 MiB");
    if (p.retryPolicy.obeyRetryAfter !== true) add("must obey Retry-After");
    const ageDays = (today.getTime() - Date.parse(`${p.verifiedAt}T00:00:00Z`)) / 86_400_000;
    if (!(ageDays <= MAX_POLICY_AGE_DAYS)) add(`verification is ${Math.floor(ageDays)} days old (max ${MAX_POLICY_AGE_DAYS})`);
  }
  return issues;
}

export function egressPolicy(id: keyof typeof PROVIDER_POLICIES | string): EgressPolicy {
  const p = PROVIDER_POLICIES[id];
  if (!p) throw new Error(`Unknown provider ${id}`);
  return {
    id: p.id,
    allowedHosts: p.allowedHosts,
    allowedPathPatterns: p.allowedPathPatterns,
    methodAllowlist: p.methodAllowlist,
    timeoutMs: p.timeoutMs,
    maxResponseBytes: p.maxResponseBytes,
    maxRedirects: p.maxRedirects,
    // Every registered provider answers in JSON.
    responseType: "json",
  };
}

/** Public, serializable view for /api/status and the Privacy page. */
export function publicProviderSummary(enabledOverrides: Record<string, boolean> = {}) {
  return Object.values(PROVIDER_POLICIES).map((p) => ({
    id: p.id,
    enabled: enabledOverrides[p.id] ?? p.enabled,
    purpose: p.purpose,
    docsUrl: p.docsUrl,
    termsUrl: p.termsUrl,
    verifiedAt: p.verifiedAt,
    verification: p.verification,
    commercialUse: p.commercialUse,
    accessClass: p.accessClass,
    attribution: p.attribution,
    cacheTtlSeconds: p.cacheTtlSeconds,
  }));
}
