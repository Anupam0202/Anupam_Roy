import {
  BrainCircuit,
  CloudCog,
  Code2,
  Database,
  ShieldCheck,
  Workflow,
  type LucideIcon,
} from "lucide-react";
import { portfolioMetrics, profile } from "@/data/profile";
import { capabilityMap } from "@/data/skills";
import { SectionHeader } from "./section-header";
import { SkillCloud } from "./skill-cloud";

const operatingLanes: Array<{
  icon: LucideIcon;
  title: string;
  detail: string;
}> = [
  { icon: Database, ...capabilityMap[0] },
  { icon: BrainCircuit, ...capabilityMap[1] },
  { icon: Code2, ...capabilityMap[2] },
];

const deliveryDisciplines: Array<{
  icon: LucideIcon;
  title: string;
  detail: string;
}> = [
  { icon: CloudCog, ...capabilityMap[3] },
  { icon: ShieldCheck, ...capabilityMap[4] },
  { icon: Workflow, ...capabilityMap[5] },
];

export function PremiumAbout() {
  return (
    <section id="about" className="py-20 md:py-28">
      <div className="mx-auto w-[92%] max-w-7xl">
        <SectionHeader
          eyebrow="About / operating thesis"
          title="Built around operational AI, not generic demos."
          description={profile.narrative}
        />
        <div className="mt-10 grid gap-5 lg:grid-cols-12">
          <article className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-[#07110f]/82 p-6 lg:col-span-7 lg:p-8">
            <div
              className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-primary/10 blur-3xl"
              aria-hidden="true"
            />
            <div className="relative">
              <div className="flex items-center gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-2xl border border-primary/25 bg-primary/10 text-primary">
                  <BrainCircuit className="h-5 w-5" aria-hidden="true" />
                </span>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
                    Builder profile
                  </p>
                  <p className="mt-1 text-xs text-white/45">
                    Enterprise context · product discipline · public-safe
                    evidence
                  </p>
                </div>
              </div>
              <p className="mt-7 max-w-3xl font-display text-3xl font-bold leading-tight text-white sm:text-4xl">
                I work at the intersection of retrieval, reasoning, backend
                orchestration, and governed delivery.
              </p>
              <p className="mt-5 max-w-2xl text-base leading-relaxed text-white/66">
                {profile.positioning} The goal is not a clever response—it is a
                reliable system that helps people investigate, decide, and act
                with traceable context.
              </p>
              <div className="mt-8 grid gap-3 sm:grid-cols-3">
                {operatingLanes.map((lane, index) => {
                  const Icon = lane.icon;
                  return (
                    <div
                      key={lane.title}
                      className="rounded-2xl border border-white/9 bg-black/20 p-4"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <Icon
                          className="h-5 w-5 text-primary"
                          aria-hidden="true"
                        />
                        <span className="font-mono text-xs text-white/30">
                          0{index + 1}
                        </span>
                      </div>
                      <h3 className="mt-4 font-display text-base font-bold text-white">
                        {lane.title}
                      </h3>
                      <p className="mt-2 text-xs leading-relaxed text-white/52">
                        {lane.detail}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          </article>
          <aside
            className="grid gap-5 lg:col-span-5"
            aria-label="Portfolio proof"
          >
            <div className="grid grid-cols-2 gap-3">
              {portfolioMetrics.map((metric) => (
                <div
                  key={metric.label}
                  className="rounded-2xl border border-white/9 bg-white/[0.03] p-4 sm:p-5"
                >
                  <div className="font-display text-3xl font-bold text-primary sm:text-4xl">
                    {metric.value}
                  </div>
                  <div className="mt-2 text-sm font-semibold text-white">
                    {metric.label}
                  </div>
                  <p className="mt-1 text-xs leading-relaxed text-white/42">
                    {metric.detail}
                  </p>
                </div>
              ))}
            </div>
            <div className="rounded-[2rem] border border-white/9 bg-white/[0.025] p-5 sm:p-6">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/42">
                Delivery disciplines
              </p>
              <div className="mt-4 grid gap-3">
                {deliveryDisciplines.map((discipline) => {
                  const Icon = discipline.icon;
                  return (
                    <div key={discipline.title} className="flex gap-3">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-primary/18 bg-primary/[0.07] text-primary">
                        <Icon className="h-4 w-4" aria-hidden="true" />
                      </span>
                      <div>
                        <h3 className="text-sm font-semibold text-white">
                          {discipline.title}
                        </h3>
                        <p className="mt-1 text-xs leading-relaxed text-white/48">
                          {discipline.detail}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </aside>
        </div>
        <div className="mt-6">
          <SkillCloud />
        </div>
      </div>
    </section>
  );
}
