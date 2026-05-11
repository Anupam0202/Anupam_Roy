import { motion } from "framer-motion";

const nodes = [
  { id: "1", x: 310, y: 40, label: "Enterprise Query Router", highlight: true },
  { id: "2", x: 60, y: 200, label: "Incident Intelligence", highlight: false },
  { id: "3", x: 310, y: 200, label: "RCA Engine", highlight: false },
  { id: "4", x: 560, y: 200, label: "Release Intelligence", highlight: false },
  { id: "5", x: 60, y: 360, label: "ITSM Automation", highlight: false },
  { id: "6", x: 310, y: 360, label: "Knowledge Retrieval Layer", highlight: true },
  { id: "7", x: 560, y: 360, label: "Compliance Intelligence", highlight: false },
];

const edges = [
  { from: "1", to: "2" }, { from: "1", to: "3" }, { from: "1", to: "4" },
  { from: "2", to: "6" }, { from: "3", to: "6" }, { from: "4", to: "6" },
  { from: "6", to: "5" }, { from: "6", to: "7" },
];

const NODE_W = 172;
const NODE_H = 52;
const cx = (n: typeof nodes[0]) => n.x + NODE_W / 2;
const cy = (n: typeof nodes[0]) => n.y + NODE_H / 2;

function getNode(id: string) {
  return nodes.find((n) => n.id === id)!;
}

export default function EnterpriseFlow() {
  return (
    <div className="glass mt-20 overflow-hidden rounded-[1.5rem] md:rounded-[2rem]">
      <div className="flex items-center justify-between border-b border-white/10 px-8 py-6 flex-wrap gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-primary">
            LIVE ENTERPRISE ARCHITECTURE
          </p>
          <h3 className="mt-3 font-display text-2xl font-bold text-white">
            Multi-Agent Operational Intelligence
          </h3>
        </div>
        <div className="flex items-center gap-3">
          <span className="relative flex h-2 w-2">
            <span className="absolute animate-ping inline-flex h-full w-full rounded-full bg-primary opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
          </span>
          <span className="rounded-full border border-primary/20 bg-primary/10 px-4 py-2 text-xs text-primary font-medium tracking-wider">
            LANGGRAPH ORCHESTRATION ACTIVE
          </span>
        </div>
      </div>

      <div className="overflow-x-auto px-8 py-10">
        <div className="relative mx-auto" style={{ width: 800, height: 460 }}>
          <svg
            className="absolute inset-0 h-full w-full pointer-events-none"
            viewBox="0 0 800 460"
            aria-hidden="true"
          >
            <defs>
              <marker id="arrow" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
                <path d="M0,0 L0,6 L8,3 z" fill="rgba(0,245,212,0.5)" />
              </marker>
              <filter id="glow">
                <feGaussianBlur stdDeviation="2" result="coloredBlur" />
                <feMerge>
                  <feMergeNode in="coloredBlur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            {edges.map((edge, i) => {
              const src = getNode(edge.from);
              const dst = getNode(edge.to);
              const x1 = cx(src), y1 = cy(src) + NODE_H / 2 - 4;
              const x2 = cx(dst), y2 = cy(dst) - NODE_H / 2 + 4;
              const mid = (y1 + y2) / 2;
              return (
                <motion.path
                  key={edge.from + edge.to}
                  d={`M${x1},${y1} C${x1},${mid} ${x2},${mid} ${x2},${y2}`}
                  fill="none"
                  stroke="rgba(0,245,212,0.35)"
                  strokeWidth="1.5"
                  strokeDasharray="6 4"
                  markerEnd="url(#arrow)"
                  filter="url(#glow)"
                  initial={{ pathLength: 0, opacity: 0 }}
                  whileInView={{ pathLength: 1, opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 1.2, delay: i * 0.12 }}
                />
              );
            })}
          </svg>

          {nodes.map((node, i) => (
            <motion.div
              key={node.id}
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.08 }}
              whileHover={{ scale: 1.04, y: -2 }}
              className="absolute flex items-center justify-center text-center text-xs font-medium cursor-default transition-all duration-200"
              style={{
                left: node.x,
                top: node.y,
                width: NODE_W,
                height: NODE_H,
                background: node.highlight
                  ? "rgba(0,245,212,0.08)"
                  : "rgba(255,255,255,0.04)",
                border: node.highlight
                  ? "1px solid rgba(0,245,212,0.4)"
                  : "1px solid rgba(255,255,255,0.1)",
                borderRadius: 16,
                backdropFilter: "blur(20px)",
                boxShadow: node.highlight
                  ? "0 0 30px rgba(0,245,212,0.15)"
                  : "none",
                color: node.highlight ? "#00F5D4" : "#e5e7eb",
                padding: "0 12px",
              }}
              data-testid={`flow-node-${node.id}`}
            >
              {node.label}
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
