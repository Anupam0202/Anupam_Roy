# Proof Atlas · Anupam Roy

[![CI](https://github.com/Anupam0202/Anupam_Roy/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/Anupam0202/Anupam_Roy/actions/workflows/ci.yml)

The portfolio and proof workbench of Anupam Roy, AI/ML Analyst. Thesis: **difficult problems become understandable systems.** Every important statement on the site links to an evidence ledger that says how it was established and what it does not prove.

Live site: [anupam-roy.vercel.app](https://anupam-roy.vercel.app/)

## What is here

- **Portfolio** — NexusRAG and PlantPal case studies plus a page for every other public project repository, each tied to a reviewed commit, with how it works, its engineering evidence and its limitations.
- **Proof Workbench** — a repository evidence graph (public GitHub data), local document search that never uploads files, and a citation integrity tool (Crossref and DataCite).
- **Engineering Lab** — Reciprocal Rank Fusion, binary search and Dijkstra explorers that run the same tested functions as the unit tests, and an architecture x-ray of a RAG pipeline.
- **Experience, Credentials, About, Contact** — 74 credential records, each backed by its certificate PDF.
- **Sources** — the evidence ledger and *Ask the Atlas*, an assistant that may only cite ledger entries retrieved for the question.

## Tech stack

- **Site:** Astro 7.4.1 with React 19 islands and TypeScript; self-hosted fonts; no analytics and no cookies.
- **API:** Express 5, bundled with esbuild and deployed as Vercel functions; pino logging.
- **Services:** Gemini (Ask the Atlas), Resend (contact form), GitHub, Crossref, DataCite, npm and PyPI (Workbench).
- **Quality:** Vitest unit and integration tests, Playwright end-to-end tests in Chromium and WebKit with axe accessibility checks, ESLint 10, per-page weight budgets.
- **Automation:** GitHub Actions for CI (Node 22 and 24), a full-history secret scan, and a smoke check plus mobile Lighthouse after every production deploy.

## Documentation

- [`docs/DECISIONS.md`](docs/DECISIONS.md) — the design decisions behind the site and why each was made.
- [`docs/adr/0001-proof-atlas-3-framework-and-hosting.md`](docs/adr/0001-proof-atlas-3-framework-and-hosting.md) — the framework and hosting choice.
- [`docs/PROVIDER_REVIEW.md`](docs/PROVIDER_REVIEW.md) — which outside APIs run and why the other screened services do not, with the screening data in [`docs/API_SCREENING_105.csv`](docs/API_SCREENING_105.csv).
- [`ASSET_LICENSES.md`](ASSET_LICENSES.md) — licences of bundled fonts and third-party assets.

## Repository layout

```text
.
|-- .github/workflows/
|   |-- ci.yml                   # lint, tests and build on Node 22 and 24, E2E (Chromium, WebKit), secret scan
|   `-- smoke.yml                # smoke check and mobile Lighthouse after each production deploy; manual contact form test
|-- api/index.js                 # Vercel function entry: exports the bundled API
|-- artifacts/
|   |-- proof-atlas/             # Astro 7 static site with React islands
|   |   `-- scripts/             # generate-og.mjs (social images), generate-icons.mjs (PNG icons)
|   |-- proof-atlas-core/        # Framework-free logic and data shared by site and API
|   `-- api-server/              # Express API (bundled with esbuild)
|-- scripts/
|   |-- ensure-pnpm.cjs          # preinstall guard: installs must use pnpm
|   |-- serve-local.mjs          # Vercel-parity server for previews and E2E tests
|   |-- vercel-routing.mjs       # vercel.json route matcher shared with tests
|   |-- verify-portfolio-source.mjs
|   |-- verify-dist.mjs          # post-build checks and per-page weight budgets
|   |-- page-budgets.json
|   |-- smoke.mjs                # read-only smoke check of a running deployment
|   `-- contact-check.mjs        # contact form check; --send delivers one labelled test message
|-- docs/                        # design decisions, ADR, provider review
|-- eslint.config.js
|-- lighthouserc.json
`-- vercel.json
```

`proof-atlas-core` holds the algorithms (RRF, BM25, binary search, Dijkstra), the evidence ledger, credentials, citation and repository normalization, the outbound-request guard and the provider policies. The site and the API both import it, so what the Lab shows is what the tests check.

## Requirements

- Node.js `>=22.22.0 <25` (Astro 7.4.1 needs 22.22 or later)
- pnpm `10.34.5` (pinned through `packageManager`)

## Local development

```bash
corepack prepare pnpm@10.34.5 --activate
pnpm install --frozen-lockfile
pnpm run dev            # site on :5173, API on :3001 (Astro proxies /api)
```

To preview the production build the way Vercel serves it:

```bash
pnpm run build
pnpm start              # http://127.0.0.1:4173
```

## Environment variables

Copy `.env.example` to `.env` locally, or set the same names in Vercel. All of them are server-only; none may use a `PUBLIC_` or `VITE_` prefix.

| Name | Needed for | Notes |
| --- | --- | --- |
| `RESEND_API_KEY` | Contact form | Without it (or without `CONTACT_TO_EMAIL`), `/api/contact` answers 503 and the page offers email instead. |
| `CONTACT_TO_EMAIL` | Contact form | Where messages are delivered. |
| `CONTACT_FROM_EMAIL` | Contact form | Sender. Defaults to `onboarding@resend.dev`, which only delivers to the Resend account owner; use a verified domain in production. |
| `CONTACT_FALLBACK_FROM_EMAIL` | Contact form | Optional sender tried once when Resend rejects `CONTACT_FROM_EMAIL` because its domain is not verified. |
| `RESEND_SANDBOX_TO_EMAIL` | Contact form | Optional recipient used once when Resend only allows test emails to the account owner. |
| `GEMINI_API_KEY`, `GEMINI_MODEL` | Ask the Atlas | Optional. Without a key, the assistant shows matching ledger entries instead. `GEMINI_MODEL` defaults to `gemini-3.8-flash`. A malformed id uses the default; an id Google reports as not found is retried once with the default, which that server instance then keeps using, and `/api/status` shows it under `assistant.fallbackFrom`. |
| `AI_ASSISTANT_ENABLED` | Ask the Atlas | Set to `false` to switch AI off without removing the key. |
| `PROVIDERS_DISABLED` | Every provider call | Optional comma-separated provider policy ids (for example `datacite,npm`) to switch off without a code change; `/api/status` lists them. |
| `GITHUB_TOKEN` | Repository Evidence Graph | Optional; raises GitHub's rate limit. Use a token with public read access only. |
| `CROSSREF_MAILTO` | Citation tools | Optional contact address for Crossref's polite pool. |
| `TRUST_PROXY` | Rate limits | Optional. Set to `1` or `true` when a reverse proxy sits in front of the server outside Vercel, so the client address comes from `X-Forwarded-For`. On Vercel (`VERCEL` is set) the proxy is always trusted. |
| `LOG_LEVEL` | Logging | Optional pino level (`info` by default; `silent` in tests). |
| `PORT`, `HOST` | Local servers | The API dev server listens on `PORT` (3001 in `.env.example`); `pnpm start` serves the built site on `HOST`:`PORT` (127.0.0.1:4173 by default). |
| `API_PROXY_TARGET` | `astro dev` | Where the dev server proxies `/api` (default `http://localhost:3001`). |
| `E2E_PORT` | Playwright | Port for the end-to-end test server (default 4173). |

On Vercel, environment variable changes apply to new deployments only: redeploy after saving a change, including `PROVIDERS_DISABLED` ([Vercel docs](https://vercel.com/docs/environment-variables/managing-environment-variables)). Vercel sets `VERCEL` and `VERCEL_GIT_COMMIT_SHA` itself; the second is reported as `release` by `/api/status`.

## API

| Method | Route | Purpose |
| --- | --- | --- |
| `GET` | `/api/healthz` | Process health |
| `GET` | `/api/status` | Which providers and features are on, without secrets |
| `POST` | `/api/repository/analyze` | `{ owner, repo, include? }` → evidence graph and coverage report |
| `POST` | `/api/repository/dependencies` | `{ owner, repo }` → declared dependencies from root `package.json`, `pyproject.toml`, `requirements.txt` |
| `POST` | `/api/packages/lookup` | `{ ecosystem: "npm" \| "pypi", name }` → latest version, licence, deprecation for one package |
| `POST` | `/api/citations/resolve` | `{ doi, compare? }` → normalized record, optional Crossref/DataCite comparison |
| `POST` | `/api/citations/search` | `{ query }` → Crossref bibliographic search (no abstracts) |
| `POST` | `/api/ai/ask` | `{ question }` → cited answer, abstention, or ledger evidence |
| `POST` | `/api/contact` | Validated, honeypot-protected contact delivery |
| `POST` | `/api/client-error` | Bounded browser error reports |

Outbound calls never use a visitor-supplied URL. Each provider has a policy in `proof-atlas-core/src/providers/policies.ts` (allowed hosts, paths and methods, timeout, response cap, cache, daily budget, concurrency). Every outbound call, the contact form's call to Resend included, goes through the provider client in `api-server/src/lib/providers.ts` and then `guardedFetch`, which re-checks every redirect, drops credentials on a cross-origin redirect, rejects IP literals and private hosts, and enforces the limits. The client also shares one upstream call between identical concurrent requests, pauses a failing provider briefly, and honours `Retry-After`. A provider whose policy review is older than 180 days is switched off automatically.

## Security and privacy

- Pages are static. Astro writes a per-page Content-Security-Policy `<meta>` with hashes for every script and style it emits; `vercel.json` adds `frame-ancestors` and the other headers from `proof-atlas-core/src/site/headers.ts`. API responses use `default-src 'none'`.
- No analytics and no cookies. Fonts are self-hosted.
- The Document Workbench reads files in a Web Worker; nothing is uploaded (checked by `tests/e2e/workbench.spec.ts`).
- Ask the Atlas sends the model only the visitor's question and the public ledger entries retrieved for it, and the server rejects any answer citing something that was not retrieved.
- Client names and internal systems from employment are intentionally omitted.
- Rate limits are in memory per server instance; use a shared store if stricter limits are needed.

## Checks

```bash
pnpm run lint           # ESLint (TypeScript, React hooks, accessibility, Astro), no warnings allowed
pnpm run check          # source rules, type checks, unit and integration tests
pnpm run validate:providers   # the provider-policy gate on its own
pnpm run build          # check + builds + post-build verification of the site
pnpm run audit:prod     # dependency advisories for shipped code
pnpm run test:e2e       # Playwright (Chromium) against the Vercel-parity server, after build
pnpm run test:a11y      # the axe accessibility specs only
pnpm run smoke <url> [--expect-release <sha7>]      # read-only checks of a running deployment
pnpm run verify:production   # the same against https://anupam-roy.vercel.app
node scripts/contact-check.mjs <url> [--send]       # is contact delivery configured? --send sends one test message
```

To test the live contact form end to end, open **Actions → Smoke → Run workflow** and tick **contact_test**: one message labelled "Contact form check" is sent through the real form to the inbox in `CONTACT_TO_EMAIL`.

WebKit runs in CI. Locally, run `pnpm --filter @workspace/proof-atlas exec playwright install webkit` once and set `E2E_WEBKIT=1` to include it. To regenerate the social images or the PNG icons: `pnpm --filter @workspace/proof-atlas run og` or `run icons`.

`verify-portfolio-source.mjs` enforces content and wiring rules (74 PDF-backed credentials, banned wording such as "verified certifications", no secrets in site code). `verify-dist.mjs` checks every built page: one `<h1>`, CSP meta, canonical link, skip link, no inline styles, internal links and anchors that resolve, the outcome qualifier next to outcome figures, and per-page weight budgets for compressed JavaScript, CSS and HTML, preloaded fonts and images (`scripts/page-budgets.json`, set from measurements plus about 15 %; the homepage JavaScript also has a hard 120 KiB cap). It prints a per-page table.

## Deployment

Vercel runs `pnpm install --frozen-lockfile` and `pnpm run build`, serves `artifacts/proof-atlas/dist`, and rewrites `/api/*` to `api/index.js`. `vercel.json` also holds the legacy redirects (`/work/*`, `/studio/*`) and adds trailing slashes to page paths (never to `/api`). Unknown paths get the custom 404 page with a real 404 status.

## Licence

© Anupam Roy. All rights reserved: the source code, copy, certificates and images are not licensed for reuse (`"license": "UNLICENSED"`). Bundled fonts and dependencies keep their own licences; see `ASSET_LICENSES.md`.
