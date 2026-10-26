# Proof Atlas 3.0 — Master build prompt (verbatim copy)

Supplied by the owner on 2026-10-25 as the authoritative implementation contract.
The downloadable bundle it originally shipped with (checklist, test plan, CSVs,
deployment outline, quota model) was not available in the implementation
environment; see `SOURCE_AUDIT.md` §1 and `DECISIONS.md` D5.

Do not edit the contract text below. Record changes and conflicts in
`DECISIONS.md` instead.

---

```text
PROOF ATLAS 3.0 — FINAL IMPLEMENTATION MASTER PROMPT
ANUPAM ROY — LIVING ENGINEERING PORTFOLIO + PROOF WORKBENCH

MISSION

Act as an autonomous senior product strategy, creative design, frontend,
backend, AI/ML, accessibility, security, QA and deployment team.

Your task is to inspect the supplied source material, then DESIGN, IMPLEMENT,
TEST, REFINE and DEPLOY a complete production portfolio for Anupam Roy.

Do not stop at:
- a plan,
- mockups,
- screenshots,
- a component gallery,
- scaffolding,
- a partial prototype,
- or a written architecture.

The final product must be a functioning website.

Never invent personal facts, metrics, certifications, project capabilities,
awards, deployment results, performance scores, test results or provider terms.

When this specification conflicts with a newer authoritative factual source,
preserve the truth and record the conflict rather than silently following stale
copy.

CORE PRODUCT DECISION

Build:

PROOF ATLAS 3.0 — THE LIVING ENGINEERING PORTFOLIO + PROOF WORKBENCH

Central thesis:

“Difficult problems become understandable systems.”

The product's signature relationship is:

CLAIM
→ PROBLEM / CONSTRAINT
→ ARCHITECTURE
→ EXECUTABLE DEMONSTRATION
→ SOURCE EVIDENCE
→ LIMITATION / CONFIDENCE

The website must make evidence inspectable without making ordinary reading
cumbersome.

PRODUCT PRIORITY

1. Portfolio and flagship project proof trails
2. Proof Workbench
3. Executable evidence inside case studies
4. Engineering Lab
5. Professional Experience
6. Credentials and recognition
7. About and Contact
8. Optional Ask the Atlas AI

Do not turn the website into:
- a generic developer tools site,
- SaaS dashboard,
- agency template,
- AI-chat wrapper,
- 3D game,
- operating-system simulation,
- free-API directory,
- or animation collage.

SOURCE-OF-TRUTH POLICY

Use these provenance states:

type ProvenanceStatus =
  | "verified_public_source"
  | "repository_documented"
  | "owner_reported"
  | "illustrative"
  | "proposed"
  | "unverified"
  | "unavailable";

Every important project, experience, achievement and credential claim must map
to a structured evidence record:

interface ClaimEvidence {
  id: string;
  claim: string;
  status: ProvenanceStatus;

  sourceTitle?: string;
  sourceUrl?: string;

  repository?: string;
  path?: string;
  commitSha?: string;

  sourceExcerpt?: string;
  verifiedAt?: string;

  limitations?: string[];
  public: boolean;
}

Never use a green verified check merely because a README contains a claim.

Distinguish:
- owner statement,
- repository documentation,
- inspected source implementation,
- executed test,
- deployed behavior,
- independent public evidence.

OWNER PROFILE

Name:
Anupam Roy

Positioning:
AI/ML Engineer · Systems Architect · Software Engineer · Competitive Programmer

Email:
anupam020202@gmail.com

GitHub:
https://github.com/Anupam0202/

LinkedIn:
https://www.linkedin.com/in/anupam--roy/

Current public site supplied in prior material:
https://anupam-roy.vercel.app/

CodeChef:
https://www.codechef.com/users/anupam_roy

Credly:
https://www.credly.com/users/anupam_roy/

Education supplied by owner:
B.Tech in Computer Science and Engineering
Maulana Abul Kalam Azad University of Technology, West Bengal
2018–2022
GPA 9.14/10

Professional experience supplied by owner:

Accenture
Associate Software Engineer
Aug 2022 – Nov 2023

Accenture
AI/ML Analyst
Dec 2023 – present

Approximate outcomes previously supplied by owner:
~20% turnaround reduction
~50% lower SME dependency

If used, label them:

“Approximate improvements reported by Anupam; not independently audited.”

Never expose:
- confidential client names,
- incidents,
- tickets,
- private logs,
- secured endpoints,
- proprietary architecture,
- internal source code,
- credentials,
- employer secrets.

CREDENTIAL INTEGRITY

The supplied source dataset currently contains 73 certification records.

The owner previously reported 74.

The 74th source record is unresolved.

Until explicitly reconciled:

- import all 73 supplied records;
- preserve original source title and URL;
- do not fabricate the missing record;
- do not invent issue dates;
- do not invent expiry dates;
- do not invent credential IDs;
- do not invent categories;
- do not invent skill tags;
- do not mark links verified until checked.

Public disclosure:

“73 credential records are present in the supplied source; Anupam reports
74 total. One source record is pending confirmation.”

The current portfolio repository may contain a newer 74-record/PDF set.
Do not automatically treat that as reconciliation.

Generate a diff and require owner approval.

Use deterministic credential IDs based on canonical issuer + exact title +
verification URL, rather than array position.

CURRENT PROJECT SET

The historically owner-curated portfolio contains:

1. NexusRAG
2. PlantPal
3. RAG
4. Contextual-RAG-Chatbot
5. Handwritten-Chemical_Compound-Detection
6. My-Portfolio
7. Anupam-Portfolio
8. Real-Estate
9. Modern_UI-UX_GPT3

The GitHub account may contain newer repositories.

Do not silently replace the curated nine.

Produce an owner-review list of new candidates and let the owner decide whether
they become public Portfolio projects.

NEXUSRAG TRUTH CONTRACT

Inspect current main-branch documentation and relevant source before publishing.

NexusRAG currently distinguishes:

A. bounded runtime:
- Cloudflare
- Supabase
- Qdrant
- Gemini
- Next.js 16

B. richer FastAPI/Python local and research implementations.

These MUST NOT be represented as one single deployed production system.

Build two separate architectural views:

nexusrag-runtime.svg
nexusrag-research.svg

Required case-study structure:

1. Problem
2. Constraints
3. Bounded runtime
4. Research/local pipeline
5. Feature-status matrix
6. Retrieval architecture
7. Data/evidence lifecycle
8. Failure semantics
9. Security/privacy boundaries
10. What is not established
11. Source evidence
12. Repository/live actions

Every significant feature has a provenance status.

Never imply:
- production readiness without evidence,
- every local feature runs in the gateway,
- every file format is live,
- synthetic tests prove retrieval quality,
- implementation proves business outcome.

PLANTPAL TRUTH CONTRACT

Treat PlantPal's README as project documentation, not independent scientific
validation.

Its case study may explain documented integrations involving weather, soil,
elevation, biodiversity, climate and AI interpretation.

Do not state as scientifically established:
- exact carbon sequestration,
- guaranteed plant suitability,
- exact disease diagnosis,
- exact future climate outcome,
- guaranteed native recommendations.

Required case-study structure:

1. Problem
2. Environmental signal sources
3. Provider/freshness/resolution table
4. Data normalization
5. Application architecture
6. AI interpretation boundary
7. Uncertainty
8. Feature-status matrix
9. Synthetic or dated example
10. Repository/live evidence
11. Limitations

Open-Meteo's free hosted tier is NOT approved for general promotional/
commercial Proof Atlas runtime by default.

Use:
- a rights-approved configuration,
- owner-captured dated data,
- or clearly synthetic data.

Earth Signals, if implemented, belongs inside PlantPal as a small data-
engineering exhibit.

ROUTE MAP

Implement:

/
├── portfolio/
│   ├── nexusrag/
│   ├── plantpal/
│   ├── rag/
│   ├── contextual-rag-chatbot/
│   ├── handwritten-chemical-compound-detection/
│   ├── my-portfolio/
│   ├── anupam-portfolio/
│   ├── real-estate/
│   └── modern-ui-ux-gpt3/
│
├── workbench/
│   ├── repository/
│   ├── documents/
│   └── citations/
│
├── lab/
│   ├── retrieval-fusion/
│   ├── binary-search/
│   ├── architecture-xray/
│   └── dijkstra/        # only if release gate passes
│
├── experience/
├── credentials/
├── about/
├── contact/
├── sources/
├── privacy/
└── 404

System:

/robots.txt
/sitemap.xml
/api/status
/api/repository/analyze
/api/repository/sbom/request        # optional
/api/repository/sbom/status         # optional
/api/citations/resolve
/api/citations/search
/api/ai/ask                         # optional

Redirects:

/work/ → /portfolio/
/work/:slug → /portfolio/:slug

/studio/ → /workbench/
/studio/repository-lens/ → /workbench/repository/
/studio/evidence-workbench/ → /workbench/documents/
/studio/research-trail/ → /workbench/citations/
/studio/earth-signals/ → /portfolio/plantpal/#earth-signals

Unknown routes return true HTTP 404.

PRIMARY NAVIGATION

Desktop:

Anupam Roy
Portfolio
Workbench
Lab
Experience
Credentials
About
Contact

The wordmark returns home.

Contact may receive stronger visual treatment.

Optional command palette:
- "/" opens when not typing;
- Escape closes;
- supports navigation/project/source search;
- never replaces conventional navigation.

DESIGN SYSTEM

Identity:
MINERAL INK, evolved.

Light:

--paper: #F2F0E8;
--surface: #FAF9F5;
--ink: #182321;
--ink-muted: #53605A;
--line: #CBD0C6;
--line-soft: #DEE1D8;
--signal: #D9F28B;
--signal-ink: #26340F;
--tech: #4765DB;
--tech-soft: #E4E8F2;
--copper: #BB7454;
--danger: #A73434;

Dark:

--paper: #111A18;
--surface: #1A2521;
--ink: #F2F0E8;
--ink-muted: #B0BBB3;
--line: #46554C;
--line-soft: #2D3B33;
--signal: #D9F28B;
--signal-ink: #182321;
--tech: #94A8FF;
--tech-soft: #263450;
--copper: #E4A184;
--danger: #FF9B9B;

Create semantic tokens:

--status-verified
--status-documented
--status-owner
--status-illustrative
--status-warning
--focus-ring
--selection-bg

Do not assume contrast passes.
Test rendered combinations.

TYPOGRAPHY

Use locally hosted open-license fonts or verified equivalents:

Manrope Variable:
display/interface

Newsreader Variable:
editorial accent

IBM Plex Mono:
technical labels/code/data

Use no more than these three families.

Fluid scale:

--text-xs:
clamp(.72rem, .70rem + .08vw, .82rem);

--text-sm:
clamp(.84rem, .81rem + .12vw, .96rem);

--text-body:
clamp(1rem, .96rem + .18vw, 1.125rem);

--text-lead:
clamp(1.18rem, 1.03rem + .55vw, 1.65rem);

--text-h3:
clamp(1.55rem, 1.20rem + 1.25vw, 2.45rem);

--text-h2:
clamp(2.35rem, 1.45rem + 3.4vw, 5.4rem);

--text-hero:
clamp(3.15rem, 1.45rem + 7.3vw, 8.75rem);

Hero line-height:
approximately 0.92–0.98 where legible.

Body:
1.55–1.7.

Reading width:
68–78 characters.

GRID

Maximum content:
1440 px

Reading column:
760–820 px

Desktop:
12 columns

Tablet:
8 columns

Mobile:
4 columns

Responsive gutters:
20 / 24 / 36 / 56 / 72 px

Spacing:
4 / 8 / 12 / 16 / 24 / 32 / 48 / 64 / 96 / 128 / 160

Corners:
10 / 14 / 20 / full

VISUAL GRAMMAR

Home:
system becoming clear

NexusRAG:
document geometry, retrieval paths, runtime/research lanes

PlantPal:
environmental source layers, contour/resolution bands

Workbench:
clean product controls and source graphs

Lab:
formal algorithm/state visualizations

Experience:
event/workflow geometry

Credentials:
typographic index and verification states

Sources:
claim/provenance graph

Stop using terrain/mountains as generic wallpaper.

MOTION

micro:
120–170 ms

control:
170–230 ms

panel:
240–360 ms

diagram:
320–520 ms

narrative:
450–700 ms

hard maximum:
900 ms

Primary easing:

cubic-bezier(0.2, 0.8, 0.2, 1)

Rules:
- no preloader;
- no scroll hijacking;
- no mandatory audio;
- no custom-cursor dependency;
- no continuous large-blur animation;
- no essential hover-only information;
- stop offscreen ambient animations;
- reduced-motion reveals final states immediately;
- page transitions never delay navigation.

COMPONENT CONTRACTS

AtlasHeader
props:
currentPath
items
theme
onThemeChange

accessibility:
semantic header/nav
aria-current
keyboard order matches DOM

MobileNavDialog
props:
open
onOpenChange
items

accessibility:
proper dialog
focus trap
Escape
focus restoration
background inert

HeroThesis
props:
headline
lede
primaryCta
secondaryCta
illustration

accessibility:
single page H1
descriptive CTA names
text equivalent for illustration

SystemBecomingClear
props:
nodes
activeId?
onSelect?
reducedMotion

accessibility:
keyboard/touch parity
long description
static list fallback

ProjectPlate
props:
project
status
evidenceCount
variant

accessibility:
article semantics
heading structure
no hover-only content

EvidenceBadge
props:
status
label
sourceId?

accessibility:
status always written in text

EvidenceDrawer
props:
claimId
open
onOpenChange

accessibility:
correct modal/nonmodal semantics
focus management
descriptive source links

ArchitectureCanvas
props:
nodes
edges
layers
activeLayer

accessibility:
equivalent table/list
interactive SVG nodes must use semantic controls

FeatureStatusMatrix
props:
rows

accessibility:
native table desktop
definition-list alternative narrow mobile

ConstraintRail
props:
items

accessibility:
list semantics

RepositoryAnalyzer
props:
initialRepo?
providerStatus

accessibility:
explicit labels
help/errors associated
live result region

EvidenceGraph
props:
nodes
edges
selectedId

accessibility:
nested-list alternative
search
graph never sole navigation

DocumentWorkbench
props:
maxBytes
acceptedTypes
privacyMode

accessibility:
labelled file controls
local-processing disclosure
keyboard result navigation

EvidenceResultList
props:
results
query

accessibility:
ordered results
exact source locations

CitationResolver
props:
defaultDoi?
providers

accessibility:
instructions
provider timestamp
mismatch communicated by text

AlgorithmStepper
props:
state
step
onNext
onPrev
onReset

accessibility:
buttons
live state summary
table alternative

RrfExplorer
props:
rankings
k

accessibility:
formula as text
native contribution table

BinarySearchExplorer
props:
array
target

accessibility:
active range in text

DijkstraExplorer
props:
graph
source
target?

accessibility:
adjacency and distance tables

CredentialIndex
props:
items
filters
query
sort

accessibility:
labels
result-count announcement
reset

CareerAtlas
props:
roles
activeView

accessibility:
chronological DOM order

SourceNavigator
props:
claims
filters

accessibility:
search/filter keyboard usable
source-state explanation

AskAtlas
props:
enabled
providerStatus
corpusVersion

accessibility:
AI clearly identified
loading/abstention/errors announced
validated citation links

AtlasFooter
props:
links
buildMeta

accessibility:
semantic footer
descriptive links

STATE MACHINES

Modal:

closed
→ opening
→ open
→ closing
→ closed

Repository Workbench:

idle
→ validating
→ loading-cache

fresh:
loading-cache → success

miss:
loading-cache
→ fetching
→ normalizing
→ success

error branches:
invalid-repository
rate-limited
unavailable
error

Never infer security from absent evidence.

Local Document Workbench:

empty
→ loading-file
→ parsing
→ ready
→ indexing
→ searchable
→ searching
→ results
→ exporting
→ searchable

Errors:

unsupported-type
oversized
scanned-pdf-no-text
parser-failed
worker-failed

Citation Integrity:

idle
→ normalizing-doi
→ cache-check
→ resolve-crossref
→ success

fallback:
resolve-crossref
→ datacite-fallback
→ success-partial

also:
not-found
rate-limited
error

AI:

disabled

or:

idle
→ validating
→ retrieving-public-evidence
→ model-request
→ answered

branches:
abstained
rate-limited
provider-error
→ deterministic-fallback

HOMEPAGE

Above fold:

ANUPAM ROY / AI + SOFTWARE ENGINEERING

Headline:

I turn difficult problems into understandable systems.

Proposed lede:

I'm Anupam Roy, an AI/ML engineer building retrieval systems, intelligent
applications and dependable software. I work from a problem's constraints
toward a system people can understand, inspect and trust.

Primary CTA:
Explore Portfolio

Secondary CTA:
Open Proof Workbench

GitHub and LinkedIn are secondary.

Hero:
System Becoming Clear original SVG.

States:

ambiguous inputs
→ constraints
→ decisions
→ architecture
→ evidence

Headline remains immediately visible.

Homepage sequence:

1. Selected Proof
   NexusRAG
   PlantPal

2. How I Think
   Problem
   Constraints
   System
   Evidence

3. Proof Workbench
   Repository Evidence Graph
   Local Document Evidence

4. Experience
   accurate role progression

5. Engineering Lab
   RRF
   Binary Search

6. Evidence and Recognition
   concise, provenance labelled

7. About preview

8. Contact finale

Do not duplicate entire Experience or Credentials pages on Home.

PORTFOLIO

Portfolio is the central content destination.

Hero:

PORTFOLIO / SYSTEMS & EVIDENCE

Work worth inspecting.

Show:

- NexusRAG as flagship editorial cover
- PlantPal as flagship editorial cover
- owner-approved remaining projects
- search
- filter
- list/grid modes
- capability-to-evidence mapping
- source drawer
- project status
- last reviewed date

Filters may include:

All
AI / RAG
ML / Computer Vision
Web / Frontend
Systems / Cloud

Only apply a category when supported.

Persist filters in URL where practical.

No star count or live status unless dated/checked.

NEXUSRAG PAGE

Sequence:

1. thesis
2. problem
3. constraints
4. bounded runtime lane
5. local/research lane
6. feature-status matrix
7. retrieval architecture
8. RRF explanation
9. source/evidence lifecycle
10. security/failure semantics
11. known limitations
12. public source actions

Deep-link RRF to Lab.

Offer:
“Inspect the retrieval idea”

This opens the local Workbench with synthetic data.

Never transfer actual NexusRAG/private documents.

PLANTPAL PAGE

Sequence:

1. intended user problem
2. environmental signals
3. provider/freshness/resolution table
4. normalized source architecture
5. uncertainty
6. AI interpretation boundary
7. synthetic/dater environmental explorer
8. optional USGS Earth Signals exhibit
9. source status
10. repository/live action
11. limitations

Do not describe model inference as scientific measurement.

EXPERIENCE

Headline:

From software foundations to intelligent systems.

Roles:

Associate Software Engineer
Aug 2022–Nov 2023

AI/ML Analyst
Dec 2023–present

Views:

Overview
Systems
Technologies
Lessons

Illustrative architecture:

Operational sources
→ retrieval
→ agent orchestration
→ validation / human review
→ workflow action

Required visible qualification:

“Illustrative architecture based on publicly shareable owner descriptions;
not an employer/client production diagram.”

No confidential client representation.

CREDENTIALS

Use title:

Wall of Mastery

only if visual tone remains sophisticated.

Above fold:
search + source-count disclosure.

Features:
- title search
- issuer filter
- verification-state filter
- stable sorting
- grid/list
- URL-synced filters
- reset
- exact source/verification URL
- provenance status

Display:

“73 listed in the supplied source · owner reports 74 total.”

Never display:

“74 verified certifications”

until actually true.

WORKBENCH

Workbench is a small engineering product library.

Launch scope:

A. Repository Evidence Graph
B. Local Evidence & Citation Workbench
C. Citation Integrity

Do NOT add more tools merely because APIs exist.

REPOSITORY EVIDENCE GRAPH

User enters:

owner/repo

or a supported GitHub repository URL that is normalized into owner/repo
WITHOUT arbitrary server URL fetching.

Provide:

- repository identity
- description
- default branch
- current source timestamp
- releases
- language/license metadata when available
- README evidence
- selected manifest evidence
- dependency coverage status
- source links
- evidence graph
- downloadable normalized JSON/CSV

Optional:
- asynchronous GitHub SBOM
- selected direct npm/PyPI metadata
- exact-CVE CISA KEV indication

Do not perform:
- arbitrary recursive crawling
- private repo access
- arbitrary URL proxying
- automatic vulnerability certainty
- package-name-only CVE inference
- universal maintainability score

Request:

type RepoAnalyzeRequest = {
  owner: string;
  repo: string;
  include?: Array<
    "overview" |
    "readme" |
    "releases" |
    "manifests" |
    "languages" |
    "license"
  >;
};

Coverage:

type CoverageState =
  | "observed"
  | "not_found"
  | "unsupported"
  | "provider_blocked"
  | "not_requested";

Response:

type RepoAnalyzeResponse = {
  repository: {
    owner: string;
    name: string;
    defaultBranch?: string;
    description?: string;
    license?: {
      spdx?: string;
      name?: string;
    };
    pushedAt?: string;
  };

  evidence: Array<{
    id: string;
    kind: string;
    label: string;
    path?: string;
    url?: string;
    observedAt: string;
  }>;

  coverage: Record<string, CoverageState>;

  warnings: string[];

  source: {
    provider: "github";
    fetchedAt: string;
    cache: "hit" | "miss" | "stale";
  };
};

Operational constraints:

- ~512 KiB normalized response cap
- 5 s max per upstream request
- ordinary miss target: 3–5 GitHub calls
- ETag support
- request coalescing
- max 5 explicitly selected package enrichments/session

LOCAL EVIDENCE WORKBENCH

Default:
100% browser local.

Launch file types:

text paste
.txt
.md
.json
.csv

Optional after performance review:

PDF text extraction
DOCX text extraction

PDF:
no OCR in launch version.

Default limits:

15 MiB file
2,000,000 extracted text characters

Use Web Worker for parsing/indexing.

Core functions:

- segment into stable chunks
- BM25
- exact phrase search
- term coverage
- evidence selection
- document comparison
- optional RRF of deterministic channels
- exact quote/location
- Markdown export
- JSON Evidence Packet export

No silent network request.

No server document persistence.

No telemetry containing document content.

On reset:
remove local working state.

Evidence Packet:

interface EvidencePacket {
  version: 1;
  createdAt: string;

  document: {
    localId: string;
    fileName?: string;
    sha256?: string;
  };

  query: string;

  method: {
    tokenizerVersion: string;
    ranking: string;
    parameters: Record<string, number | string>;
  };

  selections: Array<{
    chunkId: string;
    location: string;
    quote: string;
    score?: number;
  }>;
}

CITATION INTEGRITY

Primary:
Crossref

Conditional:
DataCite

Optional enrichments:
OpenAlex
ROR

Features:

- DOI normalization
- DOI lookup
- title/topic search
- source timestamp
- missing-field indication
- provider comparison
- pasted DOI-list dedupe
- deterministic CSL-JSON
- deterministic BibTeX
- deterministic RIS
- source links

Do not persist abstracts by default.

Do not display unqualified citation counts or impact factors.

LAB

Lab demonstrates correctness.

Workbench reuses the same tested libraries.

RRF

Formula:

RRF(d) = Σ 1 / (k + rank_i(d))

Rules:
- one-based rank
- absent document contribution = zero
- default k = 60
- k finite and > 0
- duplicate IDs rejected or deterministically normalized with warning
- descending fused score
- deterministic tie policy

Fixture:

Query:
What handles a scanned PDF?

Lexical:
D2, D1, D3

Semantic:
D1, D3, D4

Required tests:

identical rankings
disjoint rankings
missing documents
empty rankings
single ranking
duplicate IDs
k=0
negative k
NaN
deterministic ties
exact numeric scores within tolerance

BINARY SEARCH

Iterative sorted numeric array.

Display:

low
high
mid
comparison
decision
remaining interval
result

Invariant:

“If the target exists in the original sorted array, it remains inside the
active search interval until it is found or the interval becomes empty.”

Complexity:

O(log n) worst-case time
O(1) iterative auxiliary space

Tests:

empty
single element
present
absent
duplicates
first
last
negative values
large sorted array
unsorted input handling

DIJKSTRA

Optional.

Only ship if:
- correctness suite passes,
- accessible text/table equivalent is excellent,
- page remains understandable on mobile.

Requirements:
- nonnegative weights
- priority queue
- relaxation snapshots
- predecessor map
- reconstructed path
- deterministic ties
- negative weight rejection

Tests:
simple
disconnected
source == target
zero-weight edges
equal shortest paths
negative edge
unreachable target

ARCHITECTURE X-RAY

Representative RAG layers:

user
→ ingestion
→ indexing
→ retrieval
→ ranking
→ generation
→ validation/citations
→ safeguards

Every layer exposes:

responsibility
input
output
failure modes
tradeoffs
NexusRAG evidence
status

API PROVIDER POLICY

Create:

interface ProviderPolicy {
  id: string;
  enabled: boolean;

  purpose: string;

  docsUrl: string;
  termsUrl?: string;

  verifiedAt: string;

  accessClass:
    | "public"
    | "server-key"
    | "user-key"
    | "local-only";

  commercialUse:
    | "allowed"
    | "restricted"
    | "unknown";

  attribution?: string;

  allowedHosts: string[];
  allowedPathPatterns: string[];

  methodAllowlist: Array<
    "GET" |
    "POST"
  >;

  timeoutMs: number;

  cacheTtlSeconds: number;
  staleIfErrorSeconds?: number;

  maxResponseBytes: number;

  retryPolicy: {
    maxRetries: number;
    retryStatuses: number[];
    obeyRetryAfter: true;
  };

  dailyBudget?: number;

  notes: string[];
}

Do not enable a provider when:
- commercial rights are unknown for relevant use;
- allowed hosts are absent;
- timeout is absent;
- response size cap is absent;
- verification is stale beyond policy.

Budget behavior:

50%:
record aggregate warning

80%:
disable nonessential enrichment

95%:
stop optional provider calls

Never circumvent provider quotas.

API DECISIONS

Cloudflare:
primary deployment candidate.

Static pages must be served as assets.

Worker invoked only for explicit API paths.

GitHub:
required for Repository Workbench.

Use:
- authenticated read-only server token if owner configures one,
- ETags,
- live rate-limit headers,
- bounded request count,
- no recursive crawling.

GitHub SBOM:
use asynchronous flow only if enabled.

Crossref:
Citation Integrity baseline.

Identify application politely.

DataCite:
conditional fallback/comparison.

OpenAlex:
optional enrichment, disabled by default.

ROR:
optional normalization.

CISA KEV:
periodic static exact-CVE evidence only.

npm/PyPI:
explicit selected package metadata only.

USGS:
optional PlantPal exhibit.

Open-Meteo:
disabled by default until rights approved.

Gemini:
optional, default OFF.

TRAFFIC PLANNING MODEL

Treat these as assumptions, not analytics:

Low:
100 visitors/day
~15 GitHub upstream
~4 Crossref
~1 OpenAlex
~23 dynamic Worker requests

Medium:
1,000 visitors/day
~92 GitHub
~32 Crossref
~10 OpenAlex
~244 Worker

High:
10,000 visitors/day
~367 GitHub
~245 Crossref
~74 OpenAlex
~2,740 Worker

Do not hardcode provider capacity from this model.

At runtime:
- honor provider headers;
- obey Retry-After;
- coalesce identical requests;
- use cache;
- circuit-break repeated failures;
- display stale timestamps.

CACHE GUIDANCE

GitHub repository:
10 min

README/manifests:
30 min + ETag

releases:
15 min

languages/license:
1 hour

Crossref DOI:
7 days

Crossref query:
1 hour

DataCite DOI:
7 days

OpenAlex work:
7 days

OpenAlex search:
6 hours

ROR:
30 days

CISA KEV:
4–24 hour snapshot

USGS recent:
5–15 min

SECURITY

NO ARBITRARY URL PROXY.

GitHub:
accept only owner/repo identity.

Citation:
accept DOI/query, construct provider URL internally.

For every upstream:

- hostname allowlist
- path allowlist
- method allowlist
- redirect cap
- reject redirects off allowlist
- timeout
- response byte limit
- schema validation
- normalization

Never fetch:
localhost
private IPs
link-local
metadata endpoints
visitor-specified arbitrary hosts

Inputs:
- normalize Unicode safely
- remove forbidden control characters
- clamp length
- schema validate
- bound files
- reject archive bombs
- no ZIP Workbench launch

Outputs:
- typed JSON
- no raw provider HTML
- sanitize Markdown
- validate outbound links

Secrets:
- server only
- no PUBLIC_*
- no VITE_* secret
- CI secret scan
- least privilege

Abuse:
- bounded IP/session rate controls
- explicit user actions
- provider budgets
- circuit breakers
- payload limits
- no claim edge-memory rate limiter is globally atomic

PRIVACY

Default:

no accounts
no fingerprinting
no advertising
no invasive analytics
no silent geolocation
no server document persistence
no AI for private document text
no unnecessary cookie

Privacy page explains:

- hosting
- external providers
- which inputs leave browser
- local-document behavior
- AI state
- retention
- external links
- contact behavior

OPTIONAL ASK THE ATLAS

Only public portfolio evidence.

Default:

AI_ASSISTANT_ENABLED=false

Corpus entry:

id
claimId
title
excerpt
sourceURL
provenance
verifiedAt
allowedClaims

Retrieval first.
Model second.

Output:

type AssistantResult = {
  answer: string;
  citationIds: string[];
  state: "answered" | "abstained";
};

Server validates citation IDs against evidence retrieved in THAT request.

Never trust model-created URLs.

No:
- arbitrary browsing
- arbitrary tools
- private files
- employer secrets
- code execution
- email sending
- private Workbench documents

Fallback:
deterministic Source Navigator.

TECHNICAL ARCHITECTURE

Preferred:

Astro static output
TypeScript strict
React islands only where useful
CSS variables
SVG diagrams
Web Workers for parsing/indexing
Cloudflare Workers Static Assets
narrow /api Worker
no database at launch
no authentication
no CMS
no server-side visitor file storage
no vector database

OWNER MUST CONFIRM TARGET REPOSITORY.

If Anupam0202/Anupam_Roy is target:

- create migration branch;
- preserve useful data/assets/tests;
- inventory its local credential PDFs;
- inventory production behavior;
- do not destroy working code prematurely.

Create ADR:

Option A:
Astro migration

Option B:
retain existing Vite React architecture with real prerendered/static routes

Prefer Astro only if its static architecture benefit outweighs migration cost.

Regardless of framework, final release requires:
- semantic static content;
- genuine route responses;
- SEO;
- no-JS core readability;
- lazy heavy tooling.

SUGGESTED STRUCTURE

/
├── public/
│   ├── fonts/
│   ├── images/
│   ├── illustrations/
│   └── og/
├── src/
│   ├── pages/
│   ├── layouts/
│   ├── components/
│   ├── islands/
│   ├── data/
│   │   ├── profile.ts
│   │   ├── projects.ts
│   │   ├── experience.ts
│   │   ├── credentials.json
│   │   ├── claims.json
│   │   └── providers.ts
│   ├── lib/
│   │   ├── algorithms/
│   │   ├── evidence/
│   │   ├── documents/
│   │   ├── citations/
│   │   ├── providers/
│   │   ├── validation/
│   │   └── security/
│   ├── workers/
│   │   └── local-index.worker.ts
│   └── styles/
├── worker/
│   ├── index.ts
│   ├── routes/
│   ├── providers/
│   ├── cache/
│   └── security/
├── scripts/
│   ├── import-credentials.ts
│   ├── validate-content.ts
│   ├── validate-provider-policies.ts
│   ├── build-evidence-index.ts
│   └── smoke-production.ts
├── tests/
│   ├── unit/
│   ├── integration/
│   ├── e2e/
│   ├── a11y/
│   └── fixtures/
├── .github/workflows/
├── wrangler.jsonc
├── astro.config.mjs
└── package.json

CLOUDFLARE INTENT

Use Workers Static Assets.

Static routes should bypass Worker.

Only /api/* should invoke Worker first.

Confirm latest Wrangler syntax before deploy.

PERFORMANCE TARGETS

Targets, not claimed measurements:

LCP <= 2.5 s p75
INP <= 200 ms p75
CLS <= 0.1 p75

Homepage initial JS:
target <= 120 KiB compressed

mandatory review above:
150 KiB compressed

Do not place in homepage initial bundle:

PDF parser
graph layout engine
syntax highlighter
AI SDK
large chart library

Lazy load Workbench/Lab code.

Primary content exists in static HTML.

ACCESSIBILITY

Target:
WCAG 2.2 AA

Required:

semantic landmarks
correct headings
skip link
visible focus
focus not obscured
keyboard complete
touch parity
200% zoom/reflow
reduced motion
sufficient contrast
target sizes
form labels/errors
diagram text/table equivalents
SVG title/description
live-result announcements
no color-only state
dialog focus restoration
screen-reader manual review

No core interaction requires dragging.

SEO

Implement:

page titles
descriptions
canonical URLs after domain decision
sitemap
robots
Open Graph
structured Person/WebSite data
descriptive project routes
server/static HTML

Never put unsupported achievements in structured data.

ASSET REQUIREMENTS

Generate original:

brand/wordmark.svg
brand/favicon.svg

hero/system-becoming-clear.svg
hero/system-becoming-clear-mobile.svg

projects/nexusrag-runtime.svg
projects/nexusrag-research.svg
projects/nexusrag-proof-trail.svg

projects/plantpal-layers.svg
projects/plantpal-signal-map.png

workbench/repository-graph.svg
workbench/document-evidence.svg
workbench/citation-integrity.svg

lab/rrf-diagram.svg
lab/binary-search.svg
lab/dijkstra.svg only if shipped

experience/operations-architecture.svg
credentials/mastery-index.svg

og/home.png
og/nexusrag.png
og/plantpal.png

For every asset:

- design brief;
- desktop/mobile composition;
- original SVG where appropriate;
- optimized paths;
- accessibility text;
- PNG/WebP fallback when necessary;
- ASSET_LICENSES.md record.

No copied award-site artwork.
No invented product screenshot.
No invented portrait.

HERO IMAGE PROMPT

Editorial technical atlas on warm mineral paper; sparse architectural nodes
transforming ambiguous inputs into constraints, decisions, system and evidence;
deep ink lines, a single acid-lime signal accent, restrained technical blue;
flat sophisticated vector design; large negative space for headline; no baked
text; no AI brain; no cyberpunk HUD; no generic circuit board; no stock
mountains.

NEXUSRAG IMAGE PROMPT

Two clearly separated engineering lanes: bounded cloud runtime and local/
research retrieval pipeline; document geometry, lexical/dense pathways,
versioned source provenance; sophisticated editorial blueprint; no invented
performance numbers; no implication the lanes are the same deployed runtime.

PLANTPAL IMAGE PROMPT

Layered environmental data sculpture with weather, soil, elevation,
biodiversity and climate bands; quiet contour geometry; uncertainty and
resolution implied through structure; no fantasy eco-city; no fake scientific
measurements.

WORKBENCH IMAGE PROMPT

Evidence graph made of source nodes, manifests, exact passages and provenance
connectors; restrained product-design language; high-contrast; no security
shield/skull clichés; no invented findings.

TESTING

Unit:

RRF
binary search
Dijkstra if shipped
evidence spans
credential importer
provider response schemas
URL validators
DOI normalization
provider policies

Integration:

claim ledger
GitHub gateway
ETag / 304 cache
async SBOM if enabled
Crossref / DataCite fallback
local Workbench offline
AI disabled
provider 429
provider timeout
credential discrepancy

E2E widths:

360x800
390x844
768x1024
1024x768
1440x900
1920x1080

E2E flows:

Home
Portfolio
NexusRAG
PlantPal
Repository Workbench
Document Workbench
Citation Integrity
Lab
Credentials
Experience
Contact
legacy redirects
404
reduced motion
no-JS

Accessibility:

axe
keyboard
screen reader
200% zoom
reflow
focus
dialogs
live regions
diagrams
target sizes

Performance:

Lighthouse CI
browser traces
bundle report
asset sizes
font loading

Security:

SSRF fixtures
redirect escape
private-IP rejection
payload caps
parser bombs
XSS/Markdown
secret scan
AI prompt injection
citation-ID validation
rate-limit states

Do not claim test success until tests run.

CI/CD

Pull Request:

frozen install
→ validate source/content
→ validate provider policy
→ typecheck
→ lint
→ unit/integration
→ build
→ Playwright
→ axe
→ dependency audit
→ secret scan
→ report artifacts

Production:

quality gates
→ immutable preview
→ preview smoke
→ owner approval
→ production deploy
→ production smoke
→ release record

Potential scripts:

"dev"
"typecheck"
"lint"
"test"
"test:e2e"
"test:a11y"
"validate:content"
"validate:providers"
"build:evidence"
"build"
"deploy:preview"
"deploy:production"
"verify:production"

DEPLOYMENT

Primary:
Cloudflare Workers Static Assets + narrow Worker.

Alternative:
retain Vercel only when owner chooses migration minimization/current domain and
the final architecture satisfies static-route, security and performance gates.

Do not operate both architectures unnecessarily.

Store server secrets only in deployment-secret facilities.

ROLLBACK

Retain last known good deployment/version.

Dynamic provider flags must be independently disableable.

If an API provider fails:
disable that provider without rolling back the static Portfolio.

If AI fails:
deterministic evidence remains.

PHASED IMPLEMENTATION

FOUNDATION

- owner-decision report
- source audit
- repository migration ADR
- claim/evidence schemas
- design tokens
- global layout
- CI baseline

PORTFOLIO

- Home
- Portfolio index
- owner-approved projects
- NexusRAG
- PlantPal
- Experience
- Sources

WORKBENCH

- Repository Evidence Graph
- Local Evidence Workbench
- Citation Integrity baseline
- provider policies
- cache
- budget controls

LAB / CREDENTIALS

- RRF
- binary search
- Architecture X-Ray
- optional Dijkstra
- 73-record credential importer/index

REFINEMENT

- original illustrations
- mobile
- dark/light
- reduced motion
- screen reader
- error/offline states
- performance

RELEASE

- full test suite
- preview
- provider failure drills
- owner review
- production
- verification report

RELEASE ACCEPTANCE

Do not declare complete unless:

1. Static routes return correct statuses.
2. Unknown route returns 404.
3. Legacy redirects work.
4. Home communicates identity before animation.
5. Owner-approved projects are present.
6. NexusRAG runtime/research lanes are separate.
7. PlantPal uncertainty/source states are visible.
8. Repository Workbench provides evidence and coverage, never fake security.
9. Local Workbench operates with network unavailable.
10. Citation Integrity passes representative DOI fixtures if released.
11. RRF tests pass.
12. Binary-search tests pass.
13. Dijkstra is either fully passing or omitted.
14. All 73 supplied credential records survive import.
15. Missing 74th credential remains explicitly unresolved.
16. AI may be disabled without harming the experience.
17. Private documents are not transmitted by default.
18. Portfolio works during upstream API outage.
19. Keyboard flows pass.
20. Automated accessibility tests and manual review are documented.
21. Build/typecheck/tests pass.
22. SSRF/input/host tests pass.
23. Actual performance measurements are documented.
24. Provider policies contain review dates.
25. Cloudflare deployment is asset-first if Cloudflare is used.
26. Production deployment succeeds or owner-blocked deployment is documented.
27. Final report explicitly distinguishes verified, repository-documented,
    owner-reported, disabled, conditional and unresolved items.

UNRESOLVED OWNER DECISIONS

Do not guess:

- implementation repository
- final production domain
- whether current Vercel site remains or redirects
- exact 74th credential
- whether newer 74-record/PDF source replaces older 73-record source
- whether newer GitHub projects enter the curated Portfolio
- portrait publication
- resume publication
- AI enablement
- AI budget/tier
- contact form
- environmental provider commercial-use decisions
- optional OpenAlex/DataCite/ROR enrichments

FINAL EXECUTION INSTRUCTION

Inspect the supplied source documents and target repository first.

Produce a concise discrepancy/owner-decision report.

Then implement in gated phases.

Do not stop at scaffolding.

Do not add features merely because an API is free.

Do not sacrifice truth for visual drama.

Do not sacrifice accessibility or performance for animation.

Do not make the core Portfolio dependent on APIs or AI.

Every major section should be beautiful, but its visual language should emerge
from what that section explains.

A recruiter should understand Anupam immediately.

An engineer should discover real technical decisions.

A developer or researcher should be able to complete at least two genuinely
useful Workbench workflows without an account.

The final application should feel like one coherent product:

an extraordinary portfolio in which engineering proof is inspectable,
executable and source-linked.

BEGIN IMPLEMENTATION ONLY AFTER THE SOURCE/OWNER DECISION GATE.
```
