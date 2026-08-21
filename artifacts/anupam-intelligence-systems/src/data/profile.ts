import type { LinkItem, Metric } from "./types";

export const profile = {
  name: "Anupam Roy",
  role: "AI/ML Analyst",
  company: "Accenture",
  email: "anupam020202@gmail.com",
  headline:
    "AI/ML Analyst building production GenAI, RAG, and multi-agent systems",
  positioning:
    "I build enterprise AI systems that turn documents, tickets, logs, and operational knowledge into real-time decisions.",
  narrative:
    "Production GenAI engineer focused on enterprise operations, RAG pipelines, LangGraph orchestration, cloud AI, and backend systems that reduce manual support load.",
};

export const profileLinks: LinkItem[] = [
  { label: "Email", href: "mailto:anupam020202@gmail.com" },
  { label: "GitHub", href: "https://github.com/Anupam0202/" },
  { label: "LinkedIn", href: "https://www.linkedin.com/in/anupam--roy/" },
  { label: "Credly", href: "https://www.credly.com/users/anupam_roy/" },
];

export const portfolioMetrics: Metric[] = [
  {
    value: "74",
    label: "Verified Certifications",
    detail: "PDF-backed and issuer-verifiable",
  },
  {
    value: "180+",
    label: "Digital Badges",
    detail: "Credly cloud and AI badges",
  },
  {
    value: "20%",
    label: "Faster Turnaround",
    detail: "Enterprise support workflows",
  },
  {
    value: "50%",
    label: "Less SME Dependency",
    detail: "AI-assisted operational intelligence",
  },
];

export const executiveProofPoints = [
  "Built a production-grade multi-agent GenAI platform for enterprise support, incident, testing, and release workflows.",
  "Integrated RAG over ticketing, documentation, source-control, observability, database, structured-data, and unstructured-document sources.",
  "Validated cloud, AI, data, security, DevOps, and business-app depth through 74 certifications and 180+ digital badges.",
];
