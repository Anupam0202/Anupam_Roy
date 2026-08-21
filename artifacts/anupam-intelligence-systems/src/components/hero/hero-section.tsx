import { useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import {
  ArrowRight,
  BrainCircuit,
  CheckCircle2,
  Database,
  Github,
  Mail,
  Play,
  ShieldCheck,
  Workflow,
  type LucideIcon,
} from "lucide-react";
import GridBackground from "@/components/shared/grid-background";

const proof = [
  { value: "~20%", label: "faster operational turnaround" },
  { value: "~50%", label: "lower SME dependency" },
  { value: "74", label: "credential records with issuer proof" },
];
const capabilities = [
  "LangGraph",
  "RAG",
  "Multi-agent systems",
  "Python",
  "Cloud AI",
  "Vector search",
  "Backend engineering",
];
const systemLanes: Array<{
  title: string;
  label: string;
  icon: LucideIcon;
  detail: string;
  evidence: string;
}> = [
  {
    title: "Inputs",
    label: "Operational knowledge",
    icon: Database,
    detail:
      "Tickets, documentation, repositories, observability logs, structured data, and enterprise knowledge sources.",
    evidence: "Jira · Confluence · SharePoint · GitHub · Splunk · SQL",
  },
  {
    title: "Reasoning",
    label: "Grounded orchestration",
    icon: BrainCircuit,
    detail:
      "Intent routing, semantic retrieval, specialist-agent coordination, historical correlation, and source-grounded generation.",
    evidence: "LangGraph · LangChain · RAG · Vector search",
  },
  {
    title: "Action",
    label: "Operational execution",
    icon: Workflow,
    detail:
      "Incident assistance, release intelligence, test generation, ITSM workflows, SQL analysis, and audit-ready reporting.",
    evidence: "ServiceNow · Selenium · UFT · Karate · Python",
  },
  {
    title: "Governance",
    label: "Human-controlled delivery",
    icon: ShieldCheck,
    detail:
      "Public-safe architecture, explicit human review, traceable evidence, quality controls, and bounded automation.",
    evidence: "Human review · Citations · Quality gates · Compliance",
  },
];

interface HeroSectionProps {
  onReplayEntry?: () => void;
}

export default function HeroSection({ onReplayEntry }: HeroSectionProps) {
  const [activeLane, setActiveLane] = useState(1);
  const reducedMotion = useReducedMotion();
  const lane = systemLanes[activeLane];
  const LaneIcon = lane.icon;
  return (
    <section
      id="hero"
      className="relative overflow-hidden pb-20 pt-28 sm:pt-36 lg:min-h-[100svh] lg:pb-24"
    >
      <GridBackground />
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_25%,rgba(45,212,191,0.13),transparent_36%),radial-gradient(circle_at_84%_64%,rgba(56,189,248,0.09),transparent_34%)]"
        aria-hidden="true"
      />
      <div className="relative z-10 mx-auto grid w-[92%] max-w-7xl gap-10 lg:grid-cols-[minmax(0,1.02fr)_minmax(420px,0.98fr)] lg:items-center lg:gap-14">
        <motion.div
          initial={reducedMotion ? false : { opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: reducedMotion ? 0 : 0.65 }}
          className="max-w-3xl"
        >
          <div className="mb-6 inline-flex min-h-10 items-center gap-2 rounded-full border border-primary/25 bg-primary/[0.08] px-4 text-xs font-semibold uppercase tracking-[0.16em] text-primary">
            <span
              className="h-2 w-2 rounded-full bg-primary"
              aria-hidden="true"
            />
            Production AI systems · Public-safe portfolio
          </div>
          <h1 className="font-display text-[2.85rem] font-bold leading-[0.98] text-white sm:text-6xl md:text-7xl">
            <span className="block">Anupam Roy</span>
            <span className="mt-3 block text-gradient">
              Intelligence systems that move work forward.
            </span>
          </h1>
          <p className="mt-7 max-w-2xl text-base leading-relaxed text-white/72 sm:text-lg">
            I build production GenAI systems that turn fragmented operational
            knowledge into grounded decisions, governed actions, and measurable
            support outcomes.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <a
              href="#experience"
              className="inline-flex min-h-12 items-center gap-2 rounded-full bg-primary px-6 text-sm font-bold text-[#03110e] transition hover:bg-[#6ee7d5]"
            >
              Inspect my experience
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </a>
            <a
              href="#projects"
              className="inline-flex min-h-12 items-center rounded-full border border-white/15 bg-white/[0.035] px-6 text-sm font-semibold text-white transition hover:bg-white/[0.07]"
            >
              View selected systems
            </a>
            <a
              href="mailto:anupam020202@gmail.com"
              className="inline-flex min-h-12 items-center gap-2 rounded-full border border-white/15 px-5 text-sm font-semibold text-white/80 transition hover:text-white"
            >
              <Mail className="h-4 w-4" aria-hidden="true" />
              Contact
            </a>
          </div>
          <dl className="mt-9 grid gap-3 sm:grid-cols-3">
            {proof.map((item) => (
              <div
                key={item.label}
                className="rounded-2xl border border-white/10 bg-white/[0.035] p-4"
              >
                <dd className="font-display text-3xl font-bold text-white">
                  {item.value}
                </dd>
                <dt className="mt-2 text-sm leading-snug text-white/65">
                  {item.label}
                </dt>
              </div>
            ))}
          </dl>
          <div
            className="mt-7 flex flex-wrap gap-2"
            aria-label="Core capabilities"
          >
            {capabilities.map((item) => (
              <span
                key={item}
                className="rounded-full border border-white/10 bg-black/15 px-3 py-1.5 text-xs font-medium text-white/70"
              >
                {item}
              </span>
            ))}
          </div>
          {onReplayEntry && (
            <button
              type="button"
              onClick={onReplayEntry}
              className="mt-5 inline-flex min-h-11 items-center gap-2 rounded-full border border-white/10 bg-black/15 px-4 text-xs font-semibold text-white/58 transition hover:border-primary/30 hover:text-primary"
            >
              <Play className="h-4 w-4" aria-hidden="true" />
              Replay opening signal
            </button>
          )}
        </motion.div>
        <motion.aside
          initial={reducedMotion ? false : { opacity: 0, x: 22 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: reducedMotion ? 0 : 0.7 }}
          className="overflow-hidden rounded-[2rem] border border-white/12 bg-[#07110f]/88 shadow-[0_30px_100px_rgba(0,0,0,0.4)]"
          aria-labelledby="system-provenance-title"
        >
          <div className="border-b border-white/10 px-5 py-4 sm:px-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">
                  Signature system map
                </p>
                <h2
                  id="system-provenance-title"
                  className="mt-1 font-display text-2xl font-bold text-white"
                >
                  Systems Provenance Atlas
                </h2>
              </div>
              <span className="rounded-full border border-white/10 bg-white/[0.035] px-3 py-1.5 text-xs text-white/65">
                Representative · not live
              </span>
            </div>
          </div>
          <div className="p-4 sm:p-6">
            <div
              className="grid grid-cols-2 gap-2 sm:grid-cols-4"
              role="tablist"
              aria-label="Operational AI system lanes"
            >
              {systemLanes.map((item, index) => {
                const Icon = item.icon;
                const selected = index === activeLane;
                return (
                  <button
                    key={item.title}
                    type="button"
                    role="tab"
                    aria-selected={selected}
                    aria-controls="system-lane-panel"
                    id={`system-lane-${index}`}
                    onClick={() => setActiveLane(index)}
                    className={`min-h-24 rounded-2xl border p-3 text-left transition ${selected ? "border-primary/45 bg-primary/[0.11] text-white" : "border-white/8 bg-white/[0.025] text-white/60 hover:text-white"}`}
                  >
                    <Icon
                      className={`h-5 w-5 ${selected ? "text-primary" : "text-white/45"}`}
                      aria-hidden="true"
                    />
                    <span className="mt-3 block text-sm font-semibold">
                      {item.title}
                    </span>
                    <span className="mt-1 block text-xs leading-snug text-white/55">
                      {item.label}
                    </span>
                  </button>
                );
              })}
            </div>
            <div
              id="system-lane-panel"
              role="tabpanel"
              aria-labelledby={`system-lane-${activeLane}`}
              className="mt-4 rounded-3xl border border-primary/18 bg-primary/[0.055] p-5 sm:p-6"
            >
              <div className="flex items-start gap-4">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-primary/25 bg-primary/10 text-primary">
                  <LaneIcon className="h-5 w-5" aria-hidden="true" />
                </span>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">
                    {lane.title}
                  </p>
                  <h3 className="mt-1 font-display text-xl font-bold text-white">
                    {lane.label}
                  </h3>
                </div>
              </div>
              <p className="mt-4 text-sm leading-relaxed text-white/72">
                {lane.detail}
              </p>
              <p className="mt-4 border-t border-white/10 pt-4 text-xs leading-relaxed text-white/58">
                {lane.evidence}
              </p>
            </div>
            <div className="mt-4 flex items-start gap-3 rounded-2xl border border-white/8 bg-black/20 p-4">
              <CheckCircle2
                className="mt-0.5 h-4 w-4 shrink-0 text-primary"
                aria-hidden="true"
              />
              <p className="text-xs leading-relaxed text-white/62">
                Client and internal identifiers are intentionally generalized
                while ownership, technology patterns, and reported outcomes
                remain explicit.
              </p>
            </div>
            <a
              href="https://github.com/Anupam0202/"
              target="_blank"
              rel="noreferrer"
              className="mt-5 inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-primary transition hover:text-white"
            >
              <Github className="h-4 w-4" aria-hidden="true" />
              Review public engineering work
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </a>
          </div>
        </motion.aside>
      </div>
    </section>
  );
}
