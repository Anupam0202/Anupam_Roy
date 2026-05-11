import { capabilityMap } from "@/data/skills";
import { profile } from "@/data/profile";
import { SectionHeader } from "./section-header";
import { SkillCloud } from "./skill-cloud";

export function PremiumAbout() {
  return (
    <section id="about" className="py-20 md:py-28">
      <div className="mx-auto w-[92%] max-w-7xl">
        <SectionHeader
          eyebrow="About"
          title="Built around operational AI, not generic demos."
          description={profile.narrative}
        />

        <div className="mt-10 grid gap-5 lg:grid-cols-3">
          {capabilityMap.map((capability) => (
            <article key={capability.title} className="rounded-2xl border border-white/8 bg-white/[0.03] p-6">
              <h3 className="font-display text-xl font-semibold text-white">{capability.title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{capability.detail}</p>
            </article>
          ))}
        </div>

        <div className="mt-8">
          <SkillCloud />
        </div>
      </div>
    </section>
  );
}
