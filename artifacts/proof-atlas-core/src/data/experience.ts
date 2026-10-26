/**
 * Professional experience. All statements are owner-reported (source: the
 * owner-authored content of the previous portfolio and the Proof Atlas 3.0
 * brief). Client names, internal system names and proprietary details are
 * intentionally excluded.
 */

export interface Role {
  id: string;
  company: string;
  title: string;
  start: string;
  end: string | null;
  period: string;
  summary: string;
  focus: string;
  systems: string[];
  built: string[];
  technologies: Array<{ group: string; items: string[] }>;
  lessons: Array<{ title: string; detail: string }>;
}

export const roles: Role[] = [
  {
    id: "associate-software-engineer",
    company: "Accenture",
    title: "Associate Software Engineer",
    start: "2022-08",
    end: "2023-11",
    period: "Aug 2022 – Nov 2023",
    summary:
      "Software-engineering foundation across Java microservices, serverless automation, CI/CD, testing and Agile delivery.",
    focus: "Backend services, delivery automation and quality gates",
    systems: ["Java microservices", "AWS Lambda components", "CI/CD pipelines", "Unit and integration testing", "Code-quality gates"],
    built: [
      "Built and deployed Spring Boot and Core Java microservices for enterprise workflows.",
      "Designed AWS Lambda serverless components for event-driven execution.",
      "Implemented CI/CD pipelines with CodeBuild and automated workflows to reduce manual deployment effort.",
      "Developed JUnit unit and integration tests to reduce regression risk.",
      "Enforced SonarQube and SourceClear standards for maintainability and security.",
      "Delivered incremental features in Agile Scrum and contributed build, test and deployment automation scripts.",
    ],
    technologies: [
      { group: "Backend", items: ["Spring Boot", "Core Java", "AWS Lambda"] },
      { group: "Delivery", items: ["CodeBuild", "CI/CD", "Agile Scrum"] },
      { group: "Quality", items: ["JUnit", "SonarQube", "SourceClear"] },
    ],
    lessons: [
      { title: "Automate repeatable delivery", detail: "Use build pipelines and serverless components to remove manual handoffs." },
      { title: "Test at service boundaries", detail: "Pair unit and integration tests with maintainability and dependency-risk gates." },
      { title: "Build operational foundations", detail: "Treat services, pipelines and quality gates as the base every later system stands on." },
    ],
  },
  {
    id: "ai-ml-analyst",
    company: "Accenture",
    title: "AI/ML Analyst",
    start: "2023-12",
    end: null,
    period: "Dec 2023 – present",
    summary:
      "Production GenAI systems for enterprise operations: incidents, problems, releases, testing and support automation, built as a multi-agent platform.",
    focus: "Multi-agent orchestration, enterprise retrieval and operational automation",
    systems: [
      "Multi-agent orchestration",
      "Enterprise knowledge retrieval",
      "Incident and root-cause intelligence",
      "Test generation",
      "Release intelligence",
      "ITSM automation",
      "SQL and system analysis",
      "Compliance reporting",
    ],
    built: [
      "Designed and implemented LangGraph workflows for incident, problem, release and service-request operations.",
      "Implemented dynamic routing based on user intent and semantic retrieval.",
      "Built retrieval over enterprise ticketing, documentation, source-control, observability, database, structured-data and unstructured-document sources.",
      "Created root-cause workflows that correlate logs, historical incidents, runbooks and operational context.",
      "Generated functional test cases and Selenium, UFT and Karate scripts from design documents and existing automation frameworks.",
      "Built release intelligence from commits, release documentation and work items to draft release notes, deployment plans and rollback strategies.",
      "Integrated ITSM ticket creation from chat with structured incident and service-request extraction.",
      "Built SQL and system-analysis workflows that turn functional documents into executable SQL and identify impacted tables.",
      "Generated anomaly-detection and SOX compliance reports with audit-ready documentation.",
      "Built a chat-based operational assistant with MongoDB-backed, context-aware conversations.",
    ],
    technologies: [
      { group: "Orchestration", items: ["LangGraph", "LangChain", "RAG pipelines", "Python"] },
      { group: "Retrieval and data", items: ["MongoDB", "PostgreSQL", "Databricks", "Vector search", "Semantic retrieval"] },
      { group: "Enterprise integration", items: ["Ticketing APIs", "ITSM automation", "Source control", "Knowledge-base APIs", "Document stores", "Observability logs"] },
      { group: "Test automation", items: ["Selenium", "UFT", "Karate"] },
    ],
    lessons: [
      { title: "Route before reasoning", detail: "Classify intent first, then hand work to bounded specialist workflows instead of one monolithic agent." },
      { title: "Retrieve before generating", detail: "Ground responses in evidence from tickets, documentation, repositories, logs and structured data." },
      { title: "Design for action", detail: "Turn context into incident, release, testing, ITSM, SQL and compliance artifacts people can review." },
      { title: "Keep humans in control", detail: "Make sources, decisions and downstream actions inspectable and bounded." },
    ],
  },
];

/** Illustrative architecture shown on the Experience page (not a client diagram). */
export const operationsArchitecture = {
  qualifier:
    "Illustrative architecture based on publicly shareable owner descriptions; not an employer/client production diagram.",
  stages: [
    { id: "sources", label: "Operational sources", detail: "Tickets, documentation, repositories, observability logs, databases and documents." },
    { id: "retrieval", label: "Retrieval", detail: "Semantic and keyword retrieval over the sources, scoped to the request." },
    { id: "orchestration", label: "Agent orchestration", detail: "Intent routing to bounded specialists: incident, problem, release, test, SQL, compliance." },
    { id: "review", label: "Validation / human review", detail: "Sources, confidence limits and proposed actions are shown to a person before anything changes." },
    { id: "action", label: "Workflow action", detail: "Tickets, release notes, test scripts, SQL or reports, produced as reviewable artifacts." },
  ],
} as const;
