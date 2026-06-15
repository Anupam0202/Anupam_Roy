import { motion } from "framer-motion";

const operations = [
  {
    title: "Incident Intelligence",
    description:
      "AI agents classify incidents, retrieve historical resolutions, and generate remediation workflows.",
    impact: "20% Faster TAT",
    target: "#experience",
  },
  {
    title: "Root Cause Analysis Engine",
    description:
      "Correlates observability logs, historical incidents, and semantic retrieval pipelines for contextual RCA.",
    impact: "50% SME Reduction",
    target: "#experience",
  },
  {
    title: "Release Intelligence",
    description:
      "Automatically generates release notes, deployment plans, rollback strategies, and operational summaries.",
    impact: "Production Automation",
    target: "#experience",
  },
  {
    title: "AI Test Generation",
    description:
      "Generates Selenium, UFT, and Karate test suites using enterprise design documentation.",
    impact: "Automated QA",
    target: "#experience",
  },
  {
    title: "SQL Intelligence Engine",
    description:
      "Converts functional requirements into executable SQL while identifying impacted systems.",
    impact: "Data Automation",
    target: "#experience",
  },
  {
    title: "Compliance Intelligence",
    description:
      "Generates audit-ready SOX documentation and anomaly detection intelligence.",
    impact: "Enterprise Governance",
    target: "#experience",
  },
];

export default function OperationsGrid() {
  return (
    <div className="mt-20 grid gap-8 lg:grid-cols-2">
      {operations.map((operation, index) => (
        <motion.div
          key={operation.title}
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, delay: index * 0.08 }}
          whileHover={{ y: -6 }}
          className="glass group relative overflow-hidden rounded-[1.5rem] md:rounded-[2rem] p-8"
          data-testid={`operation-${operation.title.toLowerCase().replace(/\s+/g, "-")}`}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-primary/0 via-transparent to-secondary/0 opacity-0 transition duration-700 group-hover:from-primary/10 group-hover:to-secondary/10 group-hover:opacity-100" />

          <div className="relative z-10">
            <div className="mb-8 flex items-center justify-between">
              <div className="rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs text-primary">
                CAPABILITY
              </div>
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-green-500" />
                <span className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                  PRODUCTION PATTERN
                </span>
              </div>
            </div>

            <h3 className="font-display text-2xl font-bold text-white">
              {operation.title}
            </h3>

            <p className="mt-6 leading-relaxed text-muted-foreground">
              {operation.description}
            </p>

            <div className="mt-10 flex items-center justify-between border-t border-white/10 pt-6">
              <span className="text-sm font-medium text-primary">
                {operation.impact}
              </span>
              <a
                href={operation.target}
                className="text-sm text-muted-foreground transition hover:text-white"
                data-testid={`button-inspect-${operation.title.toLowerCase().replace(/\s+/g, "-")}`}
              >
                Inspect System -&gt;
              </a>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
