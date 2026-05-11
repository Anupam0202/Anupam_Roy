import { motion } from "framer-motion";

interface Metric {
  label: string;
  value: string;
  color: string;
}

const metricDefs: Metric[] = [
  { label: "LangGraph Agents", value: "4", color: "#2DD4BF" },
  { label: "Enterprise Sources", value: "6+", color: "#7DD3FC" },
  { label: "Public Projects", value: "9", color: "#F59E0B" },
  { label: "Verified Certs", value: "74", color: "#4ADE80" },
  { label: "Cloud & AI Badges", value: "180+", color: "#F97316" },
  { label: "Cloud Providers", value: "3", color: "#A78BFA" },
];

function LiveMetric({ metric, index }: { metric: Metric; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 1.3 + index * 0.08 }}
      data-testid={`stat-${metric.label.toLowerCase().replace(/\s+/g, "-")}`}
    >
      <h3
        className="font-display text-xl font-bold transition-colors duration-300"
        style={{ color: metric.color }}
      >
        {metric.value}
      </h3>
      <p className="mt-1 text-xs text-muted-foreground">{metric.label}</p>
    </motion.div>
  );
}

export default function TelemetryStrip() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 1.2, duration: 0.8 }}
      className="relative mt-8 w-full border-t border-white/8 bg-black/30 backdrop-blur-xl md:absolute md:bottom-0 md:left-0 md:mt-0"
    >
      <div className="mx-auto grid max-w-7xl grid-cols-2 gap-5 px-6 py-5 sm:grid-cols-3 md:grid-cols-6 md:gap-6 md:py-6 w-[92%]">
        {metricDefs.map((metric, i) => (
          <LiveMetric key={metric.label} metric={metric} index={i} />
        ))}
      </div>
    </motion.div>
  );
}
