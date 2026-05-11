import { motion } from "framer-motion";

const systems = [
  { name: "Retrieval Infrastructure", status: "BUILT" },
  { name: "AI Agent Orchestration", status: "PRODUCTION" },
  { name: "Cloud Architecture", status: "VERIFIED" },
  { name: "Knowledge Pipelines", status: "DOCUMENTED" },
];

export default function OperationalStatus() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.8 }}
      className="glass mt-16 rounded-[1.5rem] md:rounded-[2rem] p-8"
    >
      <div className="mb-8 flex items-center justify-between flex-wrap gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-primary">
            OPERATIONAL STATUS
          </p>
          <h3 className="mt-3 font-display text-3xl font-bold text-white">
            Portfolio System Map
          </h3>
        </div>
        <div className="rounded-full border border-green-500/20 bg-green-500/10 px-4 py-2 text-xs text-green-400 font-medium tracking-widest">
          VERIFIED BODY OF WORK
        </div>
      </div>

      <div className="space-y-5">
        {systems.map((system, i) => (
          <motion.div
            key={system.name}
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: i * 0.08 }}
            className="flex items-center justify-between border-b border-white/5 pb-5 last:border-0 last:pb-0"
            data-testid={`status-${system.name.toLowerCase().replace(/\s+/g, "-")}`}
          >
            <div className="flex items-center gap-4">
              <div className="relative flex h-3 w-3 shrink-0">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
                <span className="relative inline-flex h-3 w-3 rounded-full bg-green-500" />
              </div>
              <span className="text-muted-foreground">{system.name}</span>
            </div>
            <span className="text-sm font-medium text-primary tracking-wider">
              {system.status}
            </span>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
