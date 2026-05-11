import { capabilityMap } from "@/data/skills";
import { SectionHeader } from "./section-header";

const systemFlow = ["Intent", "Router", "Retriever", "Agent", "Action", "Audit"];

export function PremiumSystems() {
  return (
    <section id="systems" className="py-20 md:py-28">
      <div className="mx-auto w-[92%] max-w-7xl">
        <SectionHeader
          eyebrow="Systems"
          title="A capability map for production AI systems."
          description="This section connects the Accenture experience and public projects into one operating model: retrieval, orchestration, backend APIs, cloud delivery, and governance."
        />

        <div className="mt-10 rounded-3xl border border-white/8 bg-white/[0.03] p-5 md:p-8">
          <div className="grid gap-3 md:grid-cols-6">
            {systemFlow.map((step, index) => (
              <div key={step} className="relative rounded-2xl border border-primary/15 bg-primary/[0.045] p-4 text-center">
                <div className="font-display text-2xl font-bold text-primary">{String(index + 1).padStart(2, "0")}</div>
                <div className="mt-2 text-sm font-semibold text-white">{step}</div>
              </div>
            ))}
          </div>
          <p className="mt-5 text-sm leading-relaxed text-muted-foreground">
            A recruiter can read this as the operating pattern behind the work: classify the problem, retrieve trusted context, route to the right agent, execute the workflow, and leave an auditable trail.
          </p>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {capabilityMap.map((capability) => (
            <article key={capability.title} className="rounded-2xl border border-white/8 bg-black/20 p-6">
              <h3 className="font-display text-xl font-semibold text-white">{capability.title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{capability.detail}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
