import { motion, useReducedMotion } from "framer-motion";
import { Database, GitBranch, Search, ShieldCheck } from "lucide-react";
const steps = [
  {
    title: "Collect evidence",
    text: "Normalize relevant logs, incident context, runbooks, tickets, and structured operational signals.",
    icon: Database,
  },
  {
    title: "Retrieve precedent",
    text: "Search historical incidents and trusted knowledge sources using semantic and lexical evidence.",
    icon: Search,
  },
  {
    title: "Correlate hypotheses",
    text: "Connect current symptoms to prior patterns, affected systems, and plausible remediation paths.",
    icon: GitBranch,
  },
  {
    title: "Package for review",
    text: "Present sources, confidence boundaries, suggested actions, and unresolved questions to a human operator.",
    icon: ShieldCheck,
  },
];
export default function LiveRCA() {
  const reduced = useReducedMotion();
  return (
    <motion.article
      initial={reduced ? false : { opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="glass mt-16 rounded-[1.5rem] p-6 md:rounded-[2rem] md:p-8"
    >
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <p className="text-xs font-semibold uppercase text-primary">
            RCA decision trace
          </p>
          <h3 className="mt-3 font-display text-3xl font-bold text-white">
            How operational evidence becomes a reviewable hypothesis.
          </h3>
        </div>
        <span className="self-start rounded-full border border-sky-400/25 bg-sky-400/10 px-4 py-2 text-xs font-semibold text-sky-200">
          Representative workflow · not live
        </span>
      </div>
      <ol className="mt-8 grid gap-3 md:grid-cols-2">
        {steps.map((step, i) => {
          const Icon = step.icon;
          return (
            <li
              key={step.title}
              className="rounded-2xl border border-white/9 bg-black/20 p-5"
            >
              <div className="flex gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/[0.08] text-primary">
                  <Icon className="h-5 w-5" />
                </span>
                <div>
                  <p className="text-xs font-semibold uppercase text-primary">
                    Step {String(i + 1).padStart(2, "0")}
                  </p>
                  <h4 className="mt-1 font-display text-lg font-bold text-white">
                    {step.title}
                  </h4>
                </div>
              </div>
              <p className="mt-4 text-sm leading-relaxed text-white/65">
                {step.text}
              </p>
            </li>
          );
        })}
      </ol>
      <div className="mt-4 flex gap-3 rounded-2xl border border-amber-300/18 bg-amber-300/[0.055] p-4">
        <ShieldCheck className="h-5 w-5 shrink-0 text-amber-200" />
        <p className="text-sm text-white/66">
          <b className="text-white">Control point:</b> the system supports
          investigation; it does not claim autonomous root-cause certainty or
          execute remediation without review.
        </p>
      </div>
    </motion.article>
  );
}
