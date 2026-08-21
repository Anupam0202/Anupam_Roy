import type { SkillGroup } from "./types";

export const skillGroups: SkillGroup[] = [
  {
    title: "Cloud & Architecture",
    skills: ["GCP", "Azure", "AWS", "Cloud Design"],
  },
  {
    title: "AI / LLM Systems",
    skills: [
      "LangGraph",
      "LangChain",
      "RAG Pipelines",
      "Gemini API",
      "Vector Search",
      "Prompt Engineering",
    ],
  },
  {
    title: "Backend Engineering",
    skills: ["Python", "FastAPI", "PostgreSQL", "Node.js"],
  },
  {
    title: "Frontend Engineering",
    skills: ["React", "Next.js", "TypeScript", "Streamlit"],
  },
  {
    title: "DevOps / Automation",
    skills: ["Git", "GitHub", "Docker", "CI/CD"],
  },
];

export const capabilityMap = [
  {
    title: "Retrieval Systems",
    detail:
      "Hybrid search, semantic retrieval, OCR ingestion, reranking, citations, and context-aware response generation.",
  },
  {
    title: "Multi-Agent Workflows",
    detail:
      "LangGraph routing across incident, problem, release, and service-request workflows with stateful orchestration.",
  },
  {
    title: "Backend Orchestration",
    detail:
      "Python APIs, database-backed sessions, SQL analysis, integrations, and production workflow automation.",
  },
  {
    title: "Cloud AI Delivery",
    detail:
      "Multi-cloud architecture knowledge across AWS, Azure, and GCP with deployment and governance awareness.",
  },
  {
    title: "Security & Compliance",
    detail:
      "Input validation, PII redaction, SOX reporting, operational audit trails, and code-quality controls.",
  },
  {
    title: "Automation",
    detail:
      "Test generation, release intelligence, ITSM ticket creation, and CI/CD delivery foundations.",
  },
];
