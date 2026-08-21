import { useEffect, useRef } from "react";
import { X, Mail, ExternalLink } from "lucide-react";
import { motion } from "framer-motion";
import { ALL_CERTS } from "@/data/certifications";
import { experience } from "@/data/experience";
import {
  executiveProofPoints,
  portfolioMetrics,
  profile,
  profileLinks,
} from "@/data/profile";
import { projects } from "@/data/projects";
import { acquirePortfolioShellInert } from "@/lib/modal-a11y";

interface ExecutiveViewProps {
  onClose: () => void;
}

export function ExecutiveView({ onClose }: ExecutiveViewProps) {
  const dialogRef = useRef<HTMLElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const topProjects = projects
    .filter((project) => project.rank !== "archive")
    .slice(0, 3);
  const topCerts = ALL_CERTS.filter((cert) =>
    [
      "ML Engineer - Associate",
      "Professional ML Engineer",
      "Professional Cloud Architect",
      "Generative AI Engineer Associate",
      "Claude Certified Architect - Foundations",
    ].includes(cert.name),
  );

  useEffect(() => {
    const previouslyFocused = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    const releasePageInert = acquirePortfolioShellInert();
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
        return;
      }
      if (event.key !== "Tab" || !dialogRef.current) return;

      const focusable = Array.from(
        dialogRef.current.querySelectorAll<HTMLElement>(
          "button:not([disabled]), a[href]",
        ),
      );
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKeyDown);
      releasePageInert();
      window.requestAnimationFrame(() => previouslyFocused?.focus());
    };
  }, [onClose]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 16 }}
      className="fixed inset-0 z-[220] overflow-hidden bg-black/70 p-3 backdrop-blur-xl md:p-8"
      onWheel={(event) => event.stopPropagation()}
    >
      <section
        ref={dialogRef}
        className="relative mx-auto flex h-full max-h-[calc(100dvh-1.5rem)] max-w-7xl flex-col overflow-hidden rounded-3xl border border-yellow-400/20 bg-[#07110f]/98 shadow-[0_0_90px_rgba(0,0,0,0.9)] md:max-h-[calc(100dvh-4rem)]"
        role="dialog"
        aria-modal="true"
        aria-labelledby="executive-view-title"
      >
        <button
          ref={closeRef}
          onClick={onClose}
          className="absolute right-4 top-4 z-20 flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-black/35 text-white/70 backdrop-blur-xl hover:text-white"
          aria-label="Close executive view"
          type="button"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="h-full overflow-y-auto overscroll-contain p-5 pr-12 md:p-8 md:pr-16">
          <p className="text-xs font-bold uppercase text-yellow-300">
            Executive Hiring Brief
          </p>
          <h2
            id="executive-view-title"
            className="mt-3 max-w-4xl font-display text-4xl font-bold leading-tight text-white md:text-6xl"
          >
            {profile.name}: {profile.headline}
          </h2>
          <p className="mt-5 max-w-3xl text-lg leading-relaxed text-muted-foreground">
            {profile.positioning}
          </p>

          <div className="mt-8 grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
            {portfolioMetrics.map((metric) => (
              <div
                key={metric.label}
                className="rounded-2xl border border-yellow-400/15 bg-yellow-400/[0.06] p-4 md:p-5"
              >
                <div className="font-display text-2xl font-bold text-yellow-300 md:text-3xl">
                  {metric.value}
                </div>
                <div className="mt-1 text-sm text-white">{metric.label}</div>
              </div>
            ))}
          </div>

          <div className="mt-8 grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="rounded-3xl border border-white/8 bg-white/[0.035] p-6">
              <h2 className="font-display text-2xl font-bold text-white">
                Top proof points
              </h2>
              <div className="mt-5 grid gap-3">
                {executiveProofPoints.map((point) => (
                  <div
                    key={point}
                    className="rounded-2xl border border-white/8 bg-black/20 p-4 text-sm leading-relaxed text-muted-foreground"
                  >
                    {point}
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-3xl border border-white/8 bg-white/[0.035] p-6">
              <h2 className="font-display text-2xl font-bold text-white">
                Hiring fit
              </h2>
              <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
                Best aligned to AI/ML Analyst, GenAI Engineer, RAG Engineer, AI
                Platform Engineer, Cloud AI Engineer, or Backend Engineer roles
                where enterprise workflows, retrieval, integrations, and
                production discipline matter.
              </p>
              <div className="mt-5 rounded-2xl border border-primary/15 bg-primary/5 p-4">
                <div className="text-sm font-semibold text-primary">
                  {experience[0].project}
                </div>
                <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                  {experience[0].type}
                </p>
              </div>
            </div>
          </div>

          <div className="mt-6 grid gap-5 lg:grid-cols-3">
            <div className="rounded-3xl border border-white/8 bg-white/[0.03] p-6">
              <h3 className="font-display text-xl font-semibold text-white">
                Top systems
              </h3>
              <div className="mt-4 space-y-3">
                {topProjects.map((project) => (
                  <a
                    key={project.name}
                    href={project.live}
                    target="_blank"
                    rel="noreferrer"
                    className="block rounded-2xl border border-white/8 bg-black/20 p-4 hover:border-primary/30"
                  >
                    <div className="text-sm font-semibold text-white">
                      {project.name}
                    </div>
                    <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                      {project.oneLiner}
                    </p>
                  </a>
                ))}
              </div>
            </div>

            <div className="rounded-3xl border border-white/8 bg-white/[0.03] p-6">
              <h3 className="font-display text-xl font-semibold text-white">
                Selected credential evidence
              </h3>
              <div className="mt-4 space-y-2">
                {topCerts.map((cert) => (
                  <a
                    key={cert.name}
                    href={cert.verify}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-between gap-3 rounded-xl border border-white/8 bg-black/20 px-4 py-3 text-xs text-muted-foreground hover:border-primary/30 hover:text-white"
                  >
                    <span>
                      {cert.provider}: {cert.name}
                    </span>
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                ))}
              </div>
            </div>

            <div className="rounded-3xl border border-primary/20 bg-primary/[0.07] p-6">
              <h3 className="font-display text-xl font-semibold text-white">
                Contact CTA
              </h3>
              <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
                For recruiter screens, architecture discussions, or enterprise
                AI roles, contact directly or use the portfolio form.
              </p>
              <div className="mt-5 flex flex-wrap gap-2">
                {profileLinks.map((link) => (
                  <a
                    key={link.label}
                    href={link.href}
                    target={link.href.startsWith("http") ? "_blank" : undefined}
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs text-white/80 hover:border-primary/30"
                  >
                    {link.label === "Email" && <Mail className="h-3.5 w-3.5" />}
                    {link.label}
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
    </motion.div>
  );
}
