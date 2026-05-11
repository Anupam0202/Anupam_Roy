import { motion } from "framer-motion";

const divisions = [
  {
    title: "Autonomous Operations",
    description:
      "Enterprise AI agents automating incident management, RCA, release intelligence, and operational workflows.",
    systems: ["Incident Intelligence", "RCA Engine", "ITSM Automation"],
    target: "#autonomous-ops",
  },
  {
    title: "Project Lab",
    description:
      "One ranked lab for flagship AI systems, RAG builds, ML research, and frontend experiments.",
    systems: ["NexusRAG", "PlantPal", "Computer Vision"],
    target: "#projects",
  },
  {
    title: "Cloud Infrastructure",
    description:
      "Multi-cloud architecture expertise across AWS, Azure, GCP, Databricks, and enterprise DevOps.",
    systems: ["AWS", "Azure", "Google Cloud"],
    target: "#intelligence-vault",
  },
  {
    title: "Mastery Vault",
    description:
      "Verified certification depth across cloud, AI, data, security, DevOps, and enterprise platforms.",
    systems: ["74 Certifications", "180+ Badges", "Multi-cloud"],
    target: "#certifications",
  },
];

export default function DivisionGrid() {
  return (
    <div className="mt-20 grid gap-8 lg:grid-cols-2">
      {divisions.map((division, index) => (
        <motion.div
          key={division.title}
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: index * 0.1 }}
          whileHover={{ y: -6 }}
          className="glass shimmer group relative overflow-hidden rounded-[1.5rem] md:rounded-[2rem] p-8 transition"
          data-testid={`division-${division.title.toLowerCase().replace(/\s+/g, "-")}`}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-primary/0 via-transparent to-secondary/0 opacity-0 transition duration-700 group-hover:from-primary/10 group-hover:to-secondary/10 group-hover:opacity-100" />
          <div className="grid-background absolute inset-0 opacity-10" />

          <div className="relative z-10">
            <div className="mb-8 flex items-start justify-between">
              <div>
                <p className="mb-3 text-xs uppercase tracking-[0.3em] text-primary">
                  DIVISION
                </p>
                <h3 className="font-display text-3xl font-bold text-white">
                  {division.title}
                </h3>
              </div>
              <div className="rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs text-primary shrink-0 ml-4">
                CASE STUDY
              </div>
            </div>

            <p className="max-w-xl leading-relaxed text-muted-foreground">
              {division.description}
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              {division.systems.map((system) => (
                <div
                  key={system}
                  className="rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-sm text-muted-foreground backdrop-blur-xl hover:border-primary/30 hover:text-primary transition-colors duration-300"
                >
                  {system}
                </div>
              ))}
            </div>

            <div className="mt-10 flex items-center justify-between border-t border-white/10 pt-6">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-green-500" />
                <span className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                  SECTION READY
                </span>
              </div>
              <a
                href={division.target}
                className="text-sm text-primary transition hover:text-white"
                data-testid={`button-explore-${division.title.toLowerCase().replace(/\s+/g, "-")}`}
              >
                Explore Division →
              </a>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
