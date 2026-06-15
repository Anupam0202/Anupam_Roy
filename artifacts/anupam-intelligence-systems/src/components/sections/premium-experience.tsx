import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Activity,
  Brain,
  CheckCircle2,
  CloudCog,
  Code2,
  Database,
  GitBranch,
  Layers3,
  ServerCog,
  ShieldCheck,
  Sparkles,
  Timer,
  type LucideIcon,
} from "lucide-react";
import { experience } from "@/data/experience";
import { SectionHeader } from "./section-header";

const roleVisuals: Array<{
  accent: string;
  icon: LucideIcon;
  status: string;
  liveLabel: string;
  signal: string;
}> = [
  {
    accent: "#2dd4bf",
    icon: Sparkles,
    status: "CURRENT",
    liveLabel: "Agentic operations stream",
    signal: "Production AI workflow console",
  },
  {
    accent: "#60a5fa",
    icon: ServerCog,
    status: "FOUNDATION",
    liveLabel: "Engineering delivery stream",
    signal: "Backend and DevOps build console",
  },
];

const experienceEvents = [
  [
    "Classifying operational intent from chat input",
    "Routing request through LangGraph state machine",
    "Retrieving context from ticketing, docs, logs, and data sources",
    "Correlating historical incidents with current telemetry",
    "Drafting resolution steps with source-grounded context",
    "Preparing ITSM payload and operational summary",
  ],
  [
    "Compiling Spring Boot service changes",
    "Running JUnit unit and integration suites",
    "Scanning code quality and dependency risk",
    "Packaging serverless automation component",
    "Promoting CI/CD workflow through build stages",
    "Publishing deployment-ready engineering artifact",
  ],
];

const roleOutcomes = [
  [
    { value: "20%", label: "faster turnaround", icon: Timer },
    { value: "50%", label: "lower SME dependency", icon: Brain },
    { value: "4", label: "specialist agent families", icon: GitBranch },
  ],
  [
    { value: "CI/CD", label: "repeatable delivery", icon: CloudCog },
    { value: "JUnit", label: "regression coverage", icon: CheckCircle2 },
    { value: "SAST", label: "quality controls", icon: ShieldCheck },
  ],
];

const stackGroups: Array<Array<{
  title: string;
  description: string;
  icon: LucideIcon;
  items: string[];
}>> = [
  [
    {
      title: "Agentic AI",
      description: "Multi-agent orchestration and RAG workflow design.",
      icon: Brain,
      items: ["LangChain", "LangGraph", "RAG Pipelines", "Python"],
    },
    {
      title: "Retrieval & Data",
      description: "Structured and unstructured operational knowledge access.",
      icon: Database,
      items: ["MongoDB", "PostgreSQL", "Databricks", "Vector Search", "Semantic Retrieval"],
    },
    {
      title: "Enterprise Integrations",
      description: "APIs and systems used to connect operational workflows.",
      icon: Layers3,
      items: ["Ticketing APIs", "ITSM Automation", "GitHub", "Knowledge Base APIs", "Document Stores", "Observability Logs"],
    },
    {
      title: "Automation",
      description: "Test and workflow automation across release quality gates.",
      icon: ShieldCheck,
      items: ["Selenium", "UFT", "Karate"],
    },
  ],
  [
    {
      title: "Backend Core",
      description: "Java services and serverless execution foundations.",
      icon: Code2,
      items: ["Spring Boot", "Core Java", "AWS Lambda"],
    },
    {
      title: "Delivery Pipeline",
      description: "Repeatable build and deployment workflows.",
      icon: CloudCog,
      items: ["CodeBuild", "CI/CD", "Agile Scrum"],
    },
    {
      title: "Quality Gates",
      description: "Testing, code quality, and dependency risk controls.",
      icon: ShieldCheck,
      items: ["JUnit", "SonarQube", "SourceClear"],
    },
  ],
];

function LiveExperienceConsole({ activeRole }: { activeRole: number }) {
  const [stage, setStage] = useState(0);
  const events = experienceEvents[activeRole];
  const visual = roleVisuals[activeRole];

  useEffect(() => {
    setStage(0);
    const interval = window.setInterval(() => {
      setStage((value) => (value + 1) % events.length);
    }, 1500);
    return () => window.clearInterval(interval);
  }, [activeRole, events.length]);

  return (
    <div className="overflow-hidden rounded-3xl border border-white/10 bg-black/35">
      <div className="flex items-center justify-between border-b border-white/8 px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-[#ff5f57]" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#febc2e]" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#28c840]" />
        </div>
        <span className="text-[10px] uppercase tracking-[0.24em] text-white/35">{visual.liveLabel}</span>
      </div>

      <div className="p-5">
        <div className="mb-5 rounded-2xl border border-white/8 bg-white/[0.025] p-4">
          <div className="mb-2 flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-70" style={{ backgroundColor: visual.accent }} />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full" style={{ backgroundColor: visual.accent }} />
            </span>
            <p className="text-xs font-bold uppercase tracking-[0.22em]" style={{ color: visual.accent }}>
              {visual.signal}
            </p>
          </div>
          <p className="text-sm leading-relaxed text-white/55">
            A representative simulation of the engineering workflow, expressed through public-safe capabilities and technology patterns.
          </p>
        </div>

        <div className="space-y-3">
          {events.map((event, index) => {
            const isActive = index === stage;
            const isDone = index < stage;
            return (
              <motion.div
                key={event}
                animate={{ opacity: isActive || isDone ? 1 : 0.36 }}
                className="flex items-center gap-3 rounded-2xl border border-white/8 bg-white/[0.025] p-3"
              >
                <span
                  className={`flex h-8 w-8 items-center justify-center rounded-xl border ${isActive ? "animate-pulse" : ""}`}
                  style={{
                    borderColor: isActive || isDone ? `${visual.accent}55` : "rgba(255,255,255,0.08)",
                    backgroundColor: isActive || isDone ? `${visual.accent}16` : "rgba(255,255,255,0.03)",
                  }}
                >
                  {isDone ? (
                    <CheckCircle2 className="h-4 w-4" style={{ color: visual.accent }} />
                  ) : (
                    <Activity className="h-4 w-4" style={{ color: isActive ? visual.accent : "rgba(255,255,255,0.25)" }} />
                  )}
                </span>
                <div className="min-w-0 flex-1">
                  <p className={`text-sm ${isActive ? "text-white" : "text-white/55"}`}>{event}</p>
                  {isActive && <p className="mt-0.5 text-[11px] uppercase tracking-[0.2em]" style={{ color: visual.accent }}>processing</p>}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export function PremiumExperience() {
  const [activeRole, setActiveRole] = useState(0);
  const [activeView, setActiveView] = useState<"systems" | "build" | "stack">("systems");
  const role = experience[activeRole];
  const visual = roleVisuals[activeRole];
  const Icon = visual.icon;

  const highlightedBuild = useMemo(() => role.built.slice(0, activeRole === 0 ? 6 : 5), [activeRole, role.built]);

  return (
    <section id="experience" className="border-y border-white/5 bg-white/[0.015] py-20 md:py-28">
      <div className="mx-auto w-[92%] max-w-7xl">
        <SectionHeader
          eyebrow="Experience"
          title="Live experience console, privacy-safe by design."
          description="Production work is explained through architecture, workflow, measurable impact, and technology patterns while keeping the narrative appropriately generic."
        />

        <div className="mt-12 grid gap-4 md:grid-cols-2">
          {experience.map((item, index) => {
            const CurrentIcon = roleVisuals[index].icon;
            const selected = activeRole === index;
            return (
              <button
                key={`${item.company}-${item.role}`}
                onClick={() => {
                  setActiveRole(index);
                  setActiveView("systems");
                }}
                className={`group rounded-3xl border p-5 text-left transition ${
                  selected ? "border-primary/35 bg-primary/[0.07]" : "border-white/8 bg-white/[0.025] hover:border-white/16"
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <span
                    className="flex h-11 w-11 items-center justify-center rounded-2xl border"
                    style={{
                      borderColor: `${roleVisuals[index].accent}35`,
                      backgroundColor: `${roleVisuals[index].accent}12`,
                      color: roleVisuals[index].accent,
                    }}
                  >
                    <CurrentIcon className="h-5 w-5" />
                  </span>
                  <span className={`rounded-full border px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em] ${selected ? "border-primary/35 text-primary" : "border-white/10 text-white/35"}`}>
                    {roleVisuals[index].status}
                  </span>
                </div>
                <p className="mt-5 text-sm font-semibold text-primary">{item.company} - {item.period}</p>
                <h3 className="mt-2 font-display text-2xl font-bold text-white">{item.role}</h3>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{item.positioning}</p>
              </button>
            );
          })}
        </div>

        <AnimatePresence mode="wait">
          <motion.article
            key={role.role}
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.35 }}
            className="mt-8 rounded-[1.75rem] border border-white/8 bg-black/20 p-5 md:p-7"
          >
            <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
              <div className="max-w-3xl">
                <div className="flex items-center gap-3">
                  <span
                    className="flex h-12 w-12 items-center justify-center rounded-2xl border"
                    style={{ borderColor: `${visual.accent}35`, backgroundColor: `${visual.accent}12`, color: visual.accent }}
                  >
                    <Icon className="h-5 w-5" />
                  </span>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.24em]" style={{ color: visual.accent }}>
                      {role.project ?? "Engineering Foundation"}
                    </p>
                    <h3 className="mt-1 font-display text-3xl font-bold text-white">{role.role}</h3>
                  </div>
                </div>
                <p className="mt-5 text-base leading-relaxed text-muted-foreground">{role.type ?? role.positioning}</p>
              </div>

              <div className="grid min-w-[260px] gap-3 sm:grid-cols-3 lg:grid-cols-1">
                {roleOutcomes[activeRole].map((metric) => {
                  const MetricIcon = metric.icon;
                  return (
                    <div key={metric.label} className="rounded-2xl border border-white/8 bg-white/[0.03] p-4">
                      <MetricIcon className="mb-3 h-4 w-4" style={{ color: visual.accent }} />
                      <div className="font-display text-2xl font-bold text-white">{metric.value}</div>
                      <div className="mt-1 text-xs leading-snug text-muted-foreground">{metric.label}</div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="mt-8 flex flex-wrap gap-2">
              {[
                ["systems", activeRole === 0 ? "Architecture Map" : "Engineering Map"],
                ["build", "Build Log"],
                ["stack", "Tech Stack"],
              ].map(([key, label]) => (
                <button
                  key={key}
                  onClick={() => setActiveView(key as "systems" | "build" | "stack")}
                  className={`rounded-full border px-4 py-2 text-sm font-medium transition ${
                    activeView === key ? "border-primary/40 bg-primary/15 text-primary" : "border-white/10 bg-white/[0.03] text-white/55 hover:text-white"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_390px]">
              <AnimatePresence mode="wait">
                <motion.div
                  key={`${role.role}-${activeView}`}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 12 }}
                  transition={{ duration: 0.24 }}
                  className={`rounded-3xl border border-white/8 bg-white/[0.025] p-5 ${activeView === "stack" ? "lg:col-span-2" : "min-h-[360px]"}`}
                >
                  {activeView === "systems" && (
                    <div>
                      <p className="text-xs font-bold uppercase tracking-[0.24em]" style={{ color: visual.accent }}>
                        Capability blocks
                      </p>
                      <div className="mt-5 grid gap-3 sm:grid-cols-2">
                        {role.architectureBlocks.map((block, index) => (
                          <motion.div
                            key={block}
                            initial={{ opacity: 0, y: 12 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: index * 0.04 }}
                            className="rounded-2xl border border-white/8 bg-black/20 p-4"
                          >
                            <div className="mb-3 flex items-center gap-2">
                              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: visual.accent }} />
                              <span className="text-[10px] uppercase tracking-[0.22em] text-white/35">node {String(index + 1).padStart(2, "0")}</span>
                            </div>
                            <p className="text-sm font-semibold text-white">{block}</p>
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  )}

                  {activeView === "build" && (
                    <div>
                      <p className="text-xs font-bold uppercase tracking-[0.24em]" style={{ color: visual.accent }}>
                        What I built
                      </p>
                      <div className="mt-5 space-y-3">
                        {highlightedBuild.map((item) => (
                          <div key={item} className="flex gap-3 rounded-2xl border border-white/8 bg-black/20 p-4 text-sm leading-relaxed text-muted-foreground">
                            <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0" style={{ color: visual.accent }} />
                            <span>{item}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {activeView === "stack" && (
                    <div>
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                        <div>
                          <p className="text-xs font-bold uppercase tracking-[0.24em]" style={{ color: visual.accent }}>
                            Stack signal
                          </p>
                          <h4 className="mt-2 font-display text-2xl font-bold text-white">Capability-first technology map</h4>
                        </div>
                        <span className="w-fit rounded-full border px-3 py-1.5 text-xs font-semibold" style={{ borderColor: `${visual.accent}45`, color: visual.accent, backgroundColor: `${visual.accent}12` }}>
                          {role.stack.length} verified tools
                        </span>
                      </div>

                      <div className="mt-6 grid gap-4 md:grid-cols-2">
                        {stackGroups[activeRole].map((group) => {
                          const GroupIcon = group.icon;
                          return (
                            <div key={group.title} className="rounded-2xl border border-white/8 bg-black/20 p-5">
                              <div className="flex items-start gap-3">
                                <span
                                  className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-2xl border"
                                  style={{ borderColor: `${visual.accent}35`, backgroundColor: `${visual.accent}12`, color: visual.accent }}
                                >
                                  <GroupIcon className="h-4 w-4" />
                                </span>
                                <div>
                                  <h5 className="font-display text-lg font-semibold text-white">{group.title}</h5>
                                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{group.description}</p>
                                </div>
                              </div>

                              <div className="mt-4 flex flex-wrap gap-2">
                                {group.items.map((tech) => (
                                  <span key={tech} className="rounded-full border border-white/10 bg-white/[0.035] px-3 py-1.5 text-xs text-white/72">
                                    {tech}
                                  </span>
                                ))}
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      <div className="mt-5 rounded-2xl border border-white/8 bg-black/20 p-5">
                        <Code2 className="mb-4 h-5 w-5" style={{ color: visual.accent }} />
                        <p className="text-sm leading-relaxed text-muted-foreground">
                          This role is presented through capabilities, engineering decisions, and public-safe technology patterns.
                        </p>
                      </div>
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>

              {activeView !== "stack" && <LiveExperienceConsole activeRole={activeRole} />}
            </div>
          </motion.article>
        </AnimatePresence>
      </div>
    </section>
  );
}
