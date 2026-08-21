import { education } from "@/data/education";
import { SectionHeader } from "./section-header";

export function PremiumEducation() {
  return (
    <section
      id="education"
      className="border-y border-white/5 bg-white/[0.015] py-16 md:py-20"
    >
      <div className="mx-auto w-[92%] max-w-7xl">
        <SectionHeader
          eyebrow="Education"
          title="Computer science foundation."
          description="Kept compact on purpose: the portfolio leads with production systems, then backs it with formal CS fundamentals."
        />

        <div className="mt-8 grid gap-4 lg:grid-cols-3">
          {education.map((item) => (
            <article
              key={item.title}
              className="rounded-2xl border border-white/8 bg-white/[0.03] p-5"
            >
              <div className="text-xs font-semibold text-primary">
                {item.period}
              </div>
              <h3 className="mt-2 font-display text-xl font-semibold text-white">
                {item.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {item.institution}
              </p>
              <div className="mt-4 rounded-xl border border-primary/15 bg-primary/5 px-3 py-2 text-sm font-semibold text-primary">
                {item.result}
              </div>
              {item.details.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {item.details.map((detail) => (
                    <span
                      key={detail}
                      className="rounded-full border border-white/10 bg-black/20 px-3 py-1 text-xs text-white/65"
                    >
                      {detail}
                    </span>
                  ))}
                </div>
              )}
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
