import { motion } from "framer-motion";
import { BrainCircuit, Check, Database, Network, ShieldCheck, Sparkles } from "lucide-react";

interface HybridSynapseLaunchProps {
  reducedMotion: boolean;
  onSkip: () => void;
}

const proofSignals = [
  { icon: Network, label: "Portfolio knowledge graph ready", color: "text-primary" },
  { icon: ShieldCheck, label: "Verified mastery vault connected", color: "text-secondary" },
  { icon: Sparkles, label: "Recruiter concierge available", color: "text-accent" },
];

const architectureNodes = [
  { label: "Retrieval", icon: Database, position: "left-0 top-4 sm:left-2" },
  { label: "Agents", icon: Network, position: "right-0 top-4 sm:right-2" },
  { label: "Cloud AI", icon: Sparkles, position: "bottom-0 left-1/2 -translate-x-1/2" },
];

export default function HybridSynapseLaunch({ reducedMotion, onSkip }: HybridSynapseLaunchProps) {
  const transition = reducedMotion ? { duration: 0 } : { duration: 0.42, ease: "easeOut" as const };

  return (
    <motion.div
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={reducedMotion ? { duration: 0 } : { duration: 0.24 }}
      className="fixed inset-0 z-[300] overflow-y-auto bg-[#030b09]/98 text-white"
      aria-label="Portfolio introduction"
      data-hybrid-synapse-launch="true"
    >
      <div
        className="pointer-events-none fixed inset-0 opacity-70"
        aria-hidden="true"
        style={{
          backgroundImage:
            "linear-gradient(rgba(45,212,191,0.045) 1px, transparent 1px), linear-gradient(90deg, rgba(45,212,191,0.045) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
        }}
      />

      <button
        type="button"
        onClick={onSkip}
        className="fixed right-3 top-3 z-10 min-h-11 rounded-full border border-white/12 bg-[#07110f] px-4 text-xs font-semibold text-white/70 transition hover:border-primary/40 hover:text-white sm:right-6 sm:top-6"
      >
        Skip intro
      </button>

      <div className="relative mx-auto grid min-h-[100dvh] w-[92%] max-w-6xl content-center gap-6 py-20 [@media(max-height:650px)]:gap-3 [@media(max-height:650px)]:py-14 sm:gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
        <motion.div
          initial={reducedMotion ? false : { opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={transition}
          className="max-w-2xl"
        >
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/8 px-3 py-2 font-mono text-[10px] font-semibold uppercase text-primary">
            <span className="h-1.5 w-1.5 rounded-full bg-primary" />
            Hybrid Synapse Launch
          </div>
          <p className="font-mono text-[10px] font-semibold uppercase text-white/45 sm:text-xs">
            Production AI systems portfolio
          </p>
          <h1 className="mt-2 font-display text-[2.45rem] font-bold leading-[1.02] sm:text-6xl">Anupam Roy</h1>
          <p className="mt-4 max-w-xl text-sm leading-relaxed text-white/65 sm:text-base">
            Production GenAI, retrieval, multi-agent orchestration, and cloud engineering, assembled as one
            recruiter-readable proof system.
          </p>

          <div className="mt-5 grid gap-2 [@media(max-height:480px)]:mt-3 [@media(max-height:480px)]:grid-cols-3 sm:mt-7">
            {proofSignals.map((signal, index) => (
              <motion.div
                key={signal.label}
                initial={reducedMotion ? false : { opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={reducedMotion ? { duration: 0 } : { duration: 0.28, delay: 0.24 + index * 0.16 }}
                className="flex min-h-11 items-center gap-3 border-l border-white/12 bg-white/[0.025] px-3 py-2 [@media(max-height:480px)]:min-h-10 [@media(max-height:480px)]:gap-2 [@media(max-height:480px)]:px-2 [@media(max-height:480px)]:py-1.5"
              >
                <signal.icon className={`h-4 w-4 shrink-0 ${signal.color}`} />
                <span className="text-xs font-medium text-white/72 [@media(max-height:480px)]:text-[9px] sm:text-sm">{signal.label}</span>
                <Check className="ml-auto h-3.5 w-3.5 text-primary/65 [@media(max-height:480px)]:hidden" />
              </motion.div>
            ))}
          </div>
        </motion.div>

        <motion.div
          initial={reducedMotion ? false : { opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={reducedMotion ? { duration: 0 } : { duration: 0.46, delay: 0.18 }}
          className="relative mx-auto h-[210px] w-full max-w-[330px] [@media(max-height:650px)]:hidden sm:h-[310px] sm:max-w-[440px]"
          aria-label="Production AI capability schematic"
        >
          <div className="absolute inset-x-[17%] top-[43%] h-px bg-primary/30" aria-hidden="true" />
          <div className="absolute bottom-[20%] left-1/2 top-[29%] w-px -translate-x-1/2 bg-accent/25" aria-hidden="true" />
          <div className="absolute left-1/2 top-1/2 z-10 flex h-24 w-24 -translate-x-1/2 -translate-y-1/2 flex-col items-center justify-center border border-primary/45 bg-[#081915] shadow-[0_0_50px_rgba(45,212,191,0.18)] sm:h-32 sm:w-32">
            <BrainCircuit className="h-7 w-7 text-primary sm:h-9 sm:w-9" />
            <span className="mt-2 font-mono text-[9px] font-bold uppercase text-white/75 sm:text-[10px]">Synapse Core</span>
            <span className="mt-1 font-mono text-[8px] uppercase text-primary/65">Portfolio ready</span>
          </div>

          {architectureNodes.map((node, index) => (
            <motion.div
              key={node.label}
              initial={reducedMotion ? false : { opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={reducedMotion ? { duration: 0 } : { duration: 0.28, delay: 0.48 + index * 0.13 }}
              className={`absolute flex min-h-12 min-w-24 items-center justify-center gap-2 border border-white/12 bg-[#07110f] px-3 py-2 ${node.position}`}
            >
              <node.icon className="h-3.5 w-3.5 text-accent" />
              <span className="font-mono text-[9px] font-semibold uppercase text-white/55">{node.label}</span>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </motion.div>
  );
}
