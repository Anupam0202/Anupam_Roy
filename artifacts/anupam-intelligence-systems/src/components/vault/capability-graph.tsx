import { motion } from "framer-motion";

const nodes = [
  "AWS", "Azure", "Google Cloud", "Databricks",
  "Snowflake", "LangGraph", "Gemini", "DevOps",
  "Security", "AI Systems",
];

const W = 600;
const H = 500;
const CX = W / 2;
const CY = H / 2;
const RADIUS = 200;

export default function CapabilityGraph() {
  return (
    <div className="glass relative mt-20 overflow-hidden rounded-[1.5rem] md:rounded-[2rem] p-10">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5 pointer-events-none" />

      <div className="relative z-10">
        <div className="mb-10">
          <p className="text-xs uppercase tracking-[0.3em] text-primary">
            INTELLIGENCE NETWORK
          </p>
          <h3 className="mt-4 font-display text-3xl font-bold text-white">
            Connected Capability Ecosystem
          </h3>
        </div>

        <div className="overflow-x-auto">
          <div className="relative mx-auto" style={{ width: W, height: H }}>
            {/* SVG lines */}
            <svg
              className="absolute inset-0 pointer-events-none"
              width={W}
              height={H}
              aria-hidden="true"
            >
              <defs>
                <filter id="cap-glow">
                  <feGaussianBlur stdDeviation="2.5" result="coloredBlur" />
                  <feMerge>
                    <feMergeNode in="coloredBlur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>
              {nodes.map((_, index) => {
                const angle = (index / nodes.length) * Math.PI * 2 - Math.PI / 2;
                const x = CX + Math.cos(angle) * RADIUS;
                const y = CY + Math.sin(angle) * RADIUS;
                return (
                  <motion.line
                    key={index}
                    x1={CX}
                    y1={CY}
                    x2={x}
                    y2={y}
                    stroke="rgba(0,245,212,0.18)"
                    strokeWidth="1"
                    filter="url(#cap-glow)"
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.07 }}
                  />
                );
              })}
            </svg>

            {/* Central node */}
            <motion.div
              animate={{ scale: [1, 1.07, 1] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              className="absolute z-20 flex items-center justify-center rounded-full border border-primary/30 bg-primary/10 text-center backdrop-blur-xl"
              style={{
                width: 148,
                height: 148,
                left: CX - 74,
                top: CY - 74,
                boxShadow: "0 0 60px rgba(0,245,212,0.12)",
              }}
            >
              <div>
                <p className="font-display text-base font-bold text-primary leading-tight">
                  Autonomous
                  <br />
                  AI Systems
                </p>
              </div>
            </motion.div>

            {/* Outer nodes */}
            {nodes.map((node, index) => {
              const angle = (index / nodes.length) * Math.PI * 2 - Math.PI / 2;
              const x = CX + Math.cos(angle) * RADIUS;
              const y = CY + Math.sin(angle) * RADIUS;
              return (
                <motion.div
                  key={node}
                  initial={{ opacity: 0, scale: 0 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.08, type: "spring", stiffness: 200 }}
                  whileHover={{ scale: 1.1 }}
                  className="absolute z-10 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/10 bg-white/[0.05] px-4 py-2.5 text-xs font-medium text-muted-foreground backdrop-blur-xl cursor-default transition-colors duration-200 hover:border-primary/30 hover:text-white whitespace-nowrap"
                  style={{ left: x, top: y }}
                >
                  {node}
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
