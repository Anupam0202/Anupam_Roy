import { motion } from "framer-motion";

const mastery = [
  { domain: "AI Systems Engineering", value: 96 },
  { domain: "Cloud Architecture", value: 94 },
  { domain: "Data Engineering", value: 91 },
  { domain: "Enterprise DevOps", value: 88 },
  { domain: "Security & Compliance", value: 85 },
];

function VaultMetric({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
      <h4 className="font-display text-3xl font-bold text-white">{value}</h4>
      <p className="mt-3 text-sm text-muted-foreground">{label}</p>
    </div>
  );
}

export default function MasteryOverview() {
  return (
    <div className="mt-20 grid gap-8 lg:grid-cols-[0.9fr_1.1fr]">
      {/* Left — capability bars */}
      <div className="glass rounded-[1.5rem] md:rounded-[2rem] p-8">
        <p className="text-xs uppercase tracking-[0.3em] text-primary">
          VERIFIED MASTERY
        </p>
        <h3 className="mt-4 font-display text-3xl font-bold text-white">
          Organizational Capability Matrix
        </h3>

        <div className="mt-10 space-y-7">
          {mastery.map((item, index) => (
            <motion.div
              key={item.domain}
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
            >
              <div className="mb-3 flex items-center justify-between">
                <span className="text-sm text-muted-foreground">{item.domain}</span>
                <span className="text-sm font-medium text-primary">{item.value}%</span>
              </div>
              <div className="h-2.5 overflow-hidden rounded-full bg-white/5">
                <motion.div
                  initial={{ width: 0 }}
                  whileInView={{ width: `${item.value}%` }}
                  viewport={{ once: true }}
                  transition={{ duration: 1.2, delay: index * 0.1, ease: "easeOut" }}
                  className="h-full rounded-full bg-gradient-to-r from-primary via-accent to-secondary"
                />
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Right — intelligence metrics */}
      <div className="glass relative overflow-hidden rounded-[1.5rem] md:rounded-[2rem] p-8">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-secondary/10 pointer-events-none" />
        <div className="relative z-10">
          <div className="mb-8 flex items-center justify-between flex-wrap gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-primary">
                KNOWLEDGE TELEMETRY
              </p>
              <h3 className="mt-4 font-display text-3xl font-bold text-white">
                Intelligence Metrics
              </h3>
            </div>
            <div className="rounded-full border border-primary/20 bg-primary/10 px-4 py-2 text-xs text-primary font-medium tracking-wider">
              VERIFIED
            </div>
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            <VaultMetric value="74" label="Verified Certifications" />
            <VaultMetric value="180+" label="Cloud Badges" />
            <VaultMetric value="Multi-Cloud" label="Infrastructure" />
            <VaultMetric value="Enterprise" label="AI Systems" />
          </div>
        </div>
      </div>
    </div>
  );
}
