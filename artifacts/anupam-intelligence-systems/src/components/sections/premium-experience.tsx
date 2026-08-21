import { useState, type KeyboardEvent } from "react";
import { motion, useReducedMotion } from "framer-motion";
import {
  Activity,
  Brain,
  CheckCircle2,
  CloudCog,
  Code2,
  Database,
  GitBranch,
  Layers3,
  ShieldCheck,
  Sparkles,
  Target,
  Timer,
  type LucideIcon,
} from "lucide-react";
import { experience } from "@/data/experience";
import { SectionHeader } from "./section-header";
type View = "mission" | "decisions" | "build" | "stack";
const visuals: Array<{
  accent: string;
  icon: LucideIcon;
  status: string;
  descriptor: string;
}> = [
  {
    accent: "#2dd4bf",
    icon: Sparkles,
    status: "Current role",
    descriptor: "Production GenAI and operational intelligence",
  },
  {
    accent: "#60a5fa",
    icon: Code2,
    status: "Engineering foundation",
    descriptor: "Backend, serverless, CI/CD, and quality",
  },
];
const decisions = [
  [
    [
      "Route before reasoning",
      "Classify intent first, then hand work to bounded specialist workflows instead of one monolithic agent.",
    ],
    [
      "Retrieve before generating",
      "Ground responses in evidence from tickets, documentation, repositories, logs, and structured data.",
    ],
    [
      "Design for action",
      "Transform context into incident, release, testing, ITSM, SQL, and compliance artifacts people can review.",
    ],
    [
      "Keep humans in control",
      "Make sources, decisions, and downstream actions inspectable and bounded.",
    ],
  ],
  [
    [
      "Automate repeatable delivery",
      "Use build pipelines and serverless components to reduce manual handoffs.",
    ],
    [
      "Test at service boundaries",
      "Pair unit and integration tests with maintainability and dependency-risk gates.",
    ],
    [
      "Build operational foundations",
      "Use Java services and AWS execution patterns as reliable system foundations.",
    ],
  ],
];
const stackGroups = [
  [
    [
      "Orchestration",
      Brain,
      ["LangChain", "LangGraph", "RAG Pipelines", "Python"],
    ],
    [
      "Retrieval & Data",
      Database,
      [
        "MongoDB",
        "PostgreSQL",
        "Databricks",
        "Vector Search",
        "Semantic Retrieval",
      ],
    ],
    [
      "Enterprise Systems",
      Layers3,
      [
        "Ticketing APIs",
        "ITSM Automation",
        "GitHub",
        "Knowledge APIs",
        "Document Stores",
        "Observability Logs",
      ],
    ],
    ["Automation", ShieldCheck, ["Selenium", "UFT", "Karate"]],
  ],
  [
    ["Backend Core", Code2, ["Spring Boot", "Core Java", "AWS Lambda"]],
    ["Delivery", CloudCog, ["CodeBuild", "CI/CD", "Agile Scrum"]],
    ["Quality", ShieldCheck, ["JUnit", "SonarQube", "SourceClear"]],
  ],
] as const;
const views: Array<{ key: View; label: string; icon: LucideIcon }> = [
  { key: "mission", label: "Mission", icon: Target },
  { key: "decisions", label: "Decision ledger", icon: GitBranch },
  { key: "build", label: "Build log", icon: Activity },
  { key: "stack", label: "Technology", icon: Layers3 },
];
function keyboard(
  e: KeyboardEvent<HTMLButtonElement>,
  index: number,
  total: number,
  activate: (i: number) => void,
) {
  if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(e.key)) return;
  e.preventDefault();
  const next =
    e.key === "Home"
      ? 0
      : e.key === "End"
        ? total - 1
        : e.key === "ArrowRight"
          ? (index + 1) % total
          : (index - 1 + total) % total;
  activate(next);
  requestAnimationFrame(() =>
    e.currentTarget.parentElement
      ?.querySelectorAll<HTMLButtonElement>('[role="tab"]')
      [next]?.focus(),
  );
}
export function PremiumExperience() {
  const [roleIndex, setRoleIndex] = useState(0);
  const [view, setView] = useState<View>("mission");
  const reduced = useReducedMotion();
  const role = experience[roleIndex];
  const visual = visuals[roleIndex];
  const RoleIcon = visual.icon;
  const selectRole = (i: number) => {
    setRoleIndex(i);
    setView("mission");
  };
  return (
    <section
      id="experience"
      className="border-y border-white/5 bg-white/[0.015] py-20 md:py-28"
    >
      <div className="mx-auto w-[92%] max-w-7xl">
        <SectionHeader
          eyebrow="Experience"
          title="Operational AI Flight Recorder"
          description="A public-safe record of missions, architecture decisions, complete build ownership, technology, and outcomes behind my professional work."
        />
        <div className="mt-10 overflow-hidden rounded-[2rem] border border-white/12 bg-[#07110f]/82">
          <div
            className="grid gap-3 border-b border-white/10 p-4 md:grid-cols-2"
            role="tablist"
            aria-label="Professional roles"
          >
            {experience.map((item, i) => {
              const v = visuals[i];
              const Icon = v.icon;
              const active = i === roleIndex;
              return (
                <button
                  key={item.role}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  tabIndex={active ? 0 : -1}
                  onKeyDown={(e) =>
                    keyboard(e, i, experience.length, selectRole)
                  }
                  onClick={() => selectRole(i)}
                  className={`rounded-2xl border p-4 text-left ${active ? "border-white/20 bg-white/[0.075]" : "border-white/8 bg-black/15"}`}
                >
                  <span className="flex gap-3">
                    <span
                      className="flex h-10 w-10 items-center justify-center rounded-xl"
                      style={{
                        color: v.accent,
                        backgroundColor: `${v.accent}14`,
                      }}
                    >
                      <Icon className="h-5 w-5" />
                    </span>
                    <span>
                      <span
                        className="block text-xs font-semibold uppercase"
                        style={{ color: v.accent }}
                      >
                        {v.status}
                      </span>
                      <span className="mt-1 block font-display text-lg font-bold text-white">
                        {item.role}
                      </span>
                      <span className="mt-1 block text-sm text-white/58">
                        {item.company} · {item.period}
                      </span>
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
          <div className="p-4 sm:p-6 lg:p-8" role="tabpanel">
            <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-center">
              <div className="flex gap-4">
                <span
                  className="flex h-12 w-12 items-center justify-center rounded-2xl border"
                  style={{
                    color: visual.accent,
                    borderColor: `${visual.accent}44`,
                    backgroundColor: `${visual.accent}12`,
                  }}
                >
                  <RoleIcon className="h-6 w-6" />
                </span>
                <div>
                  <p
                    className="text-xs font-semibold uppercase"
                    style={{ color: visual.accent }}
                  >
                    {visual.descriptor}
                  </p>
                  <h3 className="mt-1 font-display text-3xl font-bold text-white">
                    {role.role}
                  </h3>
                </div>
              </div>
              <span className="inline-flex items-center gap-2 self-start rounded-full border border-white/10 px-4 py-2 text-xs text-white/62">
                <Timer className="h-4 w-4" />
                {role.period}
              </span>
            </div>
            <div
              className="mt-7 flex gap-2 overflow-x-auto pb-2"
              role="tablist"
              aria-label="Experience views"
            >
              {views.map((tab, i) => {
                const Icon = tab.icon;
                const active = tab.key === view;
                return (
                  <button
                    key={tab.key}
                    type="button"
                    role="tab"
                    aria-selected={active}
                    tabIndex={active ? 0 : -1}
                    onKeyDown={(e) =>
                      keyboard(e, i, views.length, (n) => setView(views[n].key))
                    }
                    onClick={() => setView(tab.key)}
                    className={`inline-flex min-h-11 shrink-0 items-center gap-2 rounded-full border px-4 text-sm font-semibold ${active ? "border-white/22 bg-white/[0.09] text-white" : "border-white/9 text-white/58"}`}
                  >
                    <Icon className="h-4 w-4" />
                    {tab.label}
                  </button>
                );
              })}
            </div>
            <motion.div
              key={`${roleIndex}-${view}`}
              initial={reduced ? false : { opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-5"
            >
              {view === "mission" && (
                <div className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
                  <div className="rounded-3xl border border-white/10 bg-black/20 p-6">
                    <p
                      className="text-xs font-semibold uppercase"
                      style={{ color: visual.accent }}
                    >
                      Mission context
                    </p>
                    <h4 className="mt-3 font-display text-2xl font-bold text-white">
                      {role.project ?? role.role}
                    </h4>
                    {role.type && (
                      <p className="mt-2 text-sm text-white/58">{role.type}</p>
                    )}
                    <p className="mt-5 text-base leading-relaxed text-white/72">
                      {role.positioning}
                    </p>
                    <div className="mt-6 flex flex-wrap gap-2">
                      {role.architectureBlocks.map((x) => (
                        <span
                          key={x}
                          className="rounded-full border border-white/10 px-3 py-2 text-xs text-white/68"
                        >
                          {x}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
                    <p className="text-xs font-semibold uppercase text-white/48">
                      Evidence and outcomes
                    </p>
                    {role.impact?.length ? (
                      <dl className="mt-4 grid gap-3 sm:grid-cols-2">
                        {role.impact.map((x) => (
                          <div
                            key={x.label}
                            className="rounded-2xl border border-white/8 bg-black/20 p-4"
                          >
                            <dd
                              className="font-display text-3xl font-bold"
                              style={{ color: visual.accent }}
                            >
                              {x.value}
                            </dd>
                            <dt className="mt-2 text-sm text-white/60">
                              {x.label}
                            </dt>
                          </div>
                        ))}
                      </dl>
                    ) : (
                      <p className="mt-4 rounded-2xl border border-white/8 p-4 text-sm text-white/65">
                        Service, delivery, testing, and quality foundations for
                        reliable production systems.
                      </p>
                    )}
                    <p className="mt-4 rounded-2xl border border-white/8 p-4 text-sm leading-relaxed text-white/62">
                      Client identifiers, proprietary data, and confidential
                      implementation details are intentionally omitted.
                    </p>
                  </div>
                </div>
              )}
              {view === "decisions" && (
                <ol className="grid gap-4 md:grid-cols-2">
                  {decisions[roleIndex].map(([title, text], i) => (
                    <li
                      key={title}
                      className="rounded-3xl border border-white/10 bg-black/20 p-6"
                    >
                      <div className="flex items-center gap-3">
                        <span
                          className="flex h-9 w-9 items-center justify-center rounded-xl"
                          style={{
                            color: visual.accent,
                            backgroundColor: `${visual.accent}14`,
                          }}
                        >
                          {i + 1}
                        </span>
                        <h4 className="font-display text-lg font-bold text-white">
                          {title}
                        </h4>
                      </div>
                      <p className="mt-4 text-sm leading-relaxed text-white/66">
                        {text}
                      </p>
                    </li>
                  ))}
                </ol>
              )}
              {view === "build" && (
                <ol className="space-y-3">
                  {role.built.map((item, i) => (
                    <li
                      key={item}
                      className="flex gap-4 rounded-2xl border border-white/9 bg-black/20 p-5"
                    >
                      <span
                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-xs"
                        style={{
                          color: visual.accent,
                          backgroundColor: `${visual.accent}14`,
                        }}
                      >
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      <div>
                        <p className="text-sm leading-relaxed text-white/76">
                          {item}
                        </p>
                        <span
                          className="mt-2 inline-flex items-center gap-1 text-xs"
                          style={{ color: visual.accent }}
                        >
                          <CheckCircle2 className="h-4 w-4" />
                          Ownership evidence
                        </span>
                      </div>
                    </li>
                  ))}
                </ol>
              )}
              {view === "stack" && (
                <div className="grid gap-4 md:grid-cols-2">
                  {stackGroups[roleIndex].map(([title, Icon, items]) => (
                    <article
                      key={title}
                      className="rounded-3xl border border-white/10 bg-black/20 p-6"
                    >
                      <div className="flex items-center gap-3">
                        <Icon
                          className="h-5 w-5"
                          style={{ color: visual.accent }}
                        />
                        <h4 className="font-display text-lg font-bold text-white">
                          {title}
                        </h4>
                      </div>
                      <div className="mt-5 flex flex-wrap gap-2">
                        {items.map((x) => (
                          <span
                            key={x}
                            className="rounded-full border border-white/10 px-3 py-2 text-xs text-white/68"
                          >
                            {x}
                          </span>
                        ))}
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}
