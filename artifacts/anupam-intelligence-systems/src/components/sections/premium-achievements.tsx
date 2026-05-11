import { ExternalLink, Trophy } from "lucide-react";
import { achievements, achievementImages } from "@/data/achievements";
import { SectionHeader } from "./section-header";

export function PremiumAchievements() {
  return (
    <section id="achievements" className="py-20 md:py-28">
      <div className="mx-auto w-[92%] max-w-7xl">
        <SectionHeader
          eyebrow="Achievements"
          title="Earned proof, visible receipts."
          description="Milestones that show consistency: Google Cloud learning depth, public Credly proof, and practical problem-solving discipline."
        />

        <div className="mt-10 grid gap-5 lg:grid-cols-3">
          {achievements.map((achievement, index) => (
            <article key={achievement.title} className="rounded-3xl border border-white/8 bg-white/[0.03] p-6">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-primary/20 bg-primary/10">
                  <Trophy className="h-5 w-5 text-primary" />
                </div>
                <div className="text-xs font-semibold uppercase text-primary">Milestone {index + 1}</div>
              </div>
              <h3 className="mt-5 font-display text-2xl font-bold text-white">{achievement.title}</h3>
              <p className="mt-3 text-sm font-medium text-white/80">{achievement.proof}</p>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{achievement.summary}</p>
              <div className="mt-5 grid gap-2">
                {achievement.metrics.map((metric) => (
                  <div key={metric.label} className="rounded-xl border border-white/8 bg-black/20 p-3">
                    <div className="font-display text-2xl font-bold text-primary">{metric.value}</div>
                    <div className="text-xs text-muted-foreground">{metric.label}</div>
                  </div>
                ))}
              </div>
              <div className="mt-5 flex flex-wrap gap-2">
                {achievement.links.map((link) => (
                  <a key={link.href} href={link.href} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3 py-2 text-xs text-white/70 hover:text-white">
                    {link.label} <ExternalLink className="h-3 w-3" />
                  </a>
                ))}
              </div>
            </article>
          ))}
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-[1fr_1.3fr]">
          <img src={achievementImages.credlyBadge} alt="Credly Top Badge Earner 2024" className="h-full max-h-72 w-full rounded-3xl border border-white/8 object-contain bg-white/[0.03] p-6" />
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
            {achievementImages.swagPhotos.map((photo, index) => (
              <img key={photo} src={photo} alt={`Google Cloud swag proof ${index + 1}`} className="aspect-[4/3] rounded-2xl border border-white/8 object-cover" loading="lazy" />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
