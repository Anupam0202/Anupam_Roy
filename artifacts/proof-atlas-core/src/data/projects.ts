/**
 * Every public project repository of Anupam0202, inspected at the commit
 * listed. What was read differs by project (see `inspectionScope`); test and
 * CI facts were counted from the repository at that commit, not run.
 * Project-site links come from the owner's previous portfolio or the
 * repository README and have NOT been checked for availability.
 */

export type ProjectCategory = "AI / LLM" | "ML / Computer Vision" | "Data integration" | "Web / Frontend" | "Systems / Cloud";

export const PROJECT_CATEGORIES: ProjectCategory[] = [
  "AI / LLM",
  "ML / Computer Vision",
  "Data integration",
  "Web / Frontend",
  "Systems / Cloud",
];

export interface Project {
  slug: string;
  name: string;
  rank: "flagship" | "featured" | "lab" | "archive";
  categories: ProjectCategory[];
  oneLiner: string;
  problem: string;
  highlights: string[];
  /** How the system works, step by step, as the repository describes and implements it. */
  howItWorks?: string[];
  /** Engineering facts observed in the repository at the reviewed commit. */
  engineering?: Array<{ label: string; value: string }>;
  /** What the project does not do, or has not shown. */
  limitations?: string[];
  tech: string[];
  repository: { url: string; commit: string; committedOn: string; license: string | null };
  site?: { href: string; label: string; source: "repository README" | "owner portfolio" };
  /** Ids into the claims ledger. */
  claimIds: string[];
  reviewedOn: string;
}

const REVIEWED = "2026-10-25";
const REVIEWED_ALL = "2026-10-26";
const gh = (repo: string) => `https://github.com/Anupam0202/${repo}`;

export const projects: Project[] = [
  {
    slug: "nexusrag",
    name: "NexusRAG",
    rank: "flagship",
    categories: ["AI / LLM", "Systems / Cloud"],
    oneLiner: "A retrieval-augmented document research platform with a bounded, tenant-scoped cloud runtime and a richer local research pipeline.",
    problem:
      "Teams need answers from their own documents that cite real sources, stay inside a workspace boundary, and refuse to answer when the evidence is not there.",
    highlights: [
      "Two lanes kept separate: a bounded Cloudflare / Supabase / Qdrant / Gemini runtime and a FastAPI research pipeline.",
      "Gateway answers must cite retrieved sources or abstain.",
      "Hybrid lexical and dense retrieval with a rank-based blend.",
      "Evaluation harness for recall@k, MRR, nDCG, citation precision and cross-workspace leakage.",
    ],
    engineering: [
      { label: "Tests", value: "465 test definitions in 72 files (Python and JavaScript)" },
      { label: "CI", value: "Five GitHub Actions workflows: foundation CI, database rehearsal, live-provider validation, Cloudflare preview and production deploy" },
      { label: "Licence", value: "MIT" },
    ],
    tech: ["Next.js 16", "Cloudflare Workers", "Supabase", "Qdrant", "Gemini", "FastAPI", "Python", "TypeScript"],
    repository: { url: gh("NexusRAG"), commit: "85b14f131f5eacb07082a32c7173f20be472772f", committedOn: "2026-10-07", license: "MIT" },
    claimIds: [
      "nexus-two-lanes",
      "nexus-not-production",
      "nexus-capabilities",
      "nexus-runtime-settings",
      "nexus-fusion",
      "nexus-citation-gate",
      "nexus-formats",
      "nexus-fail-closed",
      "nexus-data-authority",
      "nexus-findings",
      "nexus-auth",
      "nexus-byok",
      "nexus-queue",
      "nexus-research-pipeline",
      "nexus-evals",
      "nexus-readme-key",
    ],
    reviewedOn: REVIEWED,
  },
  {
    slug: "plantpal",
    name: "PlantPal",
    rank: "flagship",
    categories: ["AI / LLM", "Data integration", "Web / Frontend"],
    oneLiner: "A garden-planning assistant that combines weather, air, soil, elevation, biodiversity and climate signals with Gemini interpretation.",
    problem:
      "Choosing what to plant depends on many local signals that live in different public datasets, each with its own resolution, freshness and uncertainty.",
    highlights: [
      "Client-side integration of Open-Meteo, ISRIC SoilGrids, GBIF, Sunrise-Sunset and Open-Elevation.",
      "Gemini turns the combined environmental profile into suggestions.",
      "Browser cache with 15-minute and 24-hour freshness classes.",
    ],
    engineering: [
      { label: "Tests", value: "None in the repository" },
      { label: "Licence", value: "No licence file" },
    ],
    tech: ["React 19", "TypeScript", "Vite", "Tailwind CSS", "Gemini API"],
    repository: { url: gh("PlantPal"), commit: "99071d48a2e25486ee795a8434b8ef2aa88b5a51", committedOn: "2026-03-08", license: null },
    claimIds: ["plantpal-sources", "plantpal-carbon", "plantpal-biodiversity", "plantpal-climate", "plantpal-cache", "plantpal-doctor", "plantpal-key"],
    reviewedOn: REVIEWED,
  },
  {
    slug: "cutline",
    name: "CUTLINE",
    rank: "featured",
    categories: ["AI / LLM", "Systems / Cloud"],
    oneLiner: "Version-bound fact review for documentary editing: a script edit invalidates exactly the claim reviews and cut recipes it affects.",
    problem:
      "Documentary teams revise narration after research, and an old “checked” flag can stay green after a date, qualifier or attribution has changed.",
    highlights: [
      "Each claim review is bound by SHA-256 fingerprints to the exact cue text, captured evidence and edit recipe a person approved; any change marks only the dependent reviews stale.",
      "Research calls Parallel Search for public evidence, and Gemini on Vertex AI assesses only the returned excerpts.",
      "A deterministic review state machine owns every transition: research may propose narration but cannot approve, publish or alter quotes.",
      "Mutations need a session CSRF token and an expected revision; Firestore checks and writes in one transaction.",
      "Exports a JSON, CSV or text handoff for editors, with CSV formula neutralization.",
    ],
    howItWorks: [
      "Load a timecoded paper edit whose claims were already reviewed.",
      "Edit a cue: its fingerprint changes, so only the claims and cut recipes that depend on it go stale.",
      "Research the cue: Parallel Search returns public excerpts, Gemini assesses only those, and may propose a repair.",
      "A person approves the wording and signs off each recipe.",
      "Export a current, traceable handoff.",
    ],
    engineering: [
      { label: "Tests", value: "30 test definitions in 9 files (domain, API, providers, security, store)" },
      { label: "CI", value: "GitHub Actions: Ruff lint and format, unit tests, browser-script syntax, repository policy, container build" },
      { label: "Deployment", value: "Cloud Run with Firestore and Secret Manager (documented scripts); a Google ADK agent for Vertex AI Agent Engine" },
      { label: "Licence", value: "MIT" },
    ],
    limitations: [
      "The README lists credentialed checks to run before claiming live end-to-end validation; none are recorded in the repository.",
      "Fixture mode works without credentials and labels all its evidence as synthetic.",
    ],
    tech: ["Python 3.12", "FastAPI", "Gemini on Vertex AI", "Google ADK", "Parallel Search API", "Firestore", "Cloud Run"],
    repository: { url: gh("cutline"), commit: "7f638061f4d1993a92ca0ca31b9658c7ca1a9b51", committedOn: "2026-09-10", license: "MIT" },
    claimIds: ["cutline-readme", "cutline-fingerprints"],
    reviewedOn: REVIEWED_ALL,
  },
  {
    slug: "food-bank-recall-closure-agent",
    name: "Food-Bank Recall Closure Agent",
    rank: "featured",
    categories: ["AI / LLM", "Systems / Cloud"],
    oneLiner:
      "Turns a food-recall notice into a verified internal closure across a food bank and its partner pantries, with Gemini extraction and a Google ADK coordinator held to typed tools.",
    problem:
      "Recall discovery is not recall completion: affected donated stock hides in inconsistent records across partner pantries, and every hold, review and acknowledgement has to be tracked to closure.",
    highlights: [
      "Deterministic matching before AI: only a normalized UPC and lot match creates an exact match and a reversible quarantine hold; partial or visual matches go to human review.",
      "A Google ADK coordinator may call only eight allowlisted read or proposal tools; the model cannot change status, authorize disposal or claim regulator closure.",
      "Pydantic-validated Gemini extraction from PDF, JSON or text notices, with mock, replay and live modes labelled in the interface.",
      "Idempotent incident, match and task identifiers survive Pub/Sub redelivery: replaying a notice creates no duplicate holds or tasks.",
      "Administrator-only evidence packs with a SHA-256 per file and an ordered audit hash chain.",
    ],
    howItWorks: [
      "Validate and store the recall notice with its provenance.",
      "Gemini converts the untrusted notice into a strict schema.",
      "Deterministic rules classify inventory and create holds, reviews and partner tasks.",
      "The ADK coordinator reads sanitized incident context and proposes next steps through allowlisted tools.",
      "People resolve potential matches, and partner pantries acknowledge.",
      "The internal workflow closes only when every blocker is empty.",
    ],
    engineering: [
      { label: "Tests", value: "92 test definitions in 27 files, plus a scripted golden path" },
      { label: "CI", value: "GitHub Actions" },
      { label: "Deployment", value: "One Cloud Run service with Firestore, Cloud Storage, Secret Manager and authenticated Pub/Sub push with a dead-letter topic (documented script)" },
      { label: "Licence", value: "MIT" },
    ],
    limitations: [
      "Internal coordination only: it does not replace official recall notices or decide whether food is safe.",
      "All fixture products, organizations and package images are synthetic.",
      "openFDA data is used as supporting enforcement data, not as a real-time alert feed.",
    ],
    tech: ["Python 3.12", "FastAPI", "Google ADK", "Gemini", "Firestore", "Cloud Storage", "Pub/Sub", "Cloud Run"],
    repository: { url: gh("food-bank-recall-closure-agent"), commit: "6bdf032890dfd6d907446cf72aa4748feb350e81", committedOn: "2026-09-01", license: "MIT" },
    claimIds: ["foodbank-readme", "foodbank-matching"],
    reviewedOn: REVIEWED_ALL,
  },
  {
    slug: "raceproof",
    name: "RaceProof",
    rank: "featured",
    categories: ["AI / LLM", "Systems / Cloud"],
    oneLiner:
      "Turns an intermittent JVM concurrency failure into a replayable minimized schedule, a source-linked causal witness, a bounded repair attempt and an independently verified evidence bundle.",
    problem: "Concurrency bugs disappear under observation: a flaky failure is hard to reproduce, explain or repair with confidence.",
    highlights: [
      "A controlled scheduler records and replays thread interleavings; delta debugging (ddmin) minimizes the failing schedule.",
      "A causal witness links the minimized schedule to source lines and an invariant.",
      "Separate reproducer and repairer roles; a pristine, protected verifier re-checks the production-only diff before the run waits for human review.",
      "Gemini is used only for evidence-linked diagnosis and patch proposal; scheduling, replay, minimization, policy and verification stay deterministic.",
      "Python orchestration with a typed state machine, and a Java target harness.",
    ],
    howItWorks: [
      "Load an untrusted case into a deny-by-default workspace.",
      "Run it under a controlled scheduler, normalize the failure and replay it.",
      "Minimize the failing schedule with ddmin and probe alternatives.",
      "Compile a source-linked causal witness and invariant card.",
      "Propose a minimal repair and verify it in a protected verifier.",
      "Stop at awaiting-review and package a portable evidence bundle.",
    ],
    engineering: [
      { label: "Tests", value: "48 Python test definitions in 12 files, plus a Java target harness" },
      { label: "CI", value: "GitHub Actions release gates" },
      { label: "Licence", value: "MIT" },
    ],
    limitations: [
      "The published evaluation is a labelled mock run in fixture mode; real-model and Fray runs were not performed.",
      "Finite schedule testing is not a formal proof, and the bundled cases are instrumented synthetic fixtures.",
    ],
    tech: ["Python", "Java", "Gemini", "Docker", "Make"],
    repository: { url: gh("raceproof"), commit: "60d1018c3a7556c8dea0c52c197873066246e62e", committedOn: "2026-08-31", license: "MIT" },
    claimIds: ["raceproof-readme"],
    reviewedOn: REVIEWED_ALL,
  },
  {
    slug: "ahawin",
    name: "AhaWin",
    rank: "featured",
    categories: ["AI / LLM", "Web / Frontend"],
    oneLiner:
      "An evidence-first STEM reflection app: learners review the evidence, test a rule, explain it and try a fresh problem, with cost-protected Gemini analysis.",
    problem:
      "Answer checkers tell learners that they are wrong but not which step, and an AI tutor can invent a misconception from a photo that shows no reasoning at all.",
    highlights: [
      "Three curated examples run with zero model calls, and live AI is off by default.",
      "A missing-evidence route: a photo of the question alone cannot unlock an invented misconception.",
      "At most two sequential Gemini attempts, with strict response validation, numeric-equality checks and one total time budget.",
      "Shared Redis reservations, cooldowns and fail-closed daily quotas protect cost; an optional access code limits a pilot.",
      "No runtime npm dependencies: KaTeX is vendored, and photos are resized and stripped of metadata in the browser.",
    ],
    howItWorks: [
      "Upload or paste a photo of worked steps; it is resized and stripped of metadata locally.",
      "The server checks budgets and asks Gemini for a structured lesson contract.",
      "The response is validated and its numbers re-checked; a second model is tried at most once.",
      "The learner reviews the evidence, tests a rule, explains it and tries a fresh problem.",
    ],
    engineering: [
      { label: "Tests", value: "108 test definitions in 5 files, plus an optional Playwright browser suite" },
      { label: "CI", value: "GitHub Actions" },
      { label: "Deployment", value: "Vercel: static public/ with api/ functions" },
      { label: "Licence", value: "MIT" },
    ],
    limitations: [
      "Not represented as compliant for an under-18 audience.",
      "Numeric checking supports a small grammar; symbolic reasoning still needs human judgement.",
      "Live Gemini and Redis connectivity cannot be certified without the deployment's credentials.",
    ],
    tech: ["JavaScript", "Node.js 24", "Gemini API", "Upstash Redis", "KaTeX", "Vercel"],
    repository: { url: gh("ahawin"), commit: "fabe9e3e51e57d098f93ecfc8f9de064786ec3b5", committedOn: "2026-09-05", license: "MIT" },
    claimIds: ["ahawin-readme"],
    reviewedOn: REVIEWED_ALL,
  },
  {
    slug: "pantryproof",
    name: "PantryProof",
    rank: "featured",
    categories: ["Data integration", "Web / Frontend"],
    oneLiner: "Closes a food-bank recall across every partner pantry with source-linked evidence, human-reviewed exceptions and a replayable closure packet.",
    problem:
      "Recalled product reaches partner pantries through many paths, and agencies keep inconsistent records, so proving that a recall is closed everywhere is slow and error-prone.",
    highlights: [
      "An item is marked affected automatically only on an exact normalized UPC/GTIN and lot match; brand or description similarity can route a review but never approve safety.",
      "Nutrient DWS extracts recall notices and inventory into fixed schemas with citations, and a coordinator must promote the extraction before it is used.",
      "SerpApi news search supports discovery; the evidence tier comes from the URL host, not the source's own label.",
      "The server repeats the closure gate before generating a closure PDF with the audit trail and a SHA-256 evidence-manifest digest.",
    ],
    howItWorks: [
      "Start from a visibly fictional case, or discover current evidence with SerpApi.",
      "Extract a recall notice and partner inventory with Nutrient, with citations.",
      "A coordinator promotes the reviewed extraction into the active case.",
      "The deterministic UPC and lot policy marks affected stock; exceptions go to review.",
      "Record containment and downstream notification.",
      "The server generates the closure PDF only when every requirement is met.",
    ],
    engineering: [
      { label: "Tests", value: "26 test definitions in 3 files" },
      { label: "CI", value: "GitHub Actions" },
      { label: "Deployment", value: "Vercel" },
      { label: "Licence", value: "No licence file" },
    ],
    limitations: ["The default case and its data are fictional.", "Live features need server-side Nutrient and SerpApi credentials."],
    tech: ["TypeScript", "Node.js 22", "Nutrient DWS API", "SerpApi", "Vercel"],
    repository: { url: gh("pantryproof"), commit: "a55cc1acc0a968ec0f40a8d2635eed157d73cae1", committedOn: "2026-09-03", license: null },
    site: { href: "https://pantryproof.vercel.app", label: "Live application", source: "repository README" },
    claimIds: ["pantryproof-readme"],
    reviewedOn: REVIEWED_ALL,
  },
  {
    slug: "rag",
    name: "RAG",
    rank: "featured",
    categories: ["AI / LLM"],
    oneLiner: "Gemini, LangChain and Streamlit document Q&A with hybrid retrieval and chat memory.",
    problem: "Make uploaded business documents searchable and answerable with sources, across spreadsheets, PDFs, Word and text files.",
    highlights: [
      "FAISS vector search combined with BM25 keyword matching: both scores are normalized, weighted and summed per chunk.",
      "Documents are split into 2,000-character chunks with 300 characters of overlap and embedded with sentence-transformers all-MiniLM-L6-v2.",
      "Answers come from Gemini 2.5 Flash at temperature 0.1.",
      "Ingests Excel, CSV, PDF, DOCX, text, Markdown and JSON, with multi-turn chat memory and Markdown export.",
    ],
    howItWorks: [
      "Upload documents; they are parsed and split into overlapping chunks.",
      "Chunks are embedded into a FAISS index and tokenized for BM25.",
      "A question retrieves candidates from both, and the normalized scores are blended.",
      "Gemini answers from the top chunks, keeping the conversation history.",
    ],
    engineering: [
      { label: "Tests", value: "None in the repository" },
      { label: "Licence", value: "No licence file" },
    ],
    tech: ["Python", "Streamlit", "LangChain", "FAISS", "BM25", "Gemini"],
    repository: { url: gh("RAG"), commit: "ac1fe8b6b2a8611f8c20c913da36c2826ef73361", committedOn: "2026-03-07", license: null },
    site: { href: "https://rag-with-langchain.streamlit.app/", label: "Streamlit app", source: "owner portfolio" },
    claimIds: ["rag-readme", "rag-config"],
    reviewedOn: REVIEWED_ALL,
  },
  {
    slug: "contextual-rag-chatbot",
    name: "Contextual-RAG-Chatbot",
    rank: "featured",
    categories: ["AI / LLM"],
    oneLiner: "PDF question answering with Gemini, OCR fallback, an adjustable context window and an analytics dashboard.",
    problem: "Answer questions from PDFs, including scanned ones, while keeping conversation context and showing usage analytics.",
    highlights: [
      "Text extraction tries PyPDF2 and pdfplumber, with Tesseract OCR for scanned pages.",
      "Hybrid search blends dense and sparse scores with a tunable weight (alpha).",
      "1,000-character chunks with 200 characters of overlap.",
      "Context window adjustable from 1 to 20 messages; analytics exportable to Excel or HTML.",
    ],
    howItWorks: [
      "Upload PDFs; text is extracted, with OCR when a page has no text layer.",
      "Chunks are indexed for dense and keyword search.",
      "A question is answered by Gemini from the blended top results and the recent conversation.",
      "Usage is tracked and can be exported.",
    ],
    engineering: [
      { label: "Tests", value: "None in the repository" },
      { label: "Licence", value: "No licence file" },
    ],
    tech: ["Python", "Streamlit", "Gemini", "PyPDF2", "pdfplumber", "Tesseract"],
    repository: { url: gh("Contextual-RAG-Chatbot"), commit: "3272463620c3fb512551c2bb5e10220ebdfd9ef7", committedOn: "2025-12-02", license: null },
    site: { href: "https://contextual-rag-chatbot.streamlit.app/", label: "Streamlit app", source: "owner portfolio" },
    claimIds: ["contextual-readme", "contextual-hybrid"],
    reviewedOn: REVIEWED_ALL,
  },
  {
    slug: "boxshield-arena",
    name: "BoxShield Arena",
    rank: "lab",
    categories: ["AI / LLM", "Systems / Cloud"],
    oneLiner:
      "A safe, utility-aware red-team evaluator for BoxLang AI agents: it attacks a bundled synthetic target, proposes allowlisted guardrails and measures safety and utility before and after.",
    problem: "A guardrail that blocks attacks can also break legitimate use, and red-teaming a real system is risky.",
    highlights: [
      "Runs a bounded adversarial corpus against a bundled synthetic support agent; remote targets are rejected and every action is simulated.",
      "Proposes declarative, allowlisted guardrail patches; HMAC-signed capsules bind the run state.",
      "Recorded fixture scores: full-corpus safety 26 → 89 with utility 100 → 80; the quick corpus reaches safety 100 with utility unchanged. One scripted sample, not a certification.",
    ],
    howItWorks: ["Evaluate the target against the corpus.", "Propose a defence from an allowlist.", "Approve it.", "Replay the corpus and compare safety and utility."],
    engineering: [
      { label: "Tests", value: "TestBox: 60 passed, 0 failed (as recorded in the README)" },
      { label: "CI", value: "GitHub Actions" },
      { label: "Deployment", value: "Container image for Vercel; replay mode only" },
      { label: "Licence", value: "Apache-2.0" },
    ],
    limitations: [
      "Recorded Replay is the only enabled HTTP mode; live Gemini execution is disabled and unverified.",
      "The replay is one deterministic sample, not statistical evidence.",
    ],
    tech: ["BoxLang", "bx-ai", "TestBox", "CommandBox", "Java 21", "Docker"],
    repository: { url: gh("boxshield-arena"), commit: "864b25bbedec74a6dd84ca866d44a16dbdc0056f", committedOn: "2026-09-02", license: "Apache-2.0" },
    claimIds: ["boxshield-readme"],
    reviewedOn: REVIEWED_ALL,
  },
  {
    slug: "recordcheck",
    name: "RecordCheck",
    rank: "lab",
    categories: ["Data integration", "Web / Frontend"],
    oneLiner: "A local-only evidence review prototype that flags mechanical gaps between claims and their sources and binds human review to the exact revision reviewed.",
    problem: "In factual review, a claim can drift from its exhibit after edits, and a review recorded earlier silently stops matching what was checked.",
    highlights: [
      "Imports a small JSON matter with exact 1-based, inclusive line citations into its exhibits.",
      "Flags missing sources or lines, quote discrepancies and literal ISO-date and SGD-amount gaps; every claim still needs human review.",
      "Records a review or exclusion with a reason, invalidates it when the claim or source changes, and exports a packet that lists unresolved items.",
      "No npm dependencies, network requests or storage; it runs from one self-contained HTML file.",
    ],
    engineering: [
      { label: "Tests", value: "43 test definitions in 2 files" },
      { label: "Deployment", value: "None performed; a static Vercel configuration is included" },
      { label: "Licence", value: "No licence file" },
    ],
    limitations: [
      "A quote at a location is not proof of the claim: no negation, arithmetic, credibility or legal validity is established.",
      "No PDF or OCR ingestion; input is limited to small JSON matters.",
    ],
    tech: ["TypeScript", "Node.js 24", "HTML", "CSS"],
    repository: { url: gh("recordcheck"), commit: "5e042b781901b46e3d988fa0088ee41d01d251c8", committedOn: "2026-09-06", license: null },
    claimIds: ["recordcheck-readme"],
    reviewedOn: REVIEWED_ALL,
  },
  {
    slug: "mavunoguard-ai",
    name: "MavunoGuard AI",
    rank: "lab",
    categories: ["AI / LLM", "ML / Computer Vision"],
    oneLiner: "Mobile-first post-harvest decision support for maize: a grain photo and field observations become an explainable risk score, a bilingual action plan and a testing referral.",
    problem: "Maize farmers must decide quickly what to do with grain that may be damp or mouldy, without a laboratory test to hand.",
    highlights: [
      "Gemini reviews the photo under a constrained JSON schema, and a transparent rule engine scores moisture, storage, weather and farmer-reported red flags.",
      "The risk score lists its contributing factors and their weights, so the result can be checked.",
      "English and Kiswahili action plans, a certified-testing referral and a printable batch passport.",
      "Without a key it uses a labelled deterministic assessment; zero runtime npm dependencies.",
    ],
    engineering: [
      { label: "Tests", value: "None in the repository" },
      { label: "Deployment", value: "A local Node server" },
      { label: "Licence", value: "MIT" },
    ],
    limitations: [
      "It does not detect, quantify or rule out aflatoxin, or certify food or feed safety; suspect batches need an approved test.",
      "The value scenario and the M-Pesa booking are illustrative simulations.",
    ],
    tech: ["Node.js 20", "Gemini", "HTML", "CSS"],
    repository: { url: gh("mavunoguard-ai"), commit: "70de3bd42ebd5d52238bfe818c405d884970abba", committedOn: "2026-08-28", license: "MIT" },
    claimIds: ["mavunoguard-readme", "mavunoguard-risk"],
    reviewedOn: REVIEWED_ALL,
  },
  {
    slug: "handwritten-chemical-compound-detection",
    name: "Handwritten-Chemical_Compound-Detection",
    rank: "lab",
    categories: ["ML / Computer Vision"],
    oneLiner: "TensorFlow object detection for hand-drawn chemical structures.",
    problem: "Recognize chemical structures in photographs of handwritten chemical equations.",
    highlights: [
      "TensorFlow Object Detection API with an SSD EfficientDet-D0 512×512 configuration for 30 compound classes, from benzene and phenol to naphthalene and benzoic acid.",
      "Labelling, label-map and TFRecord generation scripts.",
      "Training and inference notebooks, including webcam inference.",
    ],
    engineering: [
      { label: "Training config", value: "Batch size 3, 300,000 steps, fine-tuned from a detection checkpoint" },
      { label: "Licence", value: "No licence file" },
    ],
    tech: ["Python", "TensorFlow", "Object Detection API", "Jupyter"],
    repository: { url: gh("Handwritten-Chemical_Compound-Detection"), commit: "6838c9e034044dfb94f2ea037ac81dfc62d21cd1", committedOn: "2022-07-07", license: null },
    site: {
      href: `${gh("Handwritten-Chemical_Compound-Detection")}/blob/6838c9e034044dfb94f2ea037ac81dfc62d21cd1/object_detection_tutorial.ipynb`,
      label: "Inference notebook",
      source: "repository README",
    },
    claimIds: ["chem-readme", "chem-config"],
    reviewedOn: REVIEWED_ALL,
  },
  {
    slug: "my-portfolio",
    name: "My-Portfolio",
    rank: "archive",
    categories: ["Web / Frontend"],
    oneLiner: "An earlier Next.js and React portfolio with hero, projects, technologies and timeline sections.",
    problem: "Present projects, technologies and a timeline in a responsive personal site.",
    highlights: ["Next.js 10 and React 17 pages styled with styled-components and react-icons."],
    tech: ["React 17", "Next.js 10", "styled-components"],
    repository: { url: gh("My-Portfolio"), commit: "482f459d5cf36040ddaa7f78a240a92c5f1de206", committedOn: "2022-03-16", license: null },
    site: { href: "https://portfolioanupamroy.netlify.app/", label: "Netlify site", source: "repository README" },
    claimIds: ["archive-readmes"],
    reviewedOn: REVIEWED_ALL,
  },
  {
    slug: "anupam-portfolio",
    name: "Anupam-Portfolio",
    rank: "archive",
    categories: ["Web / Frontend"],
    oneLiner: "An early React portfolio created with Create React App.",
    problem: "Explore a component-based personal site.",
    highlights: [
      "React 17 with Create React App.",
      "The README describes SCSS, Framer Motion and Sanity, but the committed package.json lists only Create React App dependencies.",
    ],
    tech: ["React 17", "Create React App"],
    repository: { url: gh("Anupam-Portfolio"), commit: "2dc1228fa9cb45599ab99e79209e366698e5d518", committedOn: "2022-03-16", license: null },
    site: { href: "https://anupamroyportfolio.netlify.app/", label: "Netlify site", source: "repository README" },
    claimIds: ["archive-readmes"],
    reviewedOn: REVIEWED_ALL,
  },
  {
    slug: "real-estate",
    name: "Real-Estate",
    rank: "archive",
    categories: ["Web / Frontend"],
    oneLiner: "A Next.js property-browsing application over the Bayut listings API.",
    problem: "Browse and search property listings for sale or rent, with filters and detail pages.",
    highlights: ["Next.js 11 pages with Chakra UI, fetching listings from the Bayut API through RapidAPI with axios; search filters and a per-property image scroller."],
    tech: ["React 17", "Next.js 11", "Chakra UI", "axios"],
    repository: { url: gh("Real-Estate"), commit: "c8f1211bc41dc394435fab349667570fb83f0ced", committedOn: "2022-01-04", license: null },
    site: { href: "https://real-estate-tau-ten.vercel.app/", label: "Vercel site", source: "owner portfolio" },
    claimIds: ["archive-readmes"],
    reviewedOn: REVIEWED_ALL,
  },
  {
    slug: "modern-ui-ux-gpt3",
    name: "Modern_UI-UX_GPT3",
    rank: "archive",
    categories: ["Web / Frontend"],
    oneLiner: "A responsive GPT-3-themed landing page built to practise layout craft.",
    problem: "Practise component composition, BEM, flexbox and grid, and complex gradients.",
    highlights: ["React components with BEM-structured CSS, flexbox and grid layouts and gradient styling (per README)."],
    tech: ["React 17", "CSS"],
    repository: { url: gh("Modern_UI-UX_GPT3"), commit: "04276f96307f8867cd3d84361e351017d2731f2c", committedOn: "2022-01-04", license: null },
    site: { href: "https://anupam0202.github.io/Modern_UI-UX_GPT3/", label: "GitHub Pages site", source: "repository README" },
    claimIds: ["archive-readmes"],
    reviewedOn: REVIEWED_ALL,
  },
];

export const projectBySlug = (slug: string) => projects.find((p) => p.slug === slug);

/** Projects whose source code was read in depth at the reviewed commit. */
const SOURCE_INSPECTED = new Set(["nexusrag", "plantpal"]);
/** Projects where key source files (domain logic, providers, configuration) were read as well as the README. */
const KEY_FILES_INSPECTED = new Set([
  "cutline",
  "food-bank-recall-closure-agent",
  "raceproof",
  "ahawin",
  "rag",
  "contextual-rag-chatbot",
  "mavunoguard-ai",
  "handwritten-chemical-compound-detection",
  "my-portfolio",
  "anupam-portfolio",
  "real-estate",
  "modern-ui-ux-gpt3",
]);

export const inspectionScope = (p: Pick<Project, "slug">) =>
  SOURCE_INSPECTED.has(p.slug)
    ? "README, file list and source code"
    : KEY_FILES_INSPECTED.has(p.slug)
      ? "README, file list and key source files"
      : "README and file list";

/** The repository as it was at the reviewed commit. */
export const reviewedTreeUrl = (p: Pick<Project, "repository">) => `${p.repository.url}/tree/${p.repository.commit}`;
