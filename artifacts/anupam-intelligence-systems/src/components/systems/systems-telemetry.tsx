import { motion } from "framer-motion";

const telemetry = [
  { label: "Specialist Agents", value: "4" },
  { label: "Enterprise Integrations", value: "6+" },
  { label: "Verified Credentials", value: "74" },
  { label: "Cloud Providers", value: "3" },
];

export default function SystemsTelemetry() {
  return (
    <div className="mt-16 grid grid-cols-2 gap-6 md:grid-cols-4">
      {telemetry.map((item, index) => (
        <motion.div
          key={item.label}
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: index * 0.1 }}
          className="glass group relative overflow-hidden rounded-3xl p-6"
          data-testid={`telemetry-${item.label.toLowerCase().replace(/\s+/g, "-")}`}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-primary/0 to-secondary/0 opacity-0 transition duration-500 group-hover:from-primary/10 group-hover:to-secondary/10 group-hover:opacity-100" />

          <div className="relative z-10">
            <div className="mb-6 flex items-center gap-2">
              <div className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-green-500" />
              </div>
              <span className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                VERIFIED
              </span>
            </div>

            <h3 className="font-display text-5xl font-bold text-white">
              {item.value}
            </h3>
            <p className="mt-3 text-sm text-muted-foreground">{item.label}</p>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
