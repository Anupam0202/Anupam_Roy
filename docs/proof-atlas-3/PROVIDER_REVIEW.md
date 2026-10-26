# Provider review — API screening (105 services)

Reviewed 2026-10-25 against the owner-supplied *Always-Free API Atlas* (research edition, verified 2026-09-11) and its screening sheet [`API_SCREENING_105.csv`](API_SCREENING_105.csv). The site's rule is unchanged: **a provider runs only if it serves a launch feature, its terms allow this use, and its policy in `artifacts/proof-atlas-core/src/providers/policies.ts` passes the gate** (hosts, paths, methods, timeout ≤ 30 s, response cap ≤ 4 MiB, review ≤ 180 days old). A provider whose review expires switches itself off.

## Summary

| Outcome | Count |
| --- | --- |
| Enabled (runs in production when configured) | 6 |
| Registered but disabled | 3 |
| Strong candidate, deliberately not adopted | 9 |
| Not used (classified conditional, low relevance or restricted) | 87 |
| **Total** | **105** |

Gemini (Ask the Atlas) is not in the screening sheet; it remains enabled only when `GEMINI_API_KEY` is set (owner decision D6).

Every outbound call, including the contact form's call to Resend, goes through the provider client and `guardedFetch` (`artifacts/api-server/src/lib/providers.ts`, `proof-atlas-core/src/security/egress.ts`): the policy's hosts, paths, methods, timeout, response cap and redirect rules are enforced on each request.

## Evidence for newly enabled providers

| Provider | What was checked (2026-10-25) | Source |
| --- | --- | --- |
| npm Registry | Official npm Open-Source Terms: replicating Public Registry data through the public APIs is permitted; automated access to the *website* is not; the registry is not a general-purpose database. Live call to `registry.npmjs.org/<name>/latest` returned version, licence and deprecation (e.g. `request` → deprecated). | [npm Open-Source Terms](https://docs.npmjs.com/policies/open-source-terms/), [Crawler policy](https://docs.npmjs.com/policies/crawlers/) — excerpts via search; live API call |
| PyPI | Official docs: no edge rate limiting on the JSON API; send a unique User-Agent with contact details; avoid bursts; cache. Live calls to `pypi.org/pypi/<name>/json` succeeded, including numpy (≈3.7 MB) and boto3 (≈3.3 MB) under the 4 MiB cap. | [PyPI API introduction](https://docs.pypi.org/api/), [JSON API](https://docs.pypi.org/api/json/) — excerpts via search; live API call |
| Resend (contact form) | Official API reference: `POST https://api.resend.com/emails` with a Bearer key; fields `from`, `to[]`, `subject`, `text`, `reply_to`. Rate limit 10 requests per second per team, the same on every plan; the free plan sends 100 emails a day (a UTC day) and 3,000 a month; exceeding a limit returns 429. The policy budget is 100 a day, one call at a time. | [Usage limits](https://resend.com/docs/api-reference/rate-limit), [Account quotas](https://resend.com/docs/knowledge-base/account-quotas-and-limits), [Send email](https://resend.com/docs/api-reference/emails/send-email) — excerpts via search, re-checked 2026-10-26 |
| Gemini model (Ask the Atlas) | Default model `gemini-3.8-flash`, called with `thinkingConfig.thinkingLevel: "low"` and no `temperature` (Gemini 3 models take a thinking level; 2.5 Flash models instead take `thinkingBudget: 0`). `GEMINI_MODEL` overrides the default; a model Google reports as not found is replaced by the default after one retry. | [What's new in Gemini 3.8](https://ai.google.dev/gemini-api/docs/whats-new-gemini-3.8), [Gemini thinking](https://ai.google.dev/gemini-api/docs/thinking) — excerpts via search, 2026-10-25 |

Verification is recorded as `official-docs-excerpt`: the documentation hosts are not reachable from the build sandbox, so the terms were read through search excerpts of the official pages, and the API behaviour was confirmed by calling it.

## Runtime policy as coded (2026-10-26)

Values from `artifacts/proof-atlas-core/src/providers/policies.ts`. No policy retries automatically: a failed call is not repeated, and `Retry-After` is obeyed. After three failures in a row a provider pauses for 30 seconds (a rate limit pauses it for the time the provider asks, or 60 seconds), then lets one probe through. Identical concurrent GET requests share one upstream call. Budgets log a warning at 50 %, pause enrichment calls (such as the DataCite comparison) at 80 % and every non-essential call at 95 %, and stop at 100 %; they reset at midnight UTC and are counted per server instance.

| Policy | Enabled | Verification | Timeout | Response cap | Daily budget | Concurrency | Cache |
| --- | --- | --- | --- | --- | --- | --- | --- |
| github | yes | owner-supplied-research | 5 s | 1 MiB | 2,000 | 2 | repository and contents 10 min, README and manifests 30 min, releases 15 min, languages 1 h (ETags revalidate) |
| crossref | yes | owner-supplied-research | 5 s | 1 MiB | 2,000 | 1 | DOI records 7 days, searches 1 h |
| datacite | yes | owner-supplied-research | 5 s | 1 MiB | 1,000 | — | 7 days |
| npm | yes | official-docs-excerpt | 5 s | 256 KiB | 2,000 | — | 6 h |
| pypi | yes | official-docs-excerpt | 8 s (DECISIONS D24) | 4 MiB | 2,000 | — | 6 h |
| gemini | yes, with a key | owner-supplied-research | 20 s | 256 KiB | 500 | — | none |
| resend | yes, with a key and recipient | official-docs-excerpt | 8 s | 16 KiB | 100 | 1 | none |
| openalex | no | owner-supplied-research | 5 s | 1 MiB | — | — | 7 days |
| ror | no | owner-supplied-research | 5 s | 512 KiB | — | — | 30 days |
| open-meteo | no | owner-supplied-research | 5 s | 512 KiB | — | — | 15 min |

Seven of the ten policies rest on the owner-supplied research; three were checked against official documentation excerpts. `PROVIDERS_DISABLED` switches any of them off at runtime (redeploy on Vercel after changing it).

## Considered and rejected in this round

- **GitHub dependency-graph SBOM export.** GitHub's documentation marks the synchronous export endpoint as closing on 2026-11-13; the asynchronous replacement could not be verified from here. Declared dependencies are read from root manifests instead.
- **CISA KEV and NVD.** Both work on CVE identifiers. Declared version ranges are not installed versions, so any match would be guesswork; the repository tool therefore keeps vulnerability analysis as "not inspected".

## Decision for every screened service

| # | Service | Domain | Atlas classification | Decision for Proof Atlas |
| --- | --- | --- | --- | --- |
| 1 | Cloudflare Workers | Infra/compute/databases | Strong candidate | Not adopted — hosting stays on Vercel (D2). |
| 2 | AWS Lambda | Infra/compute/databases | Conditional candidate | Not used — Avoid persistent services without demonstrated state or cache need; zero DB by default. |
| 3 | Supabase | Infra/compute/databases | Conditional candidate | Not used — Avoid persistent services without demonstrated state or cache need; zero DB by default. |
| 4 | Firebase Spark | Infra/compute/databases | Conditional candidate | Not used — Avoid persistent services without demonstrated state or cache need; zero DB by default. |
| 5 | Neon | Infra/compute/databases | Conditional candidate | Not used — Avoid persistent services without demonstrated state or cache need; zero DB by default. |
| 6 | Turso | Infra/compute/databases | Conditional candidate | Not used — Avoid persistent services without demonstrated state or cache need; zero DB by default. |
| 7 | Upstash | Infra/compute/databases | Conditional candidate | Not used — Avoid persistent services without demonstrated state or cache need; zero DB by default. |
| 8 | WorkOS AuthKit | Identity/observability | Low portfolio relevance | Not used — Avoid identity collection; opt-in error observability only if justified. |
| 9 | Clerk | Identity/observability | Low portfolio relevance | Not used — Avoid identity collection; opt-in error observability only if justified. |
| 10 | Auth0 | Identity/observability | Low portfolio relevance | Not used — Avoid identity collection; opt-in error observability only if justified. |
| 11 | PostHog | Identity/observability | Conditional candidate | Not used — Avoid identity collection; opt-in error observability only if justified. |
| 12 | Sentry | Identity/observability | Strong candidate | Not adopted — would add a third-party script and data flow to a site that promises none; server errors already reach Vercel logs. Revisit only with the owner's consent and a privacy note. |
| 13 | Grafana Cloud | Identity/observability | Low portfolio relevance | Not used — Avoid identity collection; opt-in error observability only if justified. |
| 14 | Better Stack | Identity/observability | Low portfolio relevance | Not used — Avoid identity collection; opt-in error observability only if justified. |
| 15 | Brave Search API | Search/crawling/docs | Conditional candidate | Not used — Be cautious with crawling/web rights, user-supplied URLs and compute costs. |
| 16 | Tavily | Search/crawling/docs | Conditional candidate | Not used — Be cautious with crawling/web rights, user-supplied URLs and compute costs. |
| 17 | SerpApi | Search/crawling/docs | Conditional candidate | Not used — Be cautious with crawling/web rights, user-supplied URLs and compute costs. |
| 18 | Firecrawl | Search/crawling/docs | Conditional candidate | Not used — Be cautious with crawling/web rights, user-supplied URLs and compute costs. |
| 19 | Browserless | Search/crawling/docs | Conditional candidate | Not used — Be cautious with crawling/web rights, user-supplied URLs and compute costs. |
| 20 | OCR.space | Search/crawling/docs | Conditional candidate | Not used — Be cautious with crawling/web rights, user-supplied URLs and compute costs. |
| 21 | ScreenshotOne | Search/crawling/docs | Conditional candidate | Not used — Be cautious with crawling/web rights, user-supplied URLs and compute costs. |
| 22 | Screenshot API | Search/crawling/docs | Conditional candidate | Not used — Be cautious with crawling/web rights, user-supplied URLs and compute costs. |
| 23 | DiceBear HTTP API | Search/crawling/docs | Restricted / reject default | Not used — Hosted usage and avatar-style rights are restricted. |
| 24 | OpenWeather | Environment | Conditional candidate | Not used — Public scientific records only; context and uncertainty required. |
| 25 | Open-Meteo | Environment | Restricted / reject default | Registered, disabled — hosted tier is non-commercial (D9); PlantPal uses labelled synthetic data. |
| 26 | NASA Open APIs | Environment | Conditional candidate | Not used — Public scientific records only; context and uncertainty required. |
| 27 | NOAA Climate Data Online | Environment | Conditional candidate | Not used — Public scientific records only; context and uncertainty required. |
| 28 | USGS Earthquake Catalog | Environment | Strong candidate | Not adopted — evaluated for PlantPal's optional Earth Signals exhibit; seismic events do not inform garden planning, so it would add an API without adding understanding. |
| 29 | OpenAQ | Environment | Conditional candidate | Not used — Public scientific records only; context and uncertainty required. |
| 30 | WAQI/AQICN | Environment | Restricted / reject default | Not used — WAQI/AQICN terms limit commercial use. |
| 31 | EPA AirNow/AQS | Environment | Conditional candidate | Not used — Public scientific records only; context and uncertainty required. |
| 32 | NASA Earthdata | Environment | Conditional candidate | Not used — Public scientific records only; context and uncertainty required. |
| 33 | IPinfo Lite | Maps/geo | Conditional candidate | Not used — Geocoding/tile fair use and privacy; no default visitor location. |
| 34 | IPWHOIS.io | Maps/geo | Low portfolio relevance | Not used — Geocoding/tile fair use and privacy; no default visitor location. |
| 35 | GeoNames | Maps/geo | Conditional candidate | Not used — Geocoding/tile fair use and privacy; no default visitor location. |
| 36 | Nominatim public service | Maps/geo | Conditional candidate | Not used — Geocoding/tile fair use and privacy; no default visitor location. |
| 37 | Overpass API | Maps/geo | Conditional candidate | Not used — Geocoding/tile fair use and privacy; no default visitor location. |
| 38 | OSRM demo | Maps/geo | Restricted / reject default | Not used — OSRM demo capacity/fair-use: not a public production backend. |
| 39 | TimeZoneDB | Maps/geo | Restricted / reject default | Not used — TimeZoneDB free use class is personal/noncommercial. |
| 40 | FRED API v1 | Economics/finance | Conditional candidate | Not used — Possible public-data demos, but not strongly tied to portfolio thesis. |
| 41 | SEC EDGAR | Economics/finance | Conditional candidate | Not used — Possible public-data demos, but not strongly tied to portfolio thesis. |
| 42 | World Bank APIs | Economics/finance | Conditional candidate | Not used — Possible public-data demos, but not strongly tied to portfolio thesis. |
| 43 | EIA Open Data | Economics/finance | Conditional candidate | Not used — Possible public-data demos, but not strongly tied to portfolio thesis. |
| 44 | Alpha Vantage | Economics/finance | Low portfolio relevance | Not used — Possible public-data demos, but not strongly tied to portfolio thesis. |
| 45 | Frankfurter | Economics/finance | Conditional candidate | Not used — Possible public-data demos, but not strongly tied to portfolio thesis. |
| 46 | CoinGecko Demo | Economics/finance | Restricted / reject default | Not used — CoinGecko plan tiers and credits require verification. |
| 47 | Etherscan | Economics/finance | Restricted / reject default | Not used — Blockchain tool is unrelated to owner story. |
| 48 | GLEIF LEI API | Economics/finance | Conditional candidate | Not used — Possible public-data demos, but not strongly tied to portfolio thesis. |
| 49 | Blockchain.com Explorer | Economics/finance | Low portfolio relevance | Not used — Possible public-data demos, but not strongly tied to portfolio thesis. |
| 50 | openFDA | Life sciences | Conditional candidate | Not used — High care burden for health interpretation; avoid clinical output. |
| 51 | NCBI E-utilities | Life sciences | Conditional candidate | Not used — High care burden for health interpretation; avoid clinical output. |
| 52 | NCBI Datasets | Life sciences | Conditional candidate | Not used — High care burden for health interpretation; avoid clinical output. |
| 53 | ClinicalTrials.gov API v2 | Life sciences | Conditional candidate | Not used — High care burden for health interpretation; avoid clinical output. |
| 54 | RxNav/RxNorm | Life sciences | Restricted / reject default | Not used — Medical reference tool requires clinical safeguards. |
| 55 | Europe PMC | Life sciences | Conditional candidate | Not used — High care burden for health interpretation; avoid clinical output. |
| 56 | UniProt | Life sciences | Restricted / reject default | Not used — Protein reference not aligned with portfolio. |
| 57 | Crossref | Research/knowledge | Strong candidate | Enabled — Citation Integrity baseline (DOI lookup and search; abstracts never requested). |
| 58 | OpenAlex | Research/knowledge | Strong candidate | Registered, disabled — needs an API key and a daily credit budget (D10); no key configured. |
| 59 | ROR | Research/knowledge | Strong candidate | Registered, disabled — affiliation normalization adds little to DOI checks today (D10). |
| 60 | ORCID Public API | Research/knowledge | Conditional candidate | Not used — Good research provenance, DOI normalization, institution linking. |
| 61 | Wikidata | Research/knowledge | Strong candidate | Not adopted — entity enrichment is not needed for DOI integrity; ambiguous matches would add risk. |
| 62 | Open Library | Research/knowledge | Conditional candidate | Not used — Good research provenance, DOI normalization, institution linking. |
| 63 | Semantic Scholar | Research/knowledge | Strong candidate | Not adopted — Crossref and DataCite already cover the tool; research-only terms. |
| 64 | DataCite | Research/knowledge | Strong candidate | Enabled — DOI fallback and optional comparison. |
| 65 | USDA FoodData Central | Society/jobs | Restricted / reject default | Not used — Nutrition data not strongly aligned. |
| 66 | Open Food Facts | Society/jobs | Restricted / reject default | Not used — Food database licensing/attribution and low search budget. |
| 67 | BLS Public Data API v2 | Society/jobs | Conditional candidate | Not used — Skills evidence possible, but prevent unsupported employment inference. |
| 68 | US Census API | Society/jobs | Conditional candidate | Not used — Skills evidence possible, but prevent unsupported employment inference. |
| 69 | O*NET Web Services | Society/jobs | Strong candidate | Not adopted — a skills explorer is outside the launch scope ("do not add more tools merely because APIs exist"); needs a registered account and licence attribution. |
| 70 | USAJOBS API | Society/jobs | Conditional candidate | Not used — Skills evidence possible, but prevent unsupported employment inference. |
| 71 | Transitland | Mobility | Restricted / reject default | Not used — Transit feed licensing region-dependent. |
| 72 | Swiss Open Transport | Mobility | Restricted / reject default | Not used — Swiss transit geography and SLAs less relevant. |
| 73 | TransportAPI UK | Mobility | Restricted / reject default | Not used — UK limited coverage. |
| 74 | OpenSky Network | Mobility | Restricted / reject default | Not used — OpenSky nonprofit/research terms. |
| 75 | 511 SF Bay | Mobility | Restricted / reject default | Not used — San Francisco local-only feed. |
| 76 | GTFS agency feeds | Mobility | Restricted / reject default | Not used — Per-feed licensing and geography constraints. |
| 77 | Brevo | Comms/media | Conditional candidate | Not used — Adds signup/consent, spam or licensing overhead; no contact backend by default. |
| 78 | Resend | Comms/media | Conditional candidate | Kept for the contact form only (owner decision D7); active only when `RESEND_API_KEY` and `CONTACT_TO_EMAIL` are set. Calls go through the guarded provider client (policy `resend`, 100 a day). |
| 79 | SendGrid | Comms/media | Conditional candidate | Not used — Adds signup/consent, spam or licensing overhead; no contact backend by default. |
| 80 | Pushover | Comms/media | Conditional candidate | Not used — Adds signup/consent, spam or licensing overhead; no contact backend by default. |
| 81 | ntfy.sh | Comms/media | Conditional candidate | Not used — Adds signup/consent, spam or licensing overhead; no contact backend by default. |
| 82 | Hookdeck | Comms/media | Conditional candidate | Not used — Adds signup/consent, spam or licensing overhead; no contact backend by default. |
| 83 | Pexels | Comms/media | Conditional candidate | Not used — Adds signup/consent, spam or licensing overhead; no contact backend by default. |
| 84 | Cloudinary | Comms/media | Conditional candidate | Not used — Adds signup/consent, spam or licensing overhead; no contact backend by default. |
| 85 | ImageKit | Comms/media | Conditional candidate | Not used — Adds signup/consent, spam or licensing overhead; no contact backend by default. |
| 86 | Federal Register | Culture/government | Conditional candidate | Not used — Interesting open data but weaker demonstrated fit; rights vary by item. |
| 87 | CourtListener | Culture/government | Conditional candidate | Not used — Interesting open data but weaker demonstrated fit; rights vary by item. |
| 88 | GDELT Project | Culture/government | Conditional candidate | Not used — Interesting open data but weaker demonstrated fit; rights vary by item. |
| 89 | Library of Congress | Culture/government | Conditional candidate | Not used — Interesting open data but weaker demonstrated fit; rights vary by item. |
| 90 | Smithsonian Open Access | Culture/government | Conditional candidate | Not used — Interesting open data but weaker demonstrated fit; rights vary by item. |
| 91 | Europeana | Culture/government | Conditional candidate | Not used — Interesting open data but weaker demonstrated fit; rights vary by item. |
| 92 | TMDB | Culture/government | Restricted / reject default | Not used — TMDB noncommercial licensing. |
| 93 | Calendarific | Culture/government | Conditional candidate | Not used — Interesting open data but weaker demonstrated fit; rights vary by item. |
| 94 | urlscan.io | Security | Conditional candidate | Not used — Advisory metadata adds value only after confirmed dependency/version mapping. |
| 95 | VirusTotal Public API | Security | Restricted / reject default | Not used — VirusTotal Public API noncommercial restrictions; no arbitrary security scans. |
| 96 | VulnCheck Community | Security | Conditional candidate | Not used — Advisory metadata adds value only after confirmed dependency/version mapping. |
| 97 | CISA KEV | Security | Strong candidate | Not adopted — KEV lists CVEs, and declared version ranges cannot be mapped to CVEs exactly; matching by package name would break the spec's no-name-only-inference rule. |
| 98 | NVD | Security | Strong candidate | Not adopted — needs CPE/version identity that declared ranges do not provide (same reason as CISA KEV). |
| 99 | Certificate Transparency | Security | Conditional candidate | Not used — Advisory metadata adds value only after confirmed dependency/version mapping. |
| 100 | GitHub REST API | Developer ecosystem | Strong candidate | Enabled — Repository Evidence Graph (≤5 calls per analysis, two at a time, cached 10 min to 1 h by resource, ETags) and the optional declared-dependencies step (one call per root manifest, within a 20 s overall deadline). |
| 101 | PyPI APIs | Developer ecosystem | Strong candidate | Enabled — project JSON for one package a visitor selects (version, licence, yanked state). Verified live on 2026-10-25, including numpy and boto3 (≈3.3–3.7 MB). |
| 102 | npm Registry | Developer ecosystem | Strong candidate | Enabled — the /latest document for one package a visitor selects (version, licence, deprecation). Verified live on 2026-10-25. |
| 103 | Maven Central | Developer ecosystem | Strong candidate | Not adopted — Java manifests (pom.xml, Gradle) are not parsed; npm and PyPI are the spec's selected ecosystems. |
| 104 | Docker Hub | Developer ecosystem | Conditional candidate | Not used — Exact package ecosystem lookups can enrich public repository evidence. |
| 105 | GitLab REST | Developer ecosystem | Conditional candidate | Not used — Exact package ecosystem lookups can enrich public repository evidence. |
