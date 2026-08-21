# Anupam Roy · Intelligence Systems Portfolio

A recruiter-focused full-stack portfolio for Anupam Roy: AI/ML Analyst, production GenAI and RAG engineer, multi-agent systems builder, cloud practitioner, and backend engineer.

Live site: [anupam-roy.vercel.app](https://anupam-roy.vercel.app/)

## What this repository contains

- A Vite + React + TypeScript frontend.
- An Express + TypeScript API for contact delivery and the portfolio consultant.
- A first-session cinematic entry signal plus one permanent hero—never two competing hero sections.
- Proof-led Experience, Systems, Projects, Mastery, Achievements, Education, Contact, and Executive Brief surfaces.
- Seventy-four credential records with matching local PDFs, thumbnails, and issuer links.
- A Gemini-streaming consultant with deterministic offline portfolio fallback.
- Accessibility, privacy, security-header, error-recovery, and deployment controls.

## Repository layout

```text
.
|-- api/
|   `-- index.js                         # Vercel Express function entry
|-- artifacts/
|   |-- anupam-intelligence-systems/    # Vite + React frontend
|   `-- api-server/                     # Express API
|-- scripts/                            # Source and release verification
|-- .env.example
|-- package.json
|-- pnpm-lock.yaml
|-- pnpm-workspace.yaml
|-- tsconfig.base.json
|-- tsconfig.json
`-- vercel.json
```

The frontend and API are separate workspace packages. During development, Vite proxies `/api` to Express. In production, Vercel serves the static frontend and rewrites `/api/*` to the serverless Express entry.

## Portfolio surfaces

The page composition is in `artifacts/anupam-intelligence-systems/src/pages/home.tsx`.

- **Portfolio Entry Signal** — first-session opening sequence with replay control, reduced-motion bypass, and focus-safe modal behavior.
- **Systems Provenance Atlas** — permanent hero with positioning, proof metrics, and operating-system signals.
- **Operating Thesis** — outcome-led profile, delivery lanes, skills, and evidence.
- **Operational AI Flight Recorder** — privacy-safe enterprise and backend experience.
- **Systems Architecture** — static-first multi-agent workflow, RCA trace, capabilities, and infrastructure.
- **Projects / AI Lab** — ranked project casefiles with architecture detail and category filters.
- **The Mastery Constellation** — searchable credential vault with PDFs and issuer verification.
- **Achievements** — CodeChef 5-Star / 2109 peak rating plus Credly and Google Cloud evidence.
- **Recognition ledger** — selectable visual receipts without cross-column stretching.
- **Education and Contact** — academic foundation and validated server-side contact delivery.
- **Executive Brief** — focused recruiter view with internal scrolling and keyboard controls.
- **Portfolio Consultant** — Gemini when available, portfolio-grounded offline answers otherwise.

Structured profile content lives in:

```text
artifacts/anupam-intelligence-systems/src/data/
```

## Requirements

- Node.js `>=22.12.0 <25`
- pnpm `>=10 <11` (the repository pins `pnpm@10.34.5`)

## Local development

```bash
corepack prepare pnpm@10.34.5 --activate
pnpm install --frozen-lockfile
pnpm run dev
```

Open `http://localhost:5173`. The API listens on `http://localhost:3001`.

## Environment variables

Copy `.env.example` to `.env` for local development or configure the same values in Vercel:

```env
CONTACT_TO_EMAIL=anupam020202@gmail.com
CONTACT_FROM_EMAIL=Anupam Roy Portfolio <onboarding@portfolio.dev>
RESEND_API_KEY=
GEMINI_API_KEY=
GEMINI_MODEL=gemini-2.5-flash
PORT=3001
VITE_API_PROXY_TARGET=http://localhost:3001
VITE_APP_RELEASE=local
```

Notes:

- `GEMINI_API_KEY` is optional. Without it, the consultant uses offline portfolio intelligence.
- `RESEND_API_KEY` is required for real contact delivery.
- Use a verified Resend sender for production.
- Never commit `.env` files or expose server keys through `VITE_*` variables.

## API routes

| Method | Route                | Purpose                                            |
| ------ | -------------------- | -------------------------------------------------- |
| `GET`  | `/api/healthz`       | Process health check                               |
| `POST` | `/api/contact`       | Validate, rate-limit, and deliver contact messages |
| `GET`  | `/api/gemini/status` | Report configured Gemini or offline mode           |
| `POST` | `/api/gemini/chat`   | Stream a stateless, portfolio-grounded response    |
| `POST` | `/api/client-error`  | Receive bounded browser diagnostics                |

### Gemini fallback semantics

`/api/gemini/chat` begins an SSE response with HTTP 200 before the upstream model stream is consumed. If Gemini later returns a provider error such as 502, the server emits a safe stream error and closes normally; the browser then labels and serves the deterministic offline portfolio answer. A provider warning followed by an outer HTTP 200 is therefore a recovered upstream failure—not an application crash or a false Gemini success.

The client disables further Gemini attempts for the current open consultant session after that failure. Closing and reopening the consultant performs a fresh availability check.

## Security and privacy

- API keys remain server-side.
- Express disables its identifying header and applies Helmet policies.
- Request bodies are bounded and routes are rate-limited.
- Contact input is validated, honeypot-protected, and escaped before email rendering.
- The Gemini system instruction is restricted to supplied portfolio facts.
- Generated Markdown links are restricted to known portfolio/proof hosts, section anchors, and the public portfolio email.
- Client names and internal system identifiers are intentionally excluded.
- Certificate paths are disallowed in `robots.txt` and receive no-index headers.
- Dialogs trap focus, restore focus, lock background interaction, and support Escape.

For multi-instance distributed rate limiting, replace the in-memory limiter with a shared service such as Upstash Redis.

## Complete release gate

Run from the repository root:

```bash
pnpm install --frozen-lockfile
pnpm run verify:source
pnpm run typecheck
pnpm test
pnpm run build
pnpm audit --prod
pnpm -r why protobufjs
pnpm -r why body-parser
git diff --check
```

Expected dependency resolutions:

- `protobufjs@7.6.5`
- `body-parser@2.3.0`

Do not deploy or merge if any required command fails.

## Responsive smoke matrix

Validate at minimum:

- 320 × 568 and 360 × 800
- 390 × 844 and 430 × 932
- 768 × 1024 and 820 × 1180
- 1024 × 768
- 1280 × 800, 1440 × 900, and a wide desktop

Check the entry signal, fixed navigation, hero, architecture map, project casefiles, credential modal, recognition ledger, Executive Brief, consultant, contact form, footer, keyboard-only navigation, reduced motion, zoom to 200%, and both portrait and landscape orientations.

## Deployment

`vercel.json` installs the frozen lockfile, runs the production build, serves `artifacts/anupam-intelligence-systems/dist/public`, preserves real 404 behavior, applies security/cache headers, and rewrites only `/api/*` to `api/index.js`.

After deployment, smoke-test:

- `/`
- a deliberately unknown path (must return the custom 404)
- `/api/healthz`
- `/api/gemini/status`
- Gemini success and offline-fallback responses
- contact validation and one real delivery
- at least one credential PDF and one issuer link
- keyboard focus, reduced motion, mobile menu, Executive Brief, and consultant

## Repository policy

Keep source, tests, deployment configuration, `.env.example`, credential PDFs, thumbnails, and production imagery. Do not commit `node_modules`, build output, coverage, caches, logs, screenshots, local ZIPs, private environment files, or one-time release/hotfix reports.

See `PRODUCTION_READINESS.md` for the release checklist and runtime interpretation.
