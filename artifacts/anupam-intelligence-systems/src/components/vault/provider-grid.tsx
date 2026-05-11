import { motion } from "framer-motion";

const providers = [
  {
    name: "Google Cloud",
    certifications: "14",
    specialties: ["ML Engineer", "Cloud Architect", "Data Engineer", "Security"],
    filterKey: "google",
  },
  {
    name: "AWS",
    certifications: "3",
    specialties: ["ML Engineer", "Networking", "Cloud Infrastructure"],
    filterKey: "aws",
  },
  {
    name: "Microsoft Azure",
    certifications: "46",
    specialties: ["Azure AI", "DevOps", "Security", "Architecture"],
    filterKey: "microsoft",
  },
  {
    name: "Snowflake",
    certifications: "7",
    specialties: ["Data Engineering", "Gen AI", "Architecture"],
    filterKey: "snowflake",
  },
  {
    name: "Databricks",
    certifications: "2",
    specialties: ["GenAI", "Data Engineering"],
    filterKey: "databricks",
  },
  {
    name: "Anthropic + MongoDB",
    certifications: "2",
    specialties: ["Claude Architecture", "MongoDB SI", "AI Systems"],
    filterKey: "other",
  },
];

function handleExploreCredentials(filterKey: string) {
  sessionStorage.setItem("cert-filter", filterKey);
  window.dispatchEvent(new CustomEvent("cert-filter-change", { detail: filterKey }));
  const section = document.getElementById("certifications");
  if (section) {
    section.scrollIntoView({ behavior: "smooth" });
  }
}

export default function ProviderGrid() {
  return (
    <div className="mt-20 grid gap-8 lg:grid-cols-2">
      {providers.map((provider, index) => (
        <motion.div
          key={provider.name}
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, delay: index * 0.08 }}
          whileHover={{ y: -6 }}
          className="glass shimmer group relative overflow-hidden rounded-[1.5rem] md:rounded-[2rem] p-8"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-primary/0 via-transparent to-secondary/0 opacity-0 transition duration-700 group-hover:from-primary/10 group-hover:to-secondary/10 group-hover:opacity-100 pointer-events-none" />

          <div className="relative z-10">
            <div className="mb-8 flex items-center justify-between">
              <div>
                <p className="mb-2 text-xs uppercase tracking-[0.3em] text-primary">
                  PROVIDER
                </p>
                <h3 className="font-display text-2xl font-bold text-white">
                  {provider.name}
                </h3>
              </div>
              <div className="rounded-full border border-primary/20 bg-primary/10 px-4 py-2 text-sm font-semibold text-primary">
                {provider.certifications}
              </div>
            </div>

            <div className="flex flex-wrap gap-2.5">
              {provider.specialties.map((specialty) => (
                <div
                  key={specialty}
                  className="rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-sm text-muted-foreground"
                >
                  {specialty}
                </div>
              ))}
            </div>

            <div className="mt-8 flex items-center justify-between border-t border-white/10 pt-6">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-green-500" />
                <span className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                  VERIFIED
                </span>
              </div>
              <button
                onClick={() => handleExploreCredentials(provider.filterKey)}
                className="text-sm text-primary transition hover:text-white"
              >
                Explore Credentials →
              </button>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
