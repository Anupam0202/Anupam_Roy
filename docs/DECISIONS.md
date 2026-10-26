# Design decisions

The choices that shape this site, and the reason for each. Dates record when a choice was made; the architecture choice has its own record in [ADR 0001](adr/0001-proof-atlas-3-framework-and-hosting.md).

## Platform

| Decision | Choice | Why |
| --- | --- | --- |
| Framework | Static Astro site with small React islands, in this repository (2026-10-25) | Every route ships real HTML that works without JavaScript; interactive tools load only where they are used. |
| Hosting | Vercel, canonical address `https://anupam-roy.vercel.app` (2026-10-25) | No custom domain yet; Vercel serves the static build and the API from one project. |
| API | One Express app deployed as Vercel functions | Status, Ask the Atlas, the contact form and the Workbench lookups share one provider client and one outbound-request guard. |
| Outside services | Only providers that serve a feature, allow this use and have a policy entry | Each provider's hosts, limits, budget and review date live in `proof-atlas-core/src/providers/policies.ts`; the screening of 105 services is in [`PROVIDER_REVIEW.md`](PROVIDER_REVIEW.md). |
| Licence | All rights reserved (`UNLICENSED`) | The code, copy, certificates and images are personal work and not offered for reuse. |

## Content

| Decision | Choice | Why |
| --- | --- | --- |
| Credentials | The 74 records backed by certificate PDFs in this repository are the source of truth (2026-10-25) | Issue dates and credential IDs are checked against the PDFs; issuer links are marked as not yet individually checked. |
| Credential dates | Issue date only (2026-10-26) | Expiry dates are not recorded or shown; all eight highlighted credentials are listed. |
| Projects | Every public project repository is shown, 17 in all (2026-10-26) | Each page is pinned to the commit that was reviewed. The private NexusRAG-Recovery repository and the GitHub profile repository are not projects and are not shown. |
| NexusRAG link | Repository only | NexusRAG's own documentation does not confirm a live production address. |
| PlantPal link | Repository only | PlantPal calls Gemini from the browser with a key in the client bundle; the live app is linked once that is fixed and the key rotated. |
| Outcome figures | "~20%" and "~50%" shown with the qualifier "Approximate improvements reported by Anupam; not independently audited." | They are owner-reported, not measured by this site. |
| Employment detail | Client names, internal systems and vendor tool names are generalised | Confidentiality. |
| Portrait and résumé | Not published | Privacy; the contact form and email cover enquiries. |

## Features

| Decision | Choice | Why |
| --- | --- | --- |
| Ask the Atlas | Gemini answers limited to public ledger evidence, with server-validated citations; a deterministic evidence list when AI is off (2026-10-25) | An answer that cites anything not retrieved is rejected. `AI_ASSISTANT_ENABLED=false` switches AI off. The default model is `gemini-3.8-flash`; if `GEMINI_MODEL` names a retired model, the server switches to the default and reports it in `/api/status`. |
| Contact form | Server-side delivery through Resend | Visitors can write without opening a mail client; the server validates input, ignores bots that fill a hidden field and rate-limits senders. A sender on a domain verified in Resend lets messages reach any inbox; without one, Resend's test sender delivers only to the Resend account owner. |
| PlantPal signals | A synthetic explorer instead of live environmental data | Open-Meteo's free hosted tier is non-commercial, and synthetic sites show the uncertainty of each signal just as well. |
| Citation tools | Crossref and DataCite on; OpenAlex and ROR off | The two DOI registries cover the tool's purpose; the others add calls without a launch feature. |
| Document Workbench | Text files searched locally in a Web Worker; PDF and DOCX are not parsed | Nothing is uploaded. A PDF parser would add a large bundle and a parser attack surface. Switching search mode re-runs the search so results always match their label. |
| Package lookups | PyPI timeout 8 s; the dependency step returns partial results after 20 s | PyPI's JSON for large packages runs to several megabytes. |
| Command palette | Not built | The header navigation and per-page filters cover the same need. |

## Engineering

| Decision | Choice | Why |
| --- | --- | --- |
| Browsers tested | Chromium runs every end-to-end spec; WebKit runs the page-level specs in CI | Two engines catch most rendering differences; a third would add about 500 layout tests per run. |
| Linting | ESLint 10 with TypeScript, React hooks, Astro and the maintained `eslint-plugin-jsx-a11y-x` fork; no Prettier | ESLint gates correctness and accessibility; a formatter would rewrite every file in one unreviewable change. |
| Fonts | Self-hosted Manrope (variable) and Newsreader italic | The browser downloads only the subsets a page uses; the italic is preloaded only where it renders. |
| Production checks | A smoke check of every route, redirect and header, one live request to each API feature, then mobile Lighthouse, after each production deploy | Regressions in production surface within minutes; a provider outage is reported as a warning, not a failure. A manual run can also send one labelled message through the contact form. |
| Platform overrides | Kept in `pnpm-workspace.yaml` for Linux x64 and Windows x64 | Keeps installs reproducible on the supported platforms. |
