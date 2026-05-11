import { achievements } from "./achievements";
import { experience } from "./experience";
import { profile, portfolioMetrics } from "./profile";
import { projects } from "./projects";
import { skillGroups } from "./skills";
import { ALL_CERTS, getCertificationCategory } from "./certifications";

export interface AssistantEntry {
  keywords: string[];
  answer: string;
}

const strongestCerts = ALL_CERTS.filter((cert) =>
  [
    "ML Engineer - Associate",
    "Professional ML Engineer",
    "Professional Cloud Architect",
    "Generative AI Engineer Associate",
    "Claude Certified Architect - Foundations",
    "SnowPro Specialty: Gen AI",
    "GitHub Copilot Certification",
  ].includes(cert.name),
);

export const suggestedPrompts = [
  "Why should we hire Anupam?",
  "Explain NexusRAG architecture.",
  "Summarize his enterprise GenAI experience.",
  "Which certifications are most relevant for cloud AI roles?",
  "Is he stronger in backend, GenAI, or cloud?",
  "Show his strongest projects.",
  "Switch to executive summary.",
];

export const assistantKnowledge: AssistantEntry[] = [
  {
    keywords: ["hire", "why", "fit", "recruiter", "summary", "executive"],
    answer: `## Why Anupam is a strong AI/ML engineering hire

${profile.name} is not only presenting AI demos. He has built production enterprise AI workflows at ${profile.company}: multi-agent orchestration, RAG over operational systems, incident intelligence, release automation, test generation, ITSM automation, SQL analysis, and compliance reporting.

**Proof points**
- ${experience[0].impact?.[0]?.value} ${experience[0].impact?.[0]?.label}
- ${experience[0].impact?.[1]?.value} ${experience[0].impact?.[1]?.label}
- ${portfolioMetrics[0].value} verified certifications and ${portfolioMetrics[1].value} digital badges

Best fit: GenAI engineer, RAG engineer, AI platform/backend engineer, cloud AI engineer, or enterprise AI automation role.`,
  },
  {
    keywords: ["nexusrag", "nexus", "architecture", "flagship", "rag"],
    answer: `## NexusRAG architecture

NexusRAG is the flagship project: a high-performance RAG system with FastAPI, Next.js, Gemini, OCR, hybrid retrieval, reranking, streaming answers, and citations.

**Flow:** Upload -> Parsing/OCR -> Chunking -> Hybrid Retrieval -> Reranking -> LLM -> Streaming Answer -> Citations.

It supports PDF, DOCX, Excel, CSV, images, TXT, Markdown, and JSON. Retrieval combines BM25, FAISS, and RRF fusion, then improves precision with a cross-encoder reranker. It also includes semantic cache, multi-query expansion, adaptive K, history-aware reformulation, runtime API key management, input sanitization, file validation, PII redaction, and rate limiting.

See the Projects / AI Lab section for the visual architecture card.`,
  },
  {
    keywords: ["enterprise", "genai", "accenture", "experience", "incident", "servicenow", "release", "test"],
    answer: `## Enterprise GenAI experience

At Accenture, Anupam built a **production enterprise operational AI platform** for support, incident, release, testing, and compliance workflows. The portfolio intentionally keeps client and internal system names private.

Core systems built:
- LangGraph agents for incident, problem, release, and service-request workflows
- RAG over enterprise ticketing, documentation, source-control, observability, database, and document sources
- Root-cause analysis correlating logs and historical incidents
- Functional test generation plus Selenium, UFT, and Karate scripts
- Release notes, deployment plans, and rollback strategies from commits, work items, and release documentation
- ITSM ticket creation from chat
- SQL/system analysis and SOX compliance reporting

Measured impact: about 20% faster turnaround and about 50% lower SME dependency.`,
  },
  {
    keywords: ["certification", "certifications", "cloud ai", "aws", "azure", "gcp", "google", "microsoft"],
    answer: `## Most relevant certifications for cloud AI roles

The strongest cloud AI signals are:
${strongestCerts.map((cert) => `- ${cert.provider}: ${cert.name} (${getCertificationCategory(cert)})`).join("\n")}

The full Mastery Wall contains ${ALL_CERTS.length} verified certifications across AWS, Google Cloud, Microsoft, Snowflake, Databricks, Anthropic, and MongoDB, with PDFs and live issuer links.`,
  },
  {
    keywords: ["backend", "cloud", "stronger", "skill", "skills", "stack"],
    answer: `## Backend vs GenAI vs cloud

Anupam's strongest signal is the intersection: **GenAI systems built with backend and cloud discipline**.

${skillGroups.map((group) => `**${group.title}:** ${group.skills.join(", ")}`).join("\n\n")}

He is strongest in production GenAI/RAG and backend orchestration, with unusually broad cloud validation across AWS, Azure, and GCP.`,
  },
  {
    keywords: ["projects", "strongest", "portfolio", "plantpal", "rag chatbot"],
    answer: `## Strongest projects

${projects
  .filter((project) => project.rank !== "archive")
  .map((project) => `- **${project.name}:** ${project.oneLiner}`)
  .join("\n")}

NexusRAG should be treated as the flagship because it most directly maps to RAG, OCR, retrieval, streaming, backend, and production AI platform work.`,
  },
  {
    keywords: ["achievement", "achievements", "credly", "google cloud", "chess"],
    answer: `## Achievements

${achievements.map((achievement) => `- **${achievement.title}:** ${achievement.proof}`).join("\n")}

These are proof signals for consistency: cloud learning depth, public badges, and problem-solving discipline.`,
  },
  {
    keywords: ["contact", "email", "linkedin", "github", "reach"],
    answer: `## Contact

Email: ${profile.email}

GitHub: https://github.com/Anupam0202/

LinkedIn: https://www.linkedin.com/in/anupam--roy/

Use the Contact section to send a structured message through the portfolio form.`,
  },
];

export function answerFromPortfolio(query: string): string {
  const normalized = query.toLowerCase();
  let best: AssistantEntry | undefined;
  let bestScore = 0;

  for (const entry of assistantKnowledge) {
    const score = entry.keywords.reduce((total, keyword) => total + (normalized.includes(keyword) ? 1 : 0), 0);
    if (score > bestScore) {
      best = entry;
      bestScore = score;
    }
  }

  if (best && bestScore > 0) return best.answer;

  return `I am using offline portfolio mode. I can answer from Anupam's structured portfolio data about experience, NexusRAG, PlantPal, certifications, skills, achievements, projects, contact details, and hiring fit. Try: "Why should we hire Anupam?" or "Explain NexusRAG architecture."`;
}
