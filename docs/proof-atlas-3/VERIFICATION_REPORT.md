# Proof Atlas 3.0 — verification report

Reviewed 2026-10-26. Pull request: https://github.com/Anupam0202/Anupam_Roy/pull/1. The release record on that pull request lists the commit that shipped, its CI run, the production deployment and the production smoke and Lighthouse results.

This report separates what was **verified by running something** from what is **documented in a repository**, **reported by the owner**, **disabled on purpose**, **conditional on configuration**, and **still unresolved**. Defaults recorded in `DECISIONS.md` are not owner approvals.

## 1. What runs, and how it was checked

| Check | Command | Result |
| --- | --- | --- |
| Source rules (74 PDF-backed credentials, banned wording, no secrets in site code, API surface, Node floor) | `pnpm run verify:source` | Pass |
| Lint (TypeScript, React hooks, JSX and Astro accessibility rules), no warnings allowed | `pnpm run lint` | 0 problems |
| Type checks (core, API, site incl. `astro check`) | `pnpm run typecheck` | 0 errors |
| Core unit tests (algorithms, ledger, credentials, citations, GitHub and manifest normalization, hostile input with timing limits, parser bombs, Markdown export escaping, egress guard, provider policies, Ask the Atlas incl. adversarial questions and link stripping in linear time) | `pnpm test` | 221 passed |
| Site unit tests (WCAG contrast of every token pair in both themes, `vercel.json` headers and redirects, routes) | `pnpm test` | 63 passed |
| API integration tests (mocked network: every route, caching, budgets, the failure pause and `Retry-After`, provider timeouts, renamed repositories, the 20 s dependency deadline, the Gemini adapter and its switch to the default model when `GEMINI_MODEL` is not found, contact delivery through the guard, prompt injection, client error reports and their redaction, the error handler's serialized stack, `TRUST_PROXY`, 413 bodies) | `pnpm test` | 87 passed |
| Builds and post-build checks (one h1, CSP meta, canonical, skip link, no inline styles, links and anchors resolve, OG images, outcome qualifier, no secrets, per-page weight budgets) | `pnpm run build` | Pass — 35 pages, 34 sitemap URLs, every page within its budget; homepage JS 1.8 KiB gzip (cap 120 KiB) |
| Dependency advisories for shipped code | `pnpm audit --prod` | No known vulnerabilities |
| End-to-end (Playwright, Chromium, against the Vercel-parity server) | `pnpm run test:e2e` | 925 passed |
| End-to-end in WebKit (routes, layout, progressive and accessibility specs) | CI `webkit` job | 866 tests; runs in CI only, since the sandbox cannot install WebKit. Result in the release record |
| Secret scan of the full history | CI `secret-scan` job (gitleaks 8.30.1, checksum pinned) | One finding, a made-up token in a test fixture, allowlisted by its fingerprint in `.gitleaksignore`; otherwise none |
| Smoke check against the parity server (sitemap routes, every redirect, 404s, headers, `/api/status`) | `node scripts/smoke.mjs http://127.0.0.1:4300` | Pass — 429 checks |
| Continuous integration | `.github/workflows/ci.yml` | Lint, provider-policy tests and build on Node 22 and 24; E2E on 24; WebKit; secret scan |

End-to-end coverage: every route (status, one h1, CSP header and meta, canonical, no console errors); real 404; legacy and trailing-slash redirects; API paths never redirected; sitemap and robots; certificate PDFs served but not indexed; the metadata contract (1200×630 OG images, social tags, description lengths, unique titles, JSON-LD, the 404 page, every `public/` file referenced, counts from data); axe with WCAG 2.2 AA and best-practice rules on every route in light, dark and at 375 px, and again after interaction (results, errors, list views, empty states, the open menu in dark mode); layout at ten viewports from 320×720 to 1920×1080, including 1536×864 (a 1920 px laptop at 125% scaling), in both themes (no overflow, clipped text, text escaping its card or button, headings stretched by the serif font, wrapped segmented controls or orphaned headings) and 24 px targets; keyboard-only use of the menu, tabs, Portfolio filters, the Credentials index, the Repository and Citation forms, Contact and the Lab; no-JS and reduced motion; the contact form for 400, 503, 429, offline and success; credentials showing issue dates only, with no expiry wording and nothing that changes under a mocked far-future clock; the Document Workbench's removal, ranking, limits, arrow keys and exports; Lab input limits; document privacy.

### Live provider checks (2026-10-25)

Run through the Vercel-parity server against the real services: GitHub (repository analysis and declared dependencies of this repository), npm (`request`, `@types/node`, a missing package → 404) and PyPI (`google-generativeai`, `numpy`, `boto3`). All returned the expected normalized results. Provider decisions for all 105 screened APIs are in [`PROVIDER_REVIEW.md`](PROVIDER_REVIEW.md).

### Lighthouse 13.5 (mobile, simulated slow 4G, local server without compression)

These are lab numbers from 2026-10-25. Production is measured by the smoke workflow's Lighthouse job after each production deployment; its numbers are in the release record.

| Page | Performance | Accessibility | Best practices | SEO | LCP | CLS | TBT |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `/` | 95 | 100 | 100 | 100 | 2.6 s | 0 | 0 ms |
| `/portfolio/nexusrag/` | 95 | 100 | 100 | 100 | 2.6 s | 0.001 | 0 ms |
| `/portfolio/plantpal/` | 96 | 100 | 100 | 100 | 2.4 s | 0.001 | 0 ms |
| `/workbench/documents/` | 98 | 100 | 100 | 100 | 2.1 s | 0.001 | 0 ms |
| `/sources/` | 94 | 100 | 100 | 100 | 2.7 s | 0 | 0 ms |
| `/experience/` | 97 | 100 | 100 | 100 | 2.3 s | 0.053 | 0 ms |

The first run found a 0.222 layout shift on the NexusRAG page caused by late font swaps; preloading the three critical fonts fixed it.

## 2. Release acceptance criteria

| # | Criterion | Status | Evidence |
| --- | --- | --- | --- |
| 1 | Static routes return correct statuses | Verified | `routes.spec.ts` (26 routes) |
| 2 | Unknown route returns 404 | Verified | `routes.spec.ts`; Vercel serves `404.html` with status 404 |
| 3 | Legacy redirects work | Verified locally | `routes.spec.ts`, `config.test.ts`, smoke check against the parity server. The preview could not be fetched (it needs the Vercel team grant, owner action O1); production is checked by the smoke workflow (release record) |
| 4 | Home communicates identity before animation | Verified | h1 and thesis are static HTML; the diagram renders in its final state without JS (`progressive.spec.ts`) |
| 5 | Owner-approved projects present | Verified | All 17 public project repositories (owner decision D8, 2026-10-26), each pinned to the reviewed commit with ledger evidence (`data.test.ts`) |
| 6 | NexusRAG runtime and research lanes separate | Verified (content) | Case study lanes and feature matrix, each row tied to a ledger entry |
| 7 | PlantPal uncertainty and source states visible | Verified (content) | Provider table with freshness and resolution per signal, an interpretation-boundary section, and synthetic profiles labelled as such (D9) |
| 8 | Repository Workbench gives evidence and coverage, never fake security | Verified | Declared dependencies are an opt-in step from root manifests; vulnerabilities are always "Not inspected (out of scope)" because declared ranges are not installed versions; API, E2E and live tests |
| 9 | Local Workbench works with the network unavailable | Verified | `workbench.spec.ts` (offline after load) |
| 10 | Citation Integrity passes representative DOI fixtures | Verified with fixtures | Core citation tests (19) and API tests (Crossref, DataCite, fallback, 404) |
| 11 | RRF tests pass | Verified | `rrf.test.ts` (16) |
| 12 | Binary-search tests pass | Verified | `binary-search.test.ts` (9) |
| 13 | Dijkstra fully passing or omitted | Verified — shipped | `dijkstra.test.ts` (10); an adjacency table that follows the weight inputs and marks the shortest path, tested by keyboard (`lab.spec.ts`); the distance and predecessor table; axe and layout checks |
| 14 | All 73 supplied records survive import | Superseded by D3 | Owner chose the 74 PDF-backed records; the 73-record dataset was never supplied |
| 15 | Missing 74th credential stays unresolved | Superseded by D3 | All 74 are backed by certificate PDFs (73 text-matched, 1 transcribed by eye) |
| 16 | AI may be disabled without harming the experience | Verified | No key or `AI_ASSISTANT_ENABLED=false` → ledger evidence (API and E2E tests) |
| 17 | Private documents not transmitted | Verified | `workbench.spec.ts` inspects every request |
| 18 | Portfolio works during upstream outage | Verified | Pages are static; provider failures fall back. API tests time out GitHub (503 in plain language, then a pause without further calls), Crossref and DataCite (502, no retry loop), Crossref search, and a manifest read (partial results); plus 5xx, rate limits and blocked redirects |
| 19 | Keyboard flows pass | Verified (automated) | Skip link; the menu dialog's focus trap; tabs; Portfolio filters; the Credentials index; the Repository and Citation forms; Contact; Lab stepping and weight editing; Document Workbench arrow keys (`flows.spec.ts`, `lab.spec.ts`, `progressive.spec.ts`, `a11y.spec.ts`). An owner spot-check is still recommended |
| 20 | Automated accessibility tests and manual review documented | Partial | Automated: axe (WCAG 2.2 AA and best practice) on every route and theme and in interacted states. Manual: an accessibility-tree review of the menu, Portfolio filters, Credentials, Repository, Documents, Lab and Contact was done with Playwright snapshots and its three findings fixed. A screen-reader pass is owner-pending (O4) |
| 21 | Build, typecheck and tests pass | Verified | Section 1; CI on every push |
| 22 | SSRF, input and host tests pass | Verified | `egress.test.ts` (26), API tests (private IP redirect, invalid names, path traversal); README and manifest parsers run in linear time on hostile input (core and API tests) |
| 23 | Actual performance measurements documented | Lab: verified. Production: release record | The lab table above (local server, no compression) and the production Lighthouse run recorded on the pull request |
| 24 | Provider policies contain review dates | Verified | Every policy has a review date and how it was verified: 7 of 10 rest on owner-supplied research, 3 on official documentation excerpts. A policy older than 180 days switches its provider off (tested). The 105-API screening is decided in PROVIDER_REVIEW.md |
| 25 | Cloudflare asset-first | Not applicable | Hosting stays on Vercel (D2) |
| 26 | Production deployment succeeds or is documented as owner-blocked | Release record | Vercel builds a preview for every push (READY status read from GitHub's deployment records; the preview pages themselves need the team grant, O1). The production deployment and its smoke result are in the release record |
| 27 | Report separates evidence classes | This document | Sections 3–6 |

## 3. Verified by executing code

- Algorithms (RRF, gateway blend reproduction, BM25, binary search, Dijkstra), citation normalization and exports, repository normalization, egress guard, provider-policy validation, assistant output validation — unit tests.
- Ledger entries with method `executed-test`: `site-local-documents` (Document Workbench sends nothing; `tests/e2e/workbench.spec.ts`) and `site-ask-public-only` (only retrieved public evidence may be cited; `ai/atlas.test.ts` and API tests).
- Site behaviour listed in section 1.

## 4. Documented in repositories (not executed here)

Of 37 ledger entries, 29 are `repository_documented`: 11 from documentation, 15 from inspected source at a pinned commit (NexusRAG `85b14f1`, PlantPal `99071d4`), 1 from certificate documents (`cred-records`) and the 2 executed tests above. Inspecting source shows what the code does, not that a deployment runs it.

## 5. Reported by the owner

7 entries: roles and dates at Accenture, the platform description, the ~20% / ~50% outcomes (always shown with "Approximate improvements reported by Anupam; not independently audited."), education, CodeChef rating, Credly badges, Google Cloud Arcade. None is independently verified on the site.

## 6. Disabled, conditional and unresolved

**Disabled on purpose:** OpenAlex and ROR enrichment (D10); live Open-Meteo data (restricted commercial use, D9 — PlantPal uses labelled synthetic profiles); portrait and résumé (D11); live links to NexusRAG and PlantPal (D15, D16).

**Conditional on Vercel environment variables (none are set by this branch):**
- `GEMINI_API_KEY` — without it, Ask the Atlas shows ledger evidence only. `GEMINI_MODEL` should name a current model or be removed to use the default `gemini-3.8-flash`; if it names a model Google no longer serves, the server switches to the default after the first failed call and `/api/status` reports `assistant.fallbackFrom`.
- `RESEND_API_KEY`, `CONTACT_TO_EMAIL` and a sender on a domain verified in Resend — without the key or recipient, the contact form answers 503 and the page offers email.
- `GITHUB_TOKEN` (optional) — raises GitHub's rate limit from 60 to 5,000 requests per hour.
- `CROSSREF_MAILTO` (optional).

**Unresolved:**
- No ledger entry is marked `verified_public_source`: live URLs (issuer verification links, deployed apps) could not be fetched from the build environment. All 74 credentials stay `link_unchecked`.
- NexusRAG's README contradicts itself about a bundled provider key (`nexus-readme-key`, marked unverified).
- Provider terms for seven policies were taken from owner-supplied research dated 2026-10-25; all policies must be re-reviewed by 2027-04-23, or the providers switch off automatically.
- Budgets, the failure pause and rate limits are in memory per serverless instance.
- Rate limits are in memory per serverless instance; a shared store would be needed for strict limits.
- A manual screen-reader pass and an owner read-through of all copy have not been done.
- WebKit runs in CI only, and the preview deployment could not be fetched from this environment.
