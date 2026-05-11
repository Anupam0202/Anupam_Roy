export interface LinkItem {
  label: string;
  href: string;
}

export interface Metric {
  value: string;
  label: string;
  detail?: string;
}

export interface SkillGroup {
  title: string;
  skills: string[];
}

export interface ExperienceRole {
  company: string;
  role: string;
  period: string;
  positioning: string;
  project?: string;
  type?: string;
  impact?: Metric[];
  architectureBlocks: string[];
  built: string[];
  stack: string[];
}

export interface Project {
  name: string;
  rank: "flagship" | "featured" | "lab" | "archive";
  tab: "Flagship Systems" | "RAG / GenAI" | "ML / Computer Vision" | "Frontend Experiments";
  oneLiner: string;
  problem: string;
  architecture: string[];
  tech: string[];
  live: string;
  github: string;
  visualFlow?: string[];
}

export interface Achievement {
  title: string;
  proof: string;
  summary: string;
  metrics: Metric[];
  links: LinkItem[];
}

export interface EducationItem {
  title: string;
  institution: string;
  period: string;
  result: string;
  details: string[];
}
