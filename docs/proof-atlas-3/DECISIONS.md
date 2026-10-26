# Proof Atlas 3.0 — Owner decision register

Each decision below is the owner's to make. "Default" is what implementation
will use if the owner has not decided yet; **blocking** decisions have no safe
default and stop the phase listed.

Evidence for every row is in `SOURCE_AUDIT.md`. Update the **Status** column
when a decision is made (`decided: <choice> (<date>)`).

| ID | Decision | Options | Recommendation / default | Blocks | Status |
|---|---|---|---|---|---|
| D1 | Implementation repository and framework | A. Astro static in this repo · B. Keep Vite React + prerender · C. New repo | **A** (ADR 0001) | Foundation | **decided: A — Astro static in this repository (2026-10-25)** |
| D2 | Hosting and canonical domain | Stay on Vercel (`anupam-roy.vercel.app`) · Cloudflare with an owned custom domain · Cloudflare `workers.dev` + redirect from Vercel | Stay on Vercel unless a custom domain exists (ADR 0001) | Release | **decided: stay on Vercel, canonical `https://anupam-roy.vercel.app` (2026-10-25)** |
| D3 | Credential source of truth | Approve this repo's 74 PDF-backed records · Supply the 73-record dataset for a diff first · Show 73 + "pending" note | Approve the 74 PDF-backed records. The image-only Databricks PDF was visually checked during the audit (see `SOURCE_AUDIT.md` §2). | Credentials page | **decided: this repository's 74 PDF-backed records are the source of truth (2026-10-25). Issuer links remain `link_unchecked` until checked.** |
| D4 | Credential dates | Issue date only · Issue and expiry dates with a computed status · Hide expired records | Issue date only | Credentials page | **decided by owner (2026-10-26): show the "issued on" date only.** Expiry dates are not recorded in the data or shown anywhere; all eight owner-selected highlights are shown. |
| D5 | Missing spec bundle (checklist, test plan, CSVs, dataset, audit, API Atlas) | Treat the pasted master prompt as authoritative · Upload the files first | Treat `MASTER_PROMPT.md` as authoritative; add the files to `docs/proof-atlas-3/sources/` if available | — | default: `MASTER_PROMPT.md` is authoritative. Only the 105-service screening sheet was later supplied (`API_SCREENING_105.csv`); the other bundle files were not. |
| D6 | AI assistant ("Ask the Atlas"); the current site already has a Gemini consultant with offline fallback | Off (deterministic Source Navigator) · On with an owner-chosen model, tier and budget | **Off** (spec default) | — | **decided: keep Gemini, limited to public portfolio evidence with server-validated citations; deterministic Source Navigator stays as the fallback (2026-10-25). Runs only when `GEMINI_API_KEY` is set; `AI_ASSISTANT_ENABLED=false` turns it off. Model and budget: existing `GEMINI_MODEL` (default `gemini-2.5-flash`) and the server rate limit.** Note (2026-10-26): the code default is now `gemini-3.8-flash` (see `PROVIDER_REVIEW.md`); the decision itself is unchanged. |
| D7 | Contact form | Keep the existing server-side Resend form · Email link only | Keep the existing form (already built and tested). The default sender is now `onboarding@resend.dev`, which Resend only delivers to the account owner; a sender on a domain verified in Resend is owner-pending. | Contact page | default: keep; verified sender domain owner-pending |
| D8 | Newer GitHub repositories (e.g. `mavunoguard-ai`) | Keep the curated nine · Add selected repositories | Keep the curated nine | — | **decided: analyze every public project repository and show each one (2026-10-26). 17 projects; the private NexusRAG-Recovery and the profile repository are not shown.** |
| D9 | Environmental data rights for PlantPal exhibit | Dated captured sample · Synthetic data · Licensed live provider | Dated captured sample or synthetic; no live Open-Meteo free tier | PlantPal page | default: no live provider |
| D10 | Optional citation enrichments | DataCite / OpenAlex / ROR on or off | DataCite on, OpenAlex off, ROR off (spec defaults) | — | default per spec |
| D11 | Portrait and résumé publication | Publish · Do not publish | Do not publish | — | default: no |
| D12 | Vendor tool names in hero (Jira, Confluence, SharePoint, Splunk, ServiceNow) | Keep · Generalise | Generalise, matching the experience data | Home | default: generalise |
| D13 | Degree wording | "B.Tech in Computer Science and Engineering, MAKAUT" (spec) · "Bachelor of Technology in Computer Science, Guru Nanak Institute of Technology (MAKAUT)" (current site) | Owner confirms exact degree name and whether to name the college | About / Education | default: spec's owner-supplied degree name, keeping the college named on the current site; owner can override |
| D14 | Class X / XII results | Keep · Remove | Owner preference | About / Education | default: keep (current site content) |
| D15 | NexusRAG public link | Repository only · `workers.dev` preview URL · A future custom domain | Repository link only until a live URL is confirmed (`nexusrag.vercel.app` is contradicted by NexusRAG's own docs) | NexusRAG page | default: repo only |
| D16 | PlantPal public link | Link the live app · Repository only | Repository only until the client-side Gemini key exposure in PlantPal's `vite.config.ts` is fixed and the key rotated | PlantPal page | default: repo only |
| D17 | "Approximate 20% / 50%" outcomes | Show with the spec's qualification · Remove | Show with "Approximate improvements reported by Anupam; not independently audited." | Home / Experience | default: qualified |

## Interpretations and defaults from the completion session (2026-10-26)

None of these is an owner decision. Each is the default used until the owner confirms or overrides it.

| ID | Decision | Options | Recommendation / default | Blocks | Status |
|---|---|---|---|---|---|
| D18 | Release method | Squash: `main` gets one commit with the verified tree, parent `30ae68d` · History: fast-forward to the branch head | Squash | Release | default accepted in the master prompt (2026-10-26) |
| D19 | Licence | UNLICENSED, all rights reserved · MIT for source code only | UNLICENSED | — | default accepted in the master prompt (2026-10-26) |
| D20 | Platform overrides in `pnpm-workspace.yaml` | Keep (Linux x64 and Windows x64 supported) · Remove for portability | Keep, with a YAML comment | — | default accepted in the master prompt (2026-10-26) |
| D21 | Specification documents | Keep `MASTER_PROMPT.md` and `API_SCREENING_105.csv` public as provenance · Remove | Keep | — | default accepted in the master prompt (2026-10-26) |
| D22 | PlantPal page order (G1) | The truth contract (spec L309–319) · The page sequence (spec L1074–1084) | The two sections of the spec contradict each other; the page sequence was followed, with Repository and Limitations as separate sections | PlantPal page | default: page sequence followed |
| D23 | UI states the spec names (G3) | Show every named state · Merge states a visitor cannot observe | Implemented: repository `fetching`, document `indexing` and `parser-failed`, citation `success-partial` (a "Partial result" badge). Merged: repository `validating` into the form state, because validation runs synchronously in the browser and is never visible on its own | Workbench | default: merge `validating` only |
| D24 | PyPI timeout (B19) | 5 s (spec L1267) · 8 s | 8 s: PyPI's JSON documents for large packages run to several megabytes (numpy ≈3.7 MB, boto3 ≈3.3 MB; `PROVIDER_REVIEW.md` lines 21–22), and the dependency step has an overall 20 s deadline that returns partial results | Repository tool | default: 8 s |
| D25 | Optional command palette (G8) | Build · Do not build | default: not built — the spec marks it optional; the header navigation and the per-page search filters cover the same need | — | default: not built |
| D26 | PDF and DOCX extraction (G8) | Build · Do not build | default: not built — optional in the spec after a performance review; a PDF parser would add a large client bundle and a parser attack surface. The tool says so and asks for pasted text | Document Workbench | default: not built |
| D27 | Standalone asset files (spec L2020–2064) (G8) | Ship them as files · Inline components | default: not built — the inline SVG and HTML components replace them | — | default: not built |
| D28 | Spec script names (G8) | Add aliases · Map to existing scripts | default: not built — `validate:content` is `verify:source`; deploys come from the Vercel Git integration, so no deploy script exists | — | default: not built |
| D29 | Firefox Playwright project (G8) | Add · Chromium and WebKit only | default: not built — Chromium runs every spec and WebKit the page-level specs in CI; a third engine would add about 500 layout tests per run | CI | default: not built |
| D30 | Prettier (G8) | Add · ESLint only | default: not built — ESLint now gates correctness; adding a formatter would rewrite every file in one unreviewable diff | — | default: not built |
| D31 | jsx-a11y plugin for ESLint 10 | `eslint-plugin-jsx-a11y` (supports ESLint ≤ 9) on ESLint 9 · `eslint-plugin-jsx-a11y-x` (maintained fork) on ESLint 10 | The fork on ESLint 10: ESLint 9 is no longer supported, and `eslint-plugin-astro` 3 accepts the fork | — | default: the fork |
| D32 | Manrope subsets (F6) | Trim the font's unicode-range subsets · Keep them | Keep: the browser downloads only the subsets a page's text uses, so unused subsets cost nothing; the unused upright Newsreader import was dropped and the italic is preloaded only where it renders | — | default: keep |
| D33 | Document Workbench mode toggle (C2) | Keep results and label them with their mode · Re-run the search in the new mode | Re-run: labels and exports always describe the ranking that produced the results on screen | Document Workbench | default: re-run |

