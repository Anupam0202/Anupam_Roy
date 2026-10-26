# ADR 0001 — Proof Atlas 3.0 framework and hosting

- Status: **Accepted 2026-10-25** — Option A (Astro static, this repository), hosted on Vercel (see [`DECISIONS.md`](../DECISIONS.md), Platform)
- Date: 2026-10-25
- Context: the requirements for Proof Atlas 3.0 and an audit of the previous Vite single-page site

## Context

Proof Atlas 3.0 requires, regardless of framework:

1. About 25 real routes (`/portfolio/nexusrag/`, `/workbench/documents/`,
   `/lab/retrieval-fusion/`, …), each with its own static HTML, title,
   description and canonical URL.
2. A true HTTP 404 for unknown routes, plus legacy redirects.
3. Core content readable without JavaScript.
4. Homepage initial JavaScript at or below 120 KiB compressed (review above 150 KiB).
5. Heavy tooling (document parsing, graph layout, Lab explorers) loaded only on
   the pages that use it.
6. A narrow API (`/api/*`) that static traffic never invokes.

The current repository is a client-rendered Vite + React single page with hash
sections, an Express API wrapped as one Vercel function, and a mature release
gate. Measured on `30ae68d`, the homepage loads **167 KiB gzip** of JavaScript
before any interaction, of which the React/Framer/Lucide vendor chunk alone is
125 KiB.

Proof Atlas 3.0 is also a **full visual redesign** (Mineral Ink light/dark
tokens, new typography, new section grammar). Almost every existing visual
component is replaced whichever framework is chosen. What survives is data,
assets, pure-logic helpers, tests and API logic.

## Options

### A. Astro (static output) in this repository — recommended

A new workspace package replaces the Vite frontend on a migration branch.

- Static HTML per route and `404.astro` → real 404 by default.
- Islands: React only where interactive (Workbench, Lab, credential filters).
  The mobile nav is a native `<dialog>` with a small Astro page script, not an
  island. Editorial pages can ship near-zero JavaScript, which is the only
  realistic way to meet the 120 KiB homepage budget.
- Existing TypeScript data modules, PDFs, images and pure-logic tests port
  directly. Existing React components can be reused as islands where useful.
- Sitemap, image optimisation and content collections are first-party, but the
  build uses none of them: the sitemap is a small endpoint
  (`src/pages/sitemap.xml.ts`), images are committed in the sizes the pages
  use, and content lives in typed data modules in `proof-atlas-core`.
- Cost: new build tooling, rewriting the verify script for the new tree, and
  porting the release gate. Most of this cost is shared with the redesign.

### B. Keep Vite + React and add prerendered routes

- Requires adding a router plus a build-time prerender/SSG layer, and hydrating
  every page as a SPA. The React runtime is then in every page's critical path,
  so the 120 KiB budget is hard to meet without re-architecting toward islands
  anyway.
- Lower tooling change, but the redesign still replaces the components.
- Real 404s and per-route metadata need custom handling.

### C. New separate repository

- Clean history, but loses this repository's tests, assets and Vercel project,
  and splits the source of truth, discarding working infrastructure for no
  gain. Not recommended.

## Hosting is a separate decision

Astro's static output deploys equally to Vercel and Cloudflare. On both, static
files are served from the CDN without invoking a function, so the
"asset-first, function only on `/api/*`" requirement holds either way.

| | Stay on Vercel | Move to Cloudflare Workers Static Assets |
|---|---|---|
| Public URL | Keeps `anupam-roy.vercel.app` (linked from GitHub profile, LinkedIn, JSON-LD, OG tags, sitemap) | `*.vercel.app` cannot move; needs a custom domain or a new `*.workers.dev` URL plus a redirect left on Vercel |
| API | Current Express function keeps working; can be slimmed later | Rewrite API routes as Worker `fetch` handlers (small: ~400 lines today) |
| Spec alignment | Allowed alternative ("retain Vercel only when owner chooses migration minimisation/current domain") | Spec's primary choice |
| Free-tier limits | Re-verify at implementation | Re-verify at implementation |

## Recommendation

- **Framework:** Option A — Astro static output, on a migration branch of this
  repository, keeping data, assets, tests and API logic.
- **Hosting:** stay on Vercel for the 3.0 launch **unless** the owner has a
  custom domain to put on Cloudflare. Moving hosts without a custom domain
  changes the public URL for no product benefit; it can be revisited once a
  domain exists. As built, the API is Express routers that receive their
  dependencies (`env`, `now`, `fetch`) through an injected `Deps` object, and
  the provider logic sits in `proof-atlas-core`, so a later move needs only a
  new adapter around the routers.

## Consequences

- The current site keeps deploying from `main` until the migration branch passes
  the full release gate and the owner approves the switch.
- `scripts/verify-portfolio-source.mjs` is rewritten for the new tree; its
  intent (credential/PDF integrity, link `rel` safety, no fabricated claims) is
  preserved.
- The `body-parser`/`qs` pins were resolved during the API work, and
  `pnpm audit --prod` passes in CI.
