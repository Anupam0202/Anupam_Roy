import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight } from "lucide-react";
import GlowOrb from "@/components/shared/glow-orb";
import GridBackground from "@/components/shared/grid-background";
import NeuralParticles from "@/components/shared/neural-particles";
import LiveStatus from "@/components/ui/live-status";
import TelemetryStrip from "@/components/telemetry/telemetry-strip";
import MagneticButton from "@/components/motion/magnetic-button";

const identities = [
  "Building Autonomous AI Systems",
  "Enterprise Retrieval Architect",
  "Multi-Agent Intelligence Engineer",
  "Production GenAI Infrastructure",
  "Cloud-Native AI Systems Builder",
];

const techChips = [
  "LangGraph", "RAG", "Multi-Agent", "Vector Search", "Gemini", "FastAPI", "LangChain",
];

const eventStream = [
  { text: "Incident classified · P1 → ETL latency spike", color: "#F59E0B", tag: "INCIDENT" },
  { text: "RCA generated · 3 historical correlations found", color: "#00F5D4", tag: "RCA" },
  { text: "Release notes deployed · v2.4.1 → staging", color: "#4ADE80", tag: "RELEASE" },
  { text: "Hybrid retrieval completed · 47 chunks ranked", color: "#38BDF8", tag: "RETRIEVAL" },
  { text: "Agent routed · ITSM ticket auto-created", color: "#A78BFA", tag: "AUTOMATION" },
  { text: "SQL engine · impacted tables identified", color: "#F97316", tag: "DATA" },
  { text: "SOX compliance report generated · audit ready", color: "#EC4899", tag: "COMPLIANCE" },
  { text: "Test cases generated · 12 Selenium scripts", color: "#00F5D4", tag: "TESTING" },
];

function LiveOrchestrationCore() {
  const [visibleEvents, setVisibleEvents] = useState<typeof eventStream>([]);
  const idxRef = useRef(0);

  useEffect(() => {
    const interval = setInterval(() => {
      const ev = eventStream[idxRef.current % eventStream.length];
      idxRef.current += 1;
      setVisibleEvents((prev) => [...prev, ev].slice(-4));
    }, 1800);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="glass relative h-full w-full overflow-hidden rounded-[1.5rem] md:rounded-[2rem] border border-white/10">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/8 via-transparent to-secondary/8" aria-hidden="true" />
      <LiveStatus />

      <p className="absolute top-5 left-5 max-w-[12rem] text-[9px] font-mono text-primary/60 tracking-widest uppercase z-10 select-none">
        AI Orchestration Core
      </p>

      {/* Central pulsing orb */}
      <div className="absolute left-1/2 top-[40%] -translate-x-1/2 -translate-y-1/2 flex items-center justify-center z-10" aria-hidden="true">
        <div className="absolute h-56 w-56 rounded-full border border-primary/8" style={{ animation: "pulse 3.6s ease-in-out infinite", animationDelay: "0.6s" }} />
        <div className="absolute h-40 w-40 rounded-full border border-primary/15" style={{ animation: "pulse 2.8s ease-in-out infinite", animationDelay: "0.3s" }} />
        <div className="absolute h-24 w-24 rounded-full border border-primary/40 bg-primary/10" style={{ animation: "pulse 2s ease-in-out infinite" }} />
        <div className="relative z-10 h-24 w-24 rounded-full border border-primary/50 bg-primary/15 backdrop-blur-xl flex flex-col items-center justify-center shadow-[0_0_40px_rgba(0,245,212,0.3)]">
          <div className="absolute inset-3 animate-pulse rounded-full bg-primary/20" />
          <span className="relative z-10 text-[8px] font-display font-bold tracking-[0.2em] text-primary uppercase">CORE</span>
          <span className="relative z-10 text-[7px] text-primary/60 font-mono mt-0.5">ACTIVE</span>
        </div>
      </div>

      {/* Live event stream */}
      <div className="absolute bottom-0 left-0 right-0 p-4 z-10">
        <p className="text-[8px] uppercase tracking-widest text-white/30 font-mono mb-2 select-none">Live Operations</p>
        <div className="flex flex-col gap-1.5 overflow-hidden" style={{ maxHeight: 160 }}>
          <AnimatePresence initial={false}>
            {visibleEvents.map((ev, i) => (
              <motion.div
                key={`${ev.tag}-${i}`}
                initial={{ opacity: 0, x: -10, height: 0 }}
                animate={{ opacity: 1, x: 0, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.25 }}
                className="flex items-center gap-2 rounded-lg bg-black/30 border border-white/5 px-3 py-1.5"
              >
                <span className="text-[8px] font-mono px-1.5 py-0.5 rounded flex-shrink-0" style={{ color: ev.color, backgroundColor: `${ev.color}18` }}>
                  {ev.tag}
                </span>
                <span className="text-[9px] text-white/50 font-mono truncate">{ev.text}</span>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>

      <span className="absolute bottom-4 right-4 text-[9px] font-mono text-muted-foreground/30 tracking-widest z-10 select-none">v2.4.1</span>
    </div>
  );
}

export default function HeroSection() {
  const [identityIdx, setIdentityIdx] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setIdentityIdx((i) => (i + 1) % identities.length);
    }, 2800);
    return () => clearInterval(interval);
  }, []);

  return (
    <section id="hero" className="relative min-h-[100svh] overflow-hidden">
      <GridBackground />
      <NeuralParticles />
      <GlowOrb />

      <div className="relative z-10 mx-auto flex w-[92%] max-w-7xl flex-col items-center justify-between gap-10 pb-8 pt-28 sm:pt-36 md:pb-36 lg:gap-16 lg:flex-row lg:pb-32">

        {/* LEFT — identity */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
          className="w-full max-w-2xl flex-shrink-0"
        >
          {/* Status badge — personal, no employer */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="mb-5 inline-flex items-center gap-2 rounded-full glass px-3 py-1.5 text-[11px] font-medium text-primary tracking-widest uppercase"
          >
            <span className="relative flex h-2 w-2 flex-shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
            </span>
            AI/ML Analyst - Production GenAI Systems
          </motion.div>

          {/* Rotating identity tagline */}
          <div className="mb-3 h-8 overflow-hidden">
            <AnimatePresence mode="wait">
              <motion.p
                key={identityIdx}
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -14 }}
                transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
                className="text-[11px] sm:text-xs font-mono tracking-[0.28em] uppercase text-primary/65"
              >
                {identities[identityIdx]}
              </motion.p>
            </AnimatePresence>
          </div>

          {/* Name + title — hero identity */}
          <h1 className="font-display leading-[1.05] text-white">
            <span className="text-[2.8rem] sm:text-6xl md:text-7xl font-bold block tracking-normal">Anupam Roy</span>
            <span className="text-2xl sm:text-4xl md:text-5xl font-semibold text-gradient block mt-2">AI/ML Analyst</span>
          </h1>

          {/* Skill-focused description — zero employer branding */}
          <p className="mt-6 max-w-xl text-base sm:text-lg leading-relaxed text-muted-foreground">
            I design and ship production-grade AI systems — multi-agent orchestration, enterprise RAG pipelines, and cloud-native intelligence that eliminate manual bottlenecks at scale.
          </p>

          {/* CTAs */}
          <div className="mt-8 flex flex-wrap gap-3 sm:gap-4">
            <MagneticButton>
              <a
                href="#systems"
                data-testid="button-explore-systems"
                className="inline-flex items-center gap-2 rounded-full bg-primary px-6 sm:px-7 py-3.5 sm:py-4 text-sm font-semibold text-black glow transition-all hover:scale-[1.03] hover:shadow-[0_0_80px_rgba(0,245,212,0.25)]"
              >
                Explore Systems
                <ArrowRight className="w-4 h-4" />
              </a>
            </MagneticButton>
            <MagneticButton>
              <a
                href="#certifications"
                data-testid="button-view-certs"
                className="glass inline-flex items-center rounded-full px-6 sm:px-7 py-3.5 sm:py-4 text-sm font-medium transition hover:bg-white/10"
              >
                74 Certifications
              </a>
            </MagneticButton>
          </div>

          {/* Tech stack chips */}
          <div className="mt-8 flex flex-wrap gap-2" aria-label="Core technologies">
            {techChips.map((chip, i) => (
              <span
                key={chip}
                className="text-[10px] px-3 py-1.5 rounded-full border border-primary/15 bg-primary/5 text-primary/60 font-mono tracking-widest uppercase"
                style={{ animation: `float ${3 + (i % 3) * 0.7}s ease-in-out infinite`, animationDelay: `${i * 0.4}s` }}
              >
                {chip}
              </span>
            ))}
          </div>
        </motion.div>

        {/* RIGHT — live orchestration panel (hidden on small mobile, shown tablet+) */}
        <motion.div
          initial={{ opacity: 0, scale: 0.88 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1], delay: 0.15 }}
          className="hidden sm:block relative h-[440px] md:h-[500px] w-full max-w-lg flex-shrink-0"
          style={{ willChange: "transform" }}
        >
          <LiveOrchestrationCore />
        </motion.div>
      </div>

      <TelemetryStrip />
    </section>
  );
}
