# Anupam Roy Portfolio

Recruiter-focused AI/ML engineering portfolio for Anupam Roy. The application presents production GenAI, RAG, multi-agent systems, backend engineering, cloud depth, verified certifications, and measurable enterprise impact without exposing client or internal system details.

Live site: [anupam-roy.vercel.app](https://anupam-roy.vercel.app/)

## Product Goals

- Make production AI engineering proof easy to scan.
- Keep every major section distinct and useful.
- Provide interactive architecture views without fake live telemetry.
- Offer a useful portfolio concierge with Gemini and offline fallback.
- Keep contact delivery server-side and secrets out of the browser.
- Remain fast, accessible, privacy-safe, and responsive.

## Architecture

```text
.
|-- api/
|   `-- index.js                         # Vercel Express function entry
|-- artifacts/
|   |-- anupam-intelligence-systems/    # Vite + React frontend
|   `-- api-server/                     # Express API
|-- scripts/                            # Workspace utilities
|-- .env.example
|-- package.json
|-- pnpm-workspace.yaml
|-- tsconfig.base.json
|-- tsconfig.json
`-- vercel.json
```

The frontend and API are separate workspace packages. In development, Vite proxies `/api` requests to Express. In production, Vercel serves the static frontend and rewrites `/api/*` to the Express function.

## Frontend Sections

The page composition lives in `artifacts/anupam-intelligence-systems/src/pages/home.tsx`.

- **Hero** - positioning, proof metrics, technology signals, and representative operations feed.
- **About** - direct outcome-led narrative and skills.
- **Experience** - privacy-safe interactive role console for AI/ML and software engineering work.
- **Systems** - multi-agent architecture, incident correlation workflow, capabilities, and infrastructure stack.
- **Projects** - one ranked project lab with architecture details and category filters.
- **Mastery** - searchable certification vault with 74 PDFs and issuer verification links.
- **Achievements** - Google Cloud and Credly milestones with proof links and images.
- **Education** - compact academic foundation.
- **Contact** - validated, honeypot-protected, rate-limited server-side email form.
- **Portfolio Concierge** - Gemini streaming when configured, deterministic offline answers otherwise.
- **Executive View** - focused hiring brief with internal scrolling and keyboard controls.

Structured portfolio content lives under:

```text
artifacts/anupam-intelligence-systems/src/data/
```

## Backend APIs

The API source lives in `artifacts/api-server/src`.

| Method | Route | Purpose |
|---|---|---|
| `GET` | `/api/healthz` | Health check |
| `POST` | `/api/contact` | Validate and deliver contact messages with Resend |
| `GET` | `/api/gemini/status` | Report Gemini or offline mode |
| `POST` | `/api/gemini/chat` | Stream a stateless, portfolio-grounded Gemini response |

The concierge API is intentionally stateless. It does not expose public conversation listing, reading, or deletion endpoints. The browser sends only a short recent-history window with each request.

## Security And Privacy

- API keys are read only from server environment variables.
- Express disables its identifying header and applies Helmet security headers.
- JSON request bodies are limited to 24 KB.
- Contact and Gemini routes use bounded in-memory rate limiting.
- Contact messages are escaped before HTML email rendering.
- The contact form includes client and server validation plus a honeypot.
- The Gemini system instruction limits answers to supplied portfolio facts.
- Client names and internal system identifiers are intentionally excluded.
- Public APIs use `Cache-Control: no-store` where responses may vary by configuration.

For multi-instance production-grade distributed rate limiting, replace the in-memory limiter with a shared provider such as Upstash Redis.

## Environment Variables

Copy `.env.example` to `.env` for local development or configure the same values in Vercel:

```env
CONTACT_TO_EMAIL=anupam020202@gmail.com
CONTACT_FROM_EMAIL=Anupam Roy Portfolio <onboarding@resend.dev>
CONTACT_FALLBACK_FROM_EMAIL=Anupam Roy Portfolio <onboarding@resend.dev>
RESEND_SANDBOX_TO_EMAIL=
RESEND_API_KEY=
GEMINI_API_KEY=
GEMINI_MODEL=gemini-2.5-flash
PORT=3001
VITE_API_PROXY_TARGET=http://localhost:3001
```

Notes:

- `GEMINI_API_KEY` is optional. Without it, the concierge uses offline portfolio intelligence.
- `RESEND_API_KEY` is required for real contact delivery.
- `CONTACT_FROM_EMAIL` should use a verified Resend sender. The onboarding sender is suitable for Resend testing mode.
- Never commit `.env` or expose server keys through `VITE_*` variables.

## Local Development

Requirements:

- Node.js 20+
- pnpm 10+

Install and run:

```bash
pnpm install
pnpm run dev
```

Open `http://localhost:5173`.

Build and serve the production bundle:

```bash
pnpm run build
pnpm run start
```

Open `http://localhost:3001`.

## Quality Gates

```bash
pnpm run typecheck
pnpm run build
pnpm run audit:prod
pnpm dlx knip --reporter compact
```

API smoke checks:

```bash
curl http://localhost:3001/api/healthz
curl http://localhost:3001/api/gemini/status
```

Contact validation can be checked without sending email:

```bash
curl -X POST http://localhost:3001/api/contact \
  -H "Content-Type: application/json" \
  -d "{}"
```

## Certification Assets

The Mastery Wall serves local certificate assets from:

```text
artifacts/anupam-intelligence-systems/public/certs/
artifacts/anupam-intelligence-systems/public/cert-thumbs/
```

Credential metadata and official verification links are defined in `src/data/certifications.ts`.

## Deployment

`vercel.json` contains the production build and rewrite configuration:

1. Install the frozen pnpm lockfile.
2. Typecheck and build the frontend and API.
3. Serve the frontend output from `artifacts/anupam-intelligence-systems/dist/public`.
4. Rewrite `/api/*` to `api/index.js`.
5. Rewrite other paths to the SPA entry.

Configure production environment variables in Vercel before deployment.

## Content Rules

- Describe enterprise work by capability, architecture, impact, and technology.
- Do not add client names, internal project names, or private system identifiers.
- Do not invent metrics, certifications, responsibilities, or project behavior.
- Keep supported impact metrics limited to approximately 20% faster turnaround and 50% lower SME dependency.
