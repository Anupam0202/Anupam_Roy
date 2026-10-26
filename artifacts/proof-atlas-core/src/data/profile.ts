import site from "./site.json";

/** The canonical origin lives in site.json so plain Node scripts can read it too. */
export const SITE = {
  url: site.url,
  name: "Anupam Roy · Proof Atlas",
  reviewedAt: "2026-10-25",
} as const;

export const profile = {
  name: "Anupam Roy",
  /** Current job title, as held; the site's positioning copy says "engineer". */
  currentTitle: "AI/ML Analyst",
  employer: "Accenture",
  email: "anupam020202@gmail.com",
  location: "Kolkata, West Bengal",
  thesis: "Difficult problems become understandable systems.",
  headline: "I turn difficult problems into understandable systems.",
  lede:
    "I'm Anupam Roy, an AI/ML engineer building retrieval systems, intelligent applications and dependable software. I work from a problem's constraints toward a system people can understand, inspect and trust.",
  links: {
    github: "https://github.com/Anupam0202/",
    linkedin: "https://www.linkedin.com/in/anupam--roy/",
    codechef: "https://www.codechef.com/users/anupam_roy",
    credly: "https://www.credly.com/users/anupam_roy/",
  },
} as const;

export const OUTCOME_QUALIFIER = "Approximate improvements reported by Anupam; not independently audited.";

export const outcomes = [
  { value: "~20%", label: "turnaround-time reduction" },
  { value: "~50%", label: "lower SME dependency" },
] as const;

export const principles = [
  {
    title: "Constraints first",
    detail: "Start from what the system must never do, what it costs and who has to trust it. The architecture follows from those limits.",
  },
  {
    title: "Retrieve before generating",
    detail: "Ground every answer in evidence that can be shown, cited and checked, and abstain when the evidence is missing.",
  },
  {
    title: "Route before reasoning",
    detail: "Classify the request, then hand it to a bounded specialist instead of asking one model to do everything.",
  },
  {
    title: "Keep humans in control",
    detail: "Make sources, decisions and downstream actions inspectable, and keep review in the loop where mistakes are expensive.",
  },
] as const;

export const education = [
  {
    title: "B.Tech in Computer Science and Engineering",
    institution: "Maulana Abul Kalam Azad University of Technology (MAKAUT), West Bengal",
    college: "Guru Nanak Institute of Technology, Kolkata",
    period: "2018–2022",
    result: "GPA 9.14 / 10",
    coursework: [
      "Data Structures and Algorithms",
      "Operating Systems",
      "Database Management Systems",
      "Computer Networks",
      "Machine Learning",
      "Software Engineering",
      "Distributed Systems",
    ],
  },
  {
    title: "Class XII · Senior Secondary",
    institution: "West Bengal Council of Higher Secondary Education",
    college: "Basirhat Town High School",
    period: "2018",
    result: "73%",
    coursework: [],
  },
  {
    title: "Class X · Secondary",
    institution: "West Bengal Board of Secondary Education",
    college: "Itinda Union High School",
    period: "2016",
    result: "84%",
    coursework: [],
  },
] as const;

export const skillGroups = [
  { title: "AI and retrieval", skills: ["LangGraph", "LangChain", "RAG pipelines", "Hybrid retrieval", "Vector search", "Gemini API", "Prompt design"] },
  { title: "Backend", skills: ["Python", "FastAPI", "Node.js", "Spring Boot", "Core Java", "PostgreSQL", "MongoDB"] },
  { title: "Cloud and delivery", skills: ["AWS", "Azure", "Google Cloud", "Docker", "CI/CD", "Serverless"] },
  { title: "Frontend", skills: ["TypeScript", "React", "Next.js", "Streamlit"] },
  { title: "Quality", skills: ["JUnit", "SonarQube", "Selenium", "UFT", "Karate"] },
] as const;
