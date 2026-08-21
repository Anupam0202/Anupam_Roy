import { motion } from "framer-motion";
import {
  flowEdges,
  flowNodes,
  getFlowNode,
  mobileFlowStages,
} from "./enterprise-flow-model";

const NODE_W = 172;
const NODE_H = 52;
const cx = (node: (typeof flowNodes)[number]) => node.x + NODE_W / 2;
const cy = (node: (typeof flowNodes)[number]) => node.y + NODE_H / 2;

export default function EnterpriseFlow() {
  return (
    <div className="glass mt-12 overflow-hidden rounded-[1.5rem] md:mt-20 md:rounded-[2rem]">
      <div className="flex flex-col items-start justify-between gap-4 border-b border-white/10 px-5 py-5 sm:px-8 sm:py-6 md:flex-row md:items-center">
        <div className="min-w-0">
          <p className="text-xs uppercase text-primary sm:text-xs">
            REFERENCE ARCHITECTURE
          </p>
          <h3 className="mt-2 max-w-xl font-display text-xl font-bold leading-tight text-white sm:mt-3 sm:text-2xl">
            Multi-Agent Operational Intelligence
          </h3>
        </div>
        <div className="flex items-center gap-2.5">
          <span
            className="h-2 w-2 rounded-full bg-primary"
            aria-hidden="true"
          />
          <span className="rounded-full border border-primary/20 bg-primary/10 px-3 py-2 text-xs font-semibold text-primary sm:px-4 sm:text-xs">
            LANGGRAPH ORCHESTRATION MAP
          </span>
        </div>
      </div>

      <ol
        className="px-3 py-5 sm:px-6 sm:py-7 lg:hidden"
        aria-label="Multi-agent operational workflow"
      >
        {mobileFlowStages.map((stage, stageIndex) => (
          <li key={stage.id} data-testid={`mobile-flow-stage-${stage.id}`}>
            <div className="mb-2 flex items-center justify-between gap-3 px-1">
              <div className="flex items-center gap-2">
                <span className="flex h-5 w-5 items-center justify-center rounded-full border border-primary/30 bg-primary/10 font-mono text-xs font-bold text-primary">
                  {stageIndex + 1}
                </span>
                <span className="text-xs font-semibold uppercase text-white/55">
                  {stage.label}
                </span>
              </div>
              <span className="text-xs text-white/32">{stage.description}</span>
            </div>

            <div
              className={`grid gap-1.5 ${
                stage.nodeIds.length === 3
                  ? "grid-cols-3"
                  : stage.nodeIds.length === 2
                    ? "grid-cols-2"
                    : "grid-cols-1"
              }`}
            >
              {stage.nodeIds.map((nodeId) => {
                const node = getFlowNode(nodeId);
                return (
                  <div
                    key={node.id}
                    className={`flex min-h-[66px] items-center justify-center border px-2 py-3 text-center text-xs font-medium leading-snug sm:min-h-[72px] sm:text-xs ${
                      node.highlight
                        ? "border-primary/40 bg-primary/10 text-primary shadow-[0_0_24px_rgba(45,212,191,0.08)]"
                        : "border-white/10 bg-white/[0.04] text-white/72"
                    }`}
                    data-testid={`mobile-flow-node-${node.id}`}
                  >
                    {node.label}
                  </div>
                );
              })}
            </div>

            {stageIndex < mobileFlowStages.length - 1 && (
              <div
                className="flex h-8 items-center justify-center"
                aria-hidden="true"
              >
                <div className="relative h-full w-px bg-primary/35">
                  <span className="absolute -bottom-0.5 -left-[3px] h-2 w-2 rotate-45 border-b border-r border-primary/55" />
                </div>
              </div>
            )}
          </li>
        ))}
      </ol>

      <div className="hidden overflow-hidden px-8 py-10 lg:block">
        <div className="relative mx-auto" style={{ width: 800, height: 460 }}>
          <svg
            className="absolute inset-0 h-full w-full pointer-events-none"
            viewBox="0 0 800 460"
            aria-hidden="true"
          >
            <defs>
              <marker
                id="arrow"
                markerWidth="8"
                markerHeight="8"
                refX="6"
                refY="3"
                orient="auto"
              >
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

            {flowEdges.map((edge) => {
              const src = getFlowNode(edge.from);
              const dst = getFlowNode(edge.to);
              const x1 = cx(src),
                y1 = cy(src) + NODE_H / 2 - 4;
              const x2 = cx(dst),
                y2 = cy(dst) - NODE_H / 2 + 4;
              const mid = (y1 + y2) / 2;
              return (
                <path
                  key={edge.from + edge.to}
                  d={`M${x1},${y1} C${x1},${mid} ${x2},${mid} ${x2},${y2}`}
                  fill="none"
                  stroke="rgba(0,245,212,0.35)"
                  strokeWidth="1.5"
                  strokeDasharray="6 4"
                  markerEnd="url(#arrow)"
                  filter="url(#glow)"
                />
              );
            })}
          </svg>

          {flowNodes.map((node) => (
            <motion.div
              key={node.id}
              initial={false}
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
