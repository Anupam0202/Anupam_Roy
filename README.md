# Anupam Roy Portfolio

Premium AI/ML engineer portfolio for Anupam Roy, focused on production GenAI, RAG, multi-agent systems, cloud AI, backend engineering, verified certifications, and recruiter-facing proof.

## What This Portfolio Is

This is not a static resume page. It is a recruiter-facing AI systems command center with:

- A live-feeling hero and operational systems interface.
- Privacy-safe enterprise experience storytelling.
- A dynamic experience console for AI/ML and software engineering roles.
- A single ranked project lab covering all projects.
- A certification mastery vault with PDFs, thumbnails, filters, search, and credential links.
- A hybrid AI consultant with Gemini support and no-key offline fallback.
- A working contact form API.
- A compact executive hiring brief.

Client names and internal system identifiers are intentionally not exposed. Enterprise work is described using generic workflow, architecture, impact, and technology language.

## Workspace Structure

```text
.
├── artifacts/
│   ├── anupam-intelligence-systems/   # Vite + React portfolio frontend
│   └── api-server/                    # Express API server
├── lib/
│   ├── api-client-react/              # Generated React Query API client
│   ├── api-spec/                      # OpenAPI specification
│   ├── api-zod/                       # Generated Zod validators
│   ├── db/                            # Optional Drizzle/Postgres conversation schema
│   └── integrations-gemini-ai/        # Gemini integration helpers
├── scripts/                           # Workspace utility scripts
├── .env.example
├── package.json
├── pnpm-workspace.yaml
└── tsconfig.json
```

## Frontend Sections

The active portfolio page is assembled in:

```text
artifacts/anupam-intelligence-systems/src/pages/home.tsx
```

Main sections:

- Hero - animated AI systems identity and live operations feed.
- About - concise production AI positioning.
- Experience - dynamic role console for AI/ML Analyst and Associate Software Engineer.
- Operational AI Infrastructure - capability map and live enterprise architecture visuals.
- Systems - engineering capability map across retrieval, agents, OCR, backend, cloud, security, and automation.
- Projects - one ranked AI Lab for all projects.
- Intelligence Vault - ecosystem capability graph.
- Mastery Wall - 74 certification PDFs and issuer links.
- Achievements - Google Cloud and Credly proof signals.
- Education - compact academic history.
- Contact - validated API-backed contact form.
- AI Consultant - Gemini-powered when configured, offline portfolio mode otherwise.
- Executive View - short hiring brief overlay.

## Backend APIs

The API server lives in:

```text
artifacts/api-server/src
```

Routes:

- `GET /api/healthz` - server health.
- `POST /api/contact` - contact form validation, honeypot, rate limiting, Resend delivery.
- `GET /api/gemini/status` - returns `gemini` or `offline`.
- `GET /api/gemini/conversations` - list conversations.
- `POST /api/gemini/conversations` - create conversation.
- `GET /api/gemini/conversations/:id` - get conversation with messages.
- `DELETE /api/gemini/conversations/:id` - delete conversation.
- `GET /api/gemini/conversations/:id/messages` - list messages.
- `POST /api/gemini/conversations/:id/messages` - stream Gemini response with portfolio-safe system prompt.
- `POST /api/gemini/generate-image` - optional Gemini image route, disabled until a key is configured.
- `GET /api/portfolio/status` - backend telemetry endpoint used for diagnostics.

The AI consultant is privacy-safe. It is instructed not to invent employers, metrics, projects, certifications, or client-specific details.

## Environment Variables

Copy `.env.example` to `.env` locally or configure the same values in deployment.

```env
CONTACT_TO_EMAIL=anupam020202@gmail.com
CONTACT_FROM_EMAIL=Anupam Roy Portfolio <onboarding@resend.dev>
CONTACT_FALLBACK_FROM_EMAIL=Anupam Roy Portfolio <onboarding@resend.dev>
RESEND_SANDBOX_TO_EMAIL=
RESEND_API_KEY=
GEMINI_API_KEY=
GEMINI_MODEL=gemini-2.5-flash
GEMINI_IMAGE_MODEL=gemini-2.5-flash-image
DATABASE_URL=
PORT=3001
VITE_API_PROXY_TARGET=http://localhost:3001
```

Notes:

- `GEMINI_API_KEY` is optional. Without it, the AI consultant uses offline portfolio intelligence.
- `RESEND_API_KEY` is required for real email delivery.
- If the Resend account is still in testing mode, `CONTACT_TO_EMAIL` must be the account owner email, or set `RESEND_SANDBOX_TO_EMAIL` so the API can fall back to the allowed testing recipient.
- `CONTACT_FROM_EMAIL` should use a sender verified in your Resend account. Until a custom domain is verified, keep the Resend onboarding sender.
- `CONTACT_FALLBACK_FROM_EMAIL` is used automatically if Resend rejects an unverified custom sender domain.
- `DATABASE_URL` is optional. Without it, conversations use in-memory runtime storage.
- Never hardcode API keys in frontend files.

## Run Locally

Install dependencies:

```bash
pnpm install
```

Run the full local stack:

```bash
pnpm run dev
```

Open:

```text
http://localhost:5173
```

The Vite dev server proxies `/api` to `http://localhost:3001`.

To serve the production build locally:

```bash
pnpm run build
pnpm run start
```

Then open `http://localhost:3001`.

## Build and Verify

Full workspace build:

```bash
pnpm run build
```

Frontend typecheck:

```bash
pnpm --filter @workspace/anupam-intelligence-systems run typecheck
```

API typecheck:

```bash
pnpm --filter @workspace/api-server run typecheck
```

API smoke checks:

```bash
curl http://localhost:3001/api/healthz
curl http://localhost:3001/api/gemini/status
curl http://localhost:3001/api/portfolio/status
```

## Content Data Files

Portfolio content is structured under:

```text
artifacts/anupam-intelligence-systems/src/data
```

Key files:

- `profile.ts` - identity, links, metrics, executive proof points.
- `experience.ts` - privacy-safe role data.
- `projects.ts` - ranked project data.
- `certifications.ts` - certification wall data, PDFs, thumbnails, verification links.
- `achievements.ts` - milestone proof.
- `skills.ts` - skill groups.
- `education.ts` - education records.
- `assistant.ts` - offline AI consultant knowledge base.
- `types.ts` - shared TypeScript interfaces.

## Certification Assets

Certification PDFs and thumbnails are served from:

```text
artifacts/anupam-intelligence-systems/public/certs
artifacts/anupam-intelligence-systems/public/cert-thumbs
```

The Mastery Wall uses these assets plus issuer verification URLs from `certifications.ts`.

## Privacy and Compliance Notes

- Do not add client names, internal project names, or private system names.
- Describe enterprise work by capability: incident intelligence, ITSM automation, release intelligence, RAG, logs, ticketing, documentation, source control, data pipelines, and compliance reporting.
- Keep metrics only where already supported: 20% faster turnaround and 50% reduced SME dependency.
- Keep all API keys in environment variables.

## Deployment Notes

Live production URL: `https://anupam-roy.vercel.app/`

For the included Vercel deployment:

- `vercel.json` builds the full workspace with `pnpm run build`.
- The frontend output is served from `artifacts/anupam-intelligence-systems/dist/public`.
- `/api/*` traffic is routed to the bundled Express API function in `api/index.js`.
- Configure `RESEND_API_KEY`, `GEMINI_API_KEY`, and `DATABASE_URL` as environment variables.

For a single Node host:

- Build the frontend and API.
- Start `artifacts/api-server`; it serves the compiled frontend from `dist/public` when available.

## Current Quality Gates

- TypeScript build passes.
- Frontend and API typecheck pass.
- AI consultant works without keys using offline mode.
- Contact form validates before server delivery.
- Certification wall uses local PDF and thumbnail assets.
- Executive view locks background scroll and scrolls inside the overlay.
