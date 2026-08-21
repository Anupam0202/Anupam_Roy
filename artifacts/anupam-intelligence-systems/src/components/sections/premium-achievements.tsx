import { useState } from "react";
import {
  Award,
  CloudCog,
  Code2,
  ExternalLink,
  Image as ImageIcon,
  Sparkles,
  type LucideIcon,
} from "lucide-react";
import { achievements, achievementImages } from "@/data/achievements";
import { SectionHeader } from "./section-header";

const signalStyles: Array<{
  icon: LucideIcon;
  label: string;
  iconClass: string;
  surfaceClass: string;
}> = [
  {
    icon: CloudCog,
    label: "Cloud consistency",
    iconClass: "text-sky-200",
    surfaceClass: "border-sky-300/16 bg-sky-300/[0.045]",
  },
  {
    icon: Award,
    label: "Public credential depth",
    iconClass: "text-amber-200",
    surfaceClass: "border-amber-300/16 bg-amber-300/[0.045]",
  },
  {
    icon: Code2,
    label: "Algorithmic discipline",
    iconClass: "text-primary",
    surfaceClass: "border-primary/18 bg-primary/[0.045]",
  },
];

const recognitionItems = [
  {
    src: achievementImages.credlyBadge,
    alt: "Credly Top Badge Earner 2024 recognition",
    label: "Credly Top Badge Earner 2024",
    type: "badge" as const,
  },
  ...achievementImages.swagPhotos.map((photo, index) => ({
    ...photo,
    label: `Google Cloud Arcade recognition ${String(index + 1).padStart(2, "0")}`,
    type: "photo" as const,
  })),
];

export function PremiumAchievements() {
  const [selectedRecognition, setSelectedRecognition] = useState(0);
  const selected = recognitionItems[selectedRecognition];
  return (
    <section id="achievements" className="py-20 md:py-28">
      <div className="mx-auto w-[92%] max-w-7xl">
        <SectionHeader
          eyebrow="Achievements"
          title="Compounding practice, with visible receipts."
          description="Cloud learning depth, public badge evidence, and competitive-programming discipline—supporting signals rather than substitutes for production work."
        />
        <div className="mt-10 grid gap-5 lg:grid-cols-3">
          {achievements.map((achievement, index) => {
            const visual = signalStyles[index];
            const Icon = visual.icon;
            return (
              <article
                key={achievement.title}
                className={`flex flex-col rounded-[2rem] border p-6 ${visual.surfaceClass}`}
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-black/20">
                    <Icon
                      className={`h-5 w-5 ${visual.iconClass}`}
                      aria-hidden="true"
                    />
                  </span>
                  <span className="text-right text-xs font-semibold uppercase tracking-[0.14em] text-white/40">
                    Signal {String(index + 1).padStart(2, "0")}
                  </span>
                </div>
                <p
                  className={`mt-5 text-xs font-semibold uppercase tracking-[0.16em] ${visual.iconClass}`}
                >
                  {visual.label}
                </p>
                <h3 className="mt-2 font-display text-2xl font-bold text-white">
                  {achievement.title}
                </h3>
                <p className="mt-3 text-sm font-semibold leading-relaxed text-white/82">
                  {achievement.proof}
                </p>
                <p className="mt-3 text-sm leading-relaxed text-white/58">
                  {achievement.summary}
                </p>
                <dl className="mt-5 grid grid-cols-2 gap-2">
                  {achievement.metrics.map((metric) => (
                    <div
                      key={metric.label}
                      className="rounded-2xl border border-white/8 bg-black/20 p-4"
                    >
                      <dd
                        className={`font-display text-2xl font-bold ${visual.iconClass}`}
                      >
                        {metric.value}
                      </dd>
                      <dt className="mt-1 text-xs text-white/48">
                        {metric.label}
                      </dt>
                    </div>
                  ))}
                </dl>
                {!!achievement.links.length && (
                  <div className="mt-auto flex flex-wrap gap-2 pt-5">
                    {achievement.links.map((link) => (
                      <a
                        key={link.href}
                        href={link.href}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex min-h-11 items-center gap-2 rounded-full border border-white/12 bg-black/15 px-4 text-xs font-semibold text-white/68 transition hover:border-white/24 hover:text-white"
                      >
                        {link.label}
                        <ExternalLink className="h-4 w-4" aria-hidden="true" />
                      </a>
                    ))}
                  </div>
                )}
              </article>
            );
          })}
        </div>
        <div className="mt-8 overflow-hidden rounded-[2rem] border border-white/10 bg-[#07110f]/78">
          <div className="flex flex-col gap-3 border-b border-white/9 p-6 md:flex-row md:items-end md:justify-between">
            <div className="flex gap-3">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-primary/20 bg-primary/[0.08] text-primary">
                <Sparkles className="h-5 w-5" aria-hidden="true" />
              </span>
              <div>
                <h3 className="font-display text-2xl font-bold text-white">
                  Recognition ledger
                </h3>
                <p className="mt-1 max-w-2xl text-sm leading-relaxed text-white/54">
                  Select a receipt to inspect the learning-program recognition
                  behind the public achievement signals.
                </p>
              </div>
            </div>
            <span className="self-start rounded-full border border-white/10 px-3 py-1.5 text-xs text-white/48">
              {recognitionItems.length} visual receipts
            </span>
          </div>
          <div className="grid items-start gap-4 p-4 sm:p-6 lg:grid-cols-[minmax(0,1.25fr)_minmax(320px,0.75fr)]">
            <figure className="self-start overflow-hidden rounded-3xl border border-white/9 bg-black/25">
              <div className="flex min-h-[320px] items-center justify-center p-4 sm:min-h-[460px] sm:p-6">
                <img
                  key={selected.src}
                  src={selected.src}
                  alt={selected.alt}
                  className={`max-h-[430px] w-full rounded-2xl ${selected.type === "badge" ? "object-contain" : "object-cover"}`}
                  loading="lazy"
                  decoding="async"
                />
              </div>
              <figcaption className="flex items-center justify-between gap-4 border-t border-white/8 px-5 py-4">
                <div>
                  <p className="text-sm font-semibold text-white">
                    {selected.label}
                  </p>
                  <p className="mt-1 text-xs text-white/42">{selected.alt}</p>
                </div>
                <ImageIcon
                  className="h-5 w-5 shrink-0 text-primary/70"
                  aria-hidden="true"
                />
              </figcaption>
            </figure>
            <div
              className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-2"
              aria-label="Recognition gallery selections"
            >
              {recognitionItems.map((item, index) => {
                const active = selectedRecognition === index;
                return (
                  <button
                    key={item.src}
                    type="button"
                    aria-pressed={active}
                    onClick={() => setSelectedRecognition(index)}
                    className={`group relative min-h-36 overflow-hidden rounded-2xl border bg-black/20 p-2 text-left transition ${active ? "border-primary/45 ring-1 ring-primary/20" : "border-white/9 hover:border-white/22"}`}
                  >
                    <img
                      src={item.src}
                      alt=""
                      className={`h-24 w-full rounded-xl ${item.type === "badge" ? "object-contain" : "object-cover"}`}
                      loading="lazy"
                      decoding="async"
                    />
                    <span
                      className={`mt-2 block text-xs font-semibold leading-snug ${active ? "text-primary" : "text-white/54 group-hover:text-white"}`}
                    >
                      {item.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
