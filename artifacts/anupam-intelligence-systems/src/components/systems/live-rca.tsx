import { motion } from "framer-motion";

const steps = [
  { text: "Parsing operational observability logs...", color: "text-muted-foreground" },
  { text: "Correlating historical incidents...", color: "text-muted-foreground" },
  { text: "Running semantic retrieval pipeline...", color: "text-muted-foreground" },
  { text: "Generating contextual remediation workflow...", color: "text-muted-foreground" },
  { text: "Resolution confidence: 94.2%", color: "text-green-400" },
];

export default function LiveRCA() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.8 }}
      className="glass mt-16 rounded-[1.5rem] md:rounded-[2rem] p-8"
    >
      <div className="mb-8 flex items-center justify-between flex-wrap gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-primary">
            RCA CASE STUDY
          </p>
          <h3 className="mt-3 font-display text-3xl font-bold text-white">
            Incident Correlation Pipeline
          </h3>
        </div>
        <div className="rounded-full border border-green-500/20 bg-green-500/10 px-4 py-2 text-xs text-green-400 font-medium tracking-widest">
          EXPLAINED
        </div>
      </div>

      <div className="space-y-5 font-mono text-sm">
        {steps.map((step, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -16 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: i * 0.15 }}
            className={`flex items-center gap-4 ${step.color}`}
          >
            <span className="text-primary shrink-0">&gt;</span>
            {step.text}
            {i === steps.length - 1 && (
              <motion.span
                animate={{ opacity: [1, 0.3, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="inline-block w-2 h-4 bg-green-400 ml-1"
              />
            )}
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
