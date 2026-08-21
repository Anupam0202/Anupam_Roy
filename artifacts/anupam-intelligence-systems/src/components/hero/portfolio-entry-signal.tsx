import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  ArrowRight,
  BrainCircuit,
  Database,
  ShieldCheck,
  Workflow,
  X,
  type LucideIcon,
} from "lucide-react";
import { acquirePortfolioShellInert } from "@/lib/modal-a11y";

interface PortfolioEntrySignalProps {
  open: boolean;
  onClose: () => void;
}

const phases: Array<{
  label: string;
  title: string;
  detail: string;
  icon: LucideIcon;
}> = [
  {
    label: "Identity",
    title: "Production AI builder",
    detail: "GenAI · RAG · Multi-agent systems",
    icon: BrainCircuit,
  },
  {
    label: "Systems",
    title: "From evidence to action",
    detail: "Retrieval · Orchestration · Automation",
    icon: Workflow,
  },
  {
    label: "Proof",
    title: "Measured and inspectable",
    detail: "20% faster · 50% less SME dependency · 74 credentials",
    icon: ShieldCheck,
  },
];

export function PortfolioEntrySignal({
  open,
  onClose,
}: PortfolioEntrySignalProps) {
  const reducedMotion = useReducedMotion();
  const [phase, setPhase] = useState(0);
  const dialogRef = useRef<HTMLDivElement>(null);
  const skipRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    setPhase(0);
    if (reducedMotion) return;
    const phaseTimers = [1, 2].map((next, index) =>
      window.setTimeout(() => setPhase(next), 1_250 + index * 1_250),
    );
    const closeTimer = window.setTimeout(onClose, 4_250);
    return () => {
      phaseTimers.forEach((timer) => window.clearTimeout(timer));
      window.clearTimeout(closeTimer);
    };
  }, [onClose, open, reducedMotion]);

  useEffect(() => {
    if (!open) return;
    const previouslyFocused = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    const releasePageInert = acquirePortfolioShellInert();
    document.body.style.overflow = "hidden";
    const frame = window.requestAnimationFrame(() => skipRef.current?.focus());
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }
      if (event.key !== "Tab" || !dialogRef.current) return;
      const focusable = Array.from(
        dialogRef.current.querySelectorAll<HTMLElement>(
          "button:not([disabled]),a[href]",
        ),
      );
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => {
      window.cancelAnimationFrame(frame);
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
      releasePageInert();
      window.requestAnimationFrame(() => previouslyFocused?.focus());
    };
  }, [onClose, open]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          ref={dialogRef}
          initial={reducedMotion ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: reducedMotion ? 0 : 0.28 }}
          className="fixed inset-0 z-[300] overflow-y-auto bg-[#020706]/98 px-4 py-5 text-white sm:px-8 sm:py-8"
          role="dialog"
          aria-modal="true"
          aria-label="Anupam Roy portfolio introduction"
          aria-describedby="entry-signal-description"
        >
          <div
            className="pointer-events-none absolute inset-0 opacity-70 [background-image:linear-gradient(rgba(45,212,191,0.06)_1px,transparent_1px),linear-gradient(90deg,rgba(45,212,191,0.06)_1px,transparent_1px)] [background-size:52px_52px]"
            aria-hidden="true"
          />
          <div
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_42%,rgba(45,212,191,0.16),transparent_34%),radial-gradient(circle_at_12%_84%,rgba(56,189,248,0.09),transparent_28%)]"
            aria-hidden="true"
          />
          <div className="relative mx-auto flex min-h-[calc(100dvh-2.5rem)] max-w-7xl flex-col rounded-[2rem] border border-white/10 bg-[#06100e]/72 p-5 shadow-[0_30px_120px_rgba(0,0,0,0.75)] backdrop-blur-2xl sm:min-h-[calc(100dvh-4rem)] sm:p-8">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-2xl border border-primary/30 bg-primary/10 text-primary">
                  <BrainCircuit className="h-5 w-5" aria-hidden="true" />
                </span>
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">
                    Portfolio entry signal
                  </p>
                  <p className="mt-1 text-xs text-white/42">
                    Public-safe identity sequence
                  </p>
                </div>
              </div>
              <button
                ref={skipRef}
                type="button"
                onClick={onClose}
                className="inline-flex min-h-11 items-center gap-2 rounded-full border border-white/12 bg-black/20 px-4 text-xs font-semibold text-white/68 transition hover:border-white/24 hover:text-white"
              >
                Skip intro
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
            <div className="my-auto grid items-center gap-10 py-10 lg:grid-cols-[1fr_0.92fr] lg:gap-16">
              <motion.div
                initial={reducedMotion ? false : { opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: reducedMotion ? 0 : 0.5 }}
              >
                <p className="text-sm font-semibold uppercase tracking-[0.24em] text-white/42">
                  Anupam Roy
                </p>
                <p className="mt-4 max-w-4xl font-display text-[2.85rem] font-bold leading-[0.94] sm:text-6xl lg:text-7xl">
                  Engineering intelligence that earns its place in production.
                </p>
                <p
                  id="entry-signal-description"
                  className="mt-6 max-w-2xl text-base leading-relaxed text-white/64 sm:text-lg"
                >
                  A concise opening signal—not a second hero. The full portfolio
                  follows with inspectable experience, systems, projects, and
                  evidence.
                </p>
              </motion.div>
              <div className="rounded-[2rem] border border-white/10 bg-black/25 p-4 sm:p-6">
                <div className="mb-5 flex items-center justify-between gap-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
                    Signal {String(phase + 1).padStart(2, "0")} / 03
                  </p>
                  <span className="rounded-full border border-white/10 px-3 py-1.5 text-xs text-white/46">
                    {reducedMotion ? "Manual mode" : "Auto-advancing"}
                  </span>
                </div>
                <div className="grid gap-3">
                  {phases.map((item, index) => {
                    const Icon = item.icon;
                    const active = phase === index;
                    return (
                      <motion.div
                        key={item.label}
                        animate={
                          reducedMotion
                            ? undefined
                            : { opacity: active ? 1 : 0.52, x: active ? 0 : 4 }
                        }
                        className={`flex gap-4 rounded-2xl border p-4 transition-colors ${active ? "border-primary/35 bg-primary/[0.09]" : "border-white/8 bg-white/[0.02]"}`}
                      >
                        <span
                          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${active ? "bg-primary/14 text-primary" : "bg-white/5 text-white/35"}`}
                        >
                          <Icon className="h-5 w-5" aria-hidden="true" />
                        </span>
                        <div>
                          <p
                            className={`text-xs font-semibold uppercase ${active ? "text-primary" : "text-white/38"}`}
                          >
                            {item.label}
                          </p>
                          <p className="mt-1 font-display text-lg font-bold text-white">
                            {item.title}
                          </p>
                          <p className="mt-1 text-xs leading-relaxed text-white/52">
                            {item.detail}
                          </p>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
                <div className="mt-5 h-1 overflow-hidden rounded-full bg-white/8">
                  <motion.div
                    className="h-full origin-left rounded-full bg-primary"
                    initial={
                      reducedMotion ? { width: "100%" } : { width: "0%" }
                    }
                    animate={{ width: "100%" }}
                    transition={{
                      duration: reducedMotion ? 0 : 4.25,
                      ease: "linear",
                    }}
                  />
                </div>
              </div>
            </div>
            <div className="flex flex-col gap-3 border-t border-white/8 pt-5 sm:flex-row sm:items-center sm:justify-between">
              <p className="flex items-center gap-2 text-xs text-white/40">
                <Database
                  className="h-4 w-4 text-primary/70"
                  aria-hidden="true"
                />
                Client identifiers and proprietary implementation details remain
                private.
              </p>
              <button
                type="button"
                onClick={onClose}
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-primary px-6 text-sm font-bold text-[#03110e] transition hover:bg-[#6ee7d5]"
              >
                Enter portfolio
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
