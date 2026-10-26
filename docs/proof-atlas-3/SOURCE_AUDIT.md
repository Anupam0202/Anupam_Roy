# Proof Atlas 3.0 — Source audit and discrepancy report

> **Historical audit** of the retired Vite frontend at `30ae68d`; paths refer to that tree. §2 and §5 are resolved, and the §6 Cloudflare/adapter items are moot under D2 — see `VERIFICATION_REPORT.md`. Expiry dates were later removed from the credential data and the site by owner decision D4 (2026-10-26); the expiry rows below are kept only as the record of this audit.

Gate: **Source / owner decision gate** (required before implementation by
`MASTER_PROMPT.md`, "Final execution instruction").

Audit date: 2026-10-25

| Source inspected | Revision |
|---|---|
| `Anupam0202/Anupam_Roy` (this repository) | `30ae68d` (main, 2026-08-22) |
| `Anupam0202/NexusRAG` | `85b14f1` (main, 2026-10-07) |
| `Anupam0202/PlantPal` | `99071d4` (main, 2026-03-08) |
| GitHub profile `github.com/Anupam0202` | Public page, read 2026-10-25 |

Evidence levels used below follow the master prompt's provenance states:
`inspected` (read in source), `repository_documented` (README/doc claim),
`owner_reported`, `unverified`, `unavailable`.

---

## 1. Supplied source files are missing

The specification references files that are **not present** in this session or
repository. Nothing below was derived from them.

| Referenced file | Status |
|---|---|
| `PROOF_ATLAS_3_MASTER_BUILD_PROMPT.md` (bundle) | Missing. The pasted master prompt is preserved verbatim in `MASTER_PROMPT.md`. |
| `IMPLEMENTATION_CHECKLIST.md`, `TEST_PLAN.md`, `DEPLOYMENT_SCRIPTS_OUTLINE.md`, `TRAFFIC_AND_QUOTA_MODEL.md` | Missing |
| `API_UTILIZATION_MATRIX.csv`, `ASSET_MANIFEST.csv` | Missing (summary tables exist only in the pasted text) |
| 73-record credential dataset | **Missing** — required to diff against this repository's 74 records |
| Credential importer script | Missing |
| Owner source audit (73 entries, 1 missing, 0 links checked) | Missing |
| Proof Atlas 2.0 specification | Missing |
| API Atlas | Missing |

**Impact:** the credential diff the spec requires cannot be produced until the
73-record dataset is supplied (see decision D3).

---

## 2. Credentials: 73 vs 74

| Fact | Evidence |
|---|---|
| This repository has **74** records in `artifacts/anupam-intelligence-systems/src/data/certifications.ts` | inspected |
| Each record has a matching PDF (`public/certs/`, 74 files, 37 MB) and thumbnail (`public/cert-thumbs/`, 74 files) | inspected; enforced by `scripts/verify-portfolio-source.mjs` |
| The spec says the supplied dataset has **73** records with null dates and unchecked links | owner_reported (dataset unavailable here) |

### PDF cross-check performed in this audit

Text was extracted from all 74 PDFs (`pdftotext`) and compared to each record:

| Field | Result |
|---|---|
| Issue date | 73 / 73 text PDFs match |
| Credential ID | 73 / 73 text PDFs match |
| Expiry date | 64 match (incl. Claude cert, printed as "Oct. 27, 2026"); 9 records list no expiry |
| Title | Matches, allowing abbreviations (e.g. "ML" ↔ "Machine Learning", "GWS" ↔ "Google Workspace"). Snowflake/Databricks PDFs render the title as an image. |
| Image-only PDF | `databricks-data-engineer-associate.pdf` has no extractable text; the record also has no dates or credential ID. **Visually checked during this audit:** "Databricks Certified Data Engineer Associate", Anupam Roy, issued June 19, 2024, expires June 19, 2026, certificate number 106488721. These values are now transcribed into the record with provenance "transcribed from certificate image". |

Issuer verification links were **not** checked: outbound access to issuer hosts is
blocked by this environment's network policy. All 74 links remain
`link_unchecked`.

### Lifecycle status as of 2026-10-25 (computed from listed dates)

| Status | Count |
|---|---|
| Active (> 6 months to expiry) | 25 |
| Expiring within 6 months | 28 |
| Expired | 11 |
| No expiry listed | 9 |
| Dates unavailable | 1 |

Two of the eight **featured** credentials have expired and are also shown in the
Executive Brief: *Professional ML Engineer* (expired 2026-10-11) and
*Professional Cloud Architect* (expired 2026-07-13).

### Copy that conflicts with the spec

| Location | Current text | Spec rule |
|---|---|---|
| `src/data/profile.ts` metric | "74 Verified Certifications" | "74 verified certifications" is prohibited until reconciled and links are checked |
| `README.md` | "Seventy-four credential records with matching local PDFs" | Accurate for this repo; must not be read as reconciliation with the 73-record source |
| Gemini system prompt (`api-server/src/routes/gemini/index.ts`) | "74 credential records" | Same |

### Other credential-data defects (inspected)

- `getCertificationCategory` classifies **Dynamics 365 Supply Chain FC** as
  "AI / GenAI" because the case-insensitive `AI` pattern matches "Ch*ai*n"
  (`certifications.ts:1006`). The spec forbids invented categories anyway.

---

## 3. Profile and experience facts

| Field | This repository | Master prompt | Note |
|---|---|---|---|
| Degree | "Bachelor of Technology in Computer Science" | "B.Tech in Computer Science and Engineering" | Exact degree name differs |
| Institution | Guru Nanak Institute of Technology, Kolkata · affiliated with MAKAUT | MAKAUT, West Bengal | Repo adds the affiliated college |
| GPA / years | 9.14/10, 2018–2022 | Same | Consistent |
| Job titles | Associate Software Engineer (Aug 2022–Nov 2023); AI/ML Analyst (Dec 2023–present) | Same | Consistent. The spec's positioning line says "AI/ML Engineer"; the job title must stay "AI/ML Analyst". |
| Outcomes | "~20% / ~50%" shown without qualification | Must carry "Approximate improvements reported by Anupam; not independently audited." | Copy change needed |
| CodeChef 5★ / 2109 peak | Present, linked | Present | owner_reported (CodeChef not reachable from here) |
| 180+ Credly badges | Present | Not mentioned in spec | owner_reported |
| School results (Class XII 73%, Class X 84%) | Present | Not in spec | Owner decides whether to keep |

**Privacy wording:** the hero names specific tools (Jira, Confluence,
SharePoint, Splunk, ServiceNow — `hero-section.tsx:44,60`) while the experience
data and Gemini prompt deliberately generalise them. They are vendor names, not
client names, but the spec forbids exposing internal/proprietary architecture.
Owner should decide whether they stay.

---

## 4. Projects

The nine curated projects in `src/data/projects.ts` exactly match the spec's list.

**New candidate for owner review** (on the public GitHub profile, not in the
curated nine): `mavunoguard-ai`. Not inspected; listed only so the owner can
decide.

### Other curated repositories (README and file list inspected)

| Repository | Commit | Evidence found | Licence file |
|---|---|---|---|
| RAG | `ac1fe8b` (2026-03-07) | README documents FAISS + BM25 hybrid search, multi-format ingestion (Excel/CSV/PDF/DOCX/TXT/MD/JSON), chat memory, runtime API key; files `rag_app.py`, `streamlit_app.py` | none |
| Contextual-RAG-Chatbot | `3272463` (2025-12-02) | README documents PDF processing with OCR fallback, hybrid search, 1–20 message context window, analytics with Excel/HTML export; files `rag_core.py`, `pdf_processor.py`, `vector_store.py` | none |
| Handwritten-Chemical_Compound-Detection | `6838c9e` (2022-07-07) | TensorFlow Object Detection API pipeline (label map, TFRecord generation, SSD EfficientDet-D0 config, training/inference notebooks, labelled training images) | none |
| My-Portfolio | `482f459` (2022-03-16) | Next.js/React portfolio; README live link `portfolioanupamroy.netlify.app` | none |
| Anupam-Portfolio | `2dc1228` (2022-03-16) | React portfolio; README documents SCSS, Framer Motion and Sanity; live link `anupamroyportfolio.netlify.app` | none |
| Real-Estate | `c8f1211` (2022-01-04) | Next.js pages for listing, search and property detail; README has no description or live link | none |
| Modern_UI-UX_GPT3 | `04276f9` (2022-01-04) | React landing page; README live link `anupam0202.github.io/Modern_UI-UX_GPT3` | none |

None of the seven has a licence file, so the portfolio must not state a licence
for them.

### NexusRAG (inspected at `85b14f1`)

The spec's two-lane requirement is confirmed by the repository:

- README: the bounded runtime uses Cloudflare, Supabase, Qdrant, Gemini and
  Next.js 16; FastAPI holds "additional local/research implementations"; the
  feature inventory is "not a guarantee that every feature is enabled in the
  deployed gateway"; "Production readiness and defect-free operation are not
  claimed."
- `docs/DEPLOYMENT_STATUS.md`: status `PREVIEW_VERIFIED`; **no custom domain is
  connected** (line 23).
- `docs/MASTER_PROMPT_AUDIT.md`: status `PARTIAL_NOT_COMPLETE` (line 3, restated
  in later sections); the candidate frontend was deployed to a `workers.dev`
  preview origin (line 278).
- The gateway's own capability report (`apps/gateway/src/preview-worker.js:717`)
  declares `streaming: false`, `reranking: false`, `semantic_cache: false`,
  `semantic_chunking: false`, `ocr: false`, `product_readiness: "NOT_VERIFIED"`;
  runtime settings (lines 208–224) fix top-k at 1–12, send only the current
  question (no chat history) and disable contextual enrichment.
- A pure RRF library exists in `packages/retrieval/src/fusion.ts` (`k = 60`,
  ranks must be positive integers, duplicates within one list are skipped, ties
  broken by ID), but **the deployed gateway does not call it**.
- The deployed gateway entry (`apps/gateway/src/preview-worker.js`, the `main`
  of both `wrangler.preview.jsonc` and `wrangler.production.jsonc`) calls
  `hybridFuse` in `apps/gateway/src/worker-lifecycle.js:91`. It computes
  RRF-style contributions `1 / (61 + rank)` (0-based rank, equivalent to
  k = 60) for Qdrant dense hits and for a **lexical term-coverage score** (share
  of unique query terms of 3+ characters present in the chunk — not BM25), then
  ranks by `α·dense + (1−α)·(lexical + 0.02·coverage)` with workspace
  `hybrid_search_alpha` (default 0.6), returning at most 12 results.
  The case study must describe this blend, not plain RRF.

**Conflicts with this portfolio's NexusRAG entry:**

| Portfolio says | NexusRAG repository says |
|---|---|
| Live link `https://nexusrag.vercel.app` | "Vercel and Render are not active deployment paths"; Vercel config removed |
| Tech tag "Vercel" | Deploy target is Cloudflare Workers/OpenNext + Supabase + Qdrant |
| "BM25 + FAISS hybrid retrieval", "WebSocket token streaming", "Runtime API key management" presented as one system | These are Python research-path features; gateway uses its own lexical/dense fusion |

**Internal inconsistency inside NexusRAG's README:** line 77 says "The repository
ships no usable provider key", line 406 says "NexusRAG ships with a default API
key for quick evaluation." The case study should cite neither as fact until
resolved.

### PlantPal (inspected at `99071d4`)

| README claim | What the code shows |
|---|---|
| "Quantify your garden's exact CO₂ sequestration" | Fixed per-category lookup table in `components/CarbonDashboard.tsx` (e.g. tree = 22 kg/yr). An estimate, not a measurement. Community map CO₂ values are hard-coded demo data. |
| "Plant Doctor … will diagnose the issue" | Gemini image interpretation; not a validated diagnosis |
| "Climate Trend Forecaster … predict temperature shifts" | Displays Open-Meteo CMIP6 projections; projection, not prediction |
| "8+ free real-time APIs" | Hosts called: Open-Meteo (5 subdomains), ISRIC SoilGrids, GBIF, Sunrise-Sunset, Open-Elevation, **ipapi.co** (IP geolocation, not listed in README) |
| "available under the MIT License" | **No LICENSE file** in the repository |
| "Queries the GBIF network to determine exactly how many native plants and animals live within 10km" | `environmentalDataService.ts:411-436` samples up to 300 plant occurrence records in a ±0.1° latitude/longitude box; there is no native-status filter |
| "30-year CMIP6 climate models … 2050/2080" | Lines 380–386 query one CMIP6 model (`CMCC_CM2_SR5`) for 2041–2060 and 2071–2090; a comment mentions SSP2-4.5 and SSP5-8.5 but the requests do not select a scenario |
| "static data (SoilGrids, Elevation) lives for 30 days" | The 30-day TTL is commented out as "reserved for future" (line 36); active TTLs are 15 minutes and 24 hours |
| User API key "safely" injected | Stored in `localStorage` in plain text (`geminiService.ts:5-26`) |

**Security issue (PlantPal repo, out of this repo's scope):** `vite.config.ts`
uses `define` to inline `GEMINI_API_KEY` into the client bundle, with
`sourcemap: true`. Any deployment built with a key exposes it publicly. The case
study's "security boundary" section must not describe the key as server-side.

**Provider rights:** PlantPal depends on Open-Meteo's free hosted API, which the
spec notes is non-commercial. Any live PlantPal exhibit inside Proof Atlas must
use dated captured data or synthetic data unless the owner approves a licensed
configuration (decision D9).

### Live URL status

Not verified. This environment blocks outbound connections to
`*.vercel.app`, `*.workers.dev`, issuer sites and the web-fetch tool's DNS
resolution failed even for `nextjs.org`. Every live link stays `unverified`
until checked from an unrestricted network.

---

## 5. Current repository health (relevant to migration)

| Check | Result on `30ae68d` |
|---|---|
| `verify:source`, `typecheck`, 23 unit tests, build | Pass |
| `pnpm audit --prod` | **Fails:** `proxy-addr` (critical), `body-parser` (high), `qs` ×2 (moderate). `body-parser@2.3.0` and `qs@6.15.2` are pinned by `pnpm-workspace.yaml` overrides and asserted by the verify script. |
| Eager homepage JavaScript | **167 KiB gzip** (react-vendor 125 KiB + app 21 KiB + markdown 21 KiB) — above the spec's 120 KiB target and 150 KiB review line |
| Routes | Single page; sections are hash anchors. No per-route HTML. |
| Keyboard defects (browser-confirmed) | Arrow keys in Experience/Projects tabs throw a `TypeError`; skip link does not move focus |

Assets worth carrying forward: the 74 PDFs/thumbnails, the seven achievement
images, the structured data files, the RRF/consultant-stream/safe-link/entry
helpers and their tests, the contact route's validation and Resend fallback
logic, and the verify-script approach (to be rewritten for the new tree).

---

## 6. Spec facts that must be re-verified at implementation time

The spec's provider capacities and terms are cited from external research and
could not be checked from this environment. They must be re-verified (with
dates recorded in the ProviderPolicy registry) before any provider is enabled:

- Cloudflare Workers Free limits and `run_worker_first` behaviour
- GitHub REST limits; GitHub SBOM synchronous export closure (spec says after
  2026-11-13 — 19 days after this audit)
- Crossref, DataCite, OpenAlex, ROR rate tiers and terms
- Open-Meteo and Gemini free-tier terms
- Package versions: at audit time npm reported `astro@7.4.2`,
  `@astrojs/react@7.1.1`, `@astrojs/vercel@11.0.16`,
  `@astrojs/cloudflare@14.4.2`, `wrangler@4.152.0`
