import { Suspense, useCallback, useState, type ReactNode } from "react";
import { AnimatePresence } from "framer-motion";
import {
  ErrorBoundary,
  SectionBoundary,
} from "@/components/errors/error-boundary";
import Navbar from "@/components/layout/navbar";
import ScrollProgress from "@/components/layout/scroll-progress";
import HeroSection from "@/components/hero/hero-section";
import { PortfolioEntrySignal } from "@/components/hero/portfolio-entry-signal";
import SectionDivider from "@/components/shared/section-divider";
import SpatialGlow from "@/components/shared/spatial-glow";
import { PremiumAbout } from "@/components/sections/premium-about";
import { useStableHashNavigation } from "@/hooks/use-stable-hash-navigation";
import { lazyWithRetry } from "@/lib/lazy-with-retry";
import {
  markEntrySignalSeen,
  readEntrySignalSeen,
  shouldAutoOpenEntrySignal,
} from "@/lib/entry-signal";
const SystemsArchitecture = lazyWithRetry(
  () => import("@/components/systems/autonomous-operations"),
);
const CertificationsVault = lazyWithRetry(
  () => import("@/components/certifications/certifications-vault"),
);
const ContactForm = lazyWithRetry(
  () => import("@/components/contact/contact-form"),
);
const ConsultSystem = lazyWithRetry(
  () => import("@/components/assistant/consult-system"),
);
const ExecutiveView = lazyWithRetry(() =>
  import("@/components/sections/executive-view").then((m) => ({
    default: m.ExecutiveView,
  })),
);
const PremiumAchievements = lazyWithRetry(() =>
  import("@/components/sections/premium-achievements").then((m) => ({
    default: m.PremiumAchievements,
  })),
);
const PremiumEducation = lazyWithRetry(() =>
  import("@/components/sections/premium-education").then((m) => ({
    default: m.PremiumEducation,
  })),
);
const PremiumExperience = lazyWithRetry(() =>
  import("@/components/sections/premium-experience").then((m) => ({
    default: m.PremiumExperience,
  })),
);
const PremiumProjects = lazyWithRetry(() =>
  import("@/components/sections/premium-projects").then((m) => ({
    default: m.PremiumProjects,
  })),
);
function Fallback({ label }: { label: string }) {
  return (
    <div className="mx-auto w-[92%] max-w-7xl py-16">
      <div
        className="rounded-3xl border border-white/10 bg-white/[0.035] p-8 text-sm text-white/70"
        role="status"
      >
        Loading {label}…
      </div>
    </div>
  );
}
function ResilientSection({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <SectionBoundary label={label}>
      <Suspense fallback={<Fallback label={label} />}>{children}</Suspense>
    </SectionBoundary>
  );
}

function getSessionStorage() {
  try {
    return window.sessionStorage;
  } catch {
    return null;
  }
}

function getInitialEntrySignalState() {
  if (typeof window === "undefined") return false;
  return shouldAutoOpenEntrySignal({
    hash: window.location.hash,
    reducedMotion: window.matchMedia("(prefers-reduced-motion: reduce)")
      .matches,
    seen: readEntrySignalSeen(getSessionStorage()),
  });
}

export default function Home() {
  const [executiveOpen, setExecutiveOpen] = useState(false);
  const [entrySignalOpen, setEntrySignalOpen] = useState(
    getInitialEntrySignalState,
  );
  const closeEntrySignal = useCallback(() => {
    markEntrySignalSeen(getSessionStorage());
    setEntrySignalOpen(false);
  }, []);
  useStableHashNavigation(true);
  return (
    <>
      <div data-portfolio-shell>
        <a className="skip-link" href="#main-content">
          Skip to main content
        </a>
        <ScrollProgress />
        <div className="min-h-screen bg-background text-foreground">
          <Navbar
            executiveOpen={executiveOpen}
            onToggleExecutive={() => setExecutiveOpen((v) => !v)}
          />
          <SpatialGlow />
          <main id="main-content" tabIndex={-1}>
            <SectionBoundary label="Hero">
              <HeroSection onReplayEntry={() => setEntrySignalOpen(true)} />
            </SectionBoundary>
            <SectionDivider />
            <SectionBoundary label="About">
              <PremiumAbout />
            </SectionBoundary>
            <SectionDivider />
            <ResilientSection label="Experience">
              <PremiumExperience />
            </ResilientSection>
            <SectionDivider />
            <ResilientSection label="Systems">
              <SystemsArchitecture />
            </ResilientSection>
            <SectionDivider />
            <ResilientSection label="Projects">
              <PremiumProjects />
            </ResilientSection>
            <SectionDivider />
            <ResilientSection label="Mastery Wall">
              <CertificationsVault />
            </ResilientSection>
            <SectionDivider />
            <ResilientSection label="Achievements">
              <PremiumAchievements />
            </ResilientSection>
            <SectionDivider />
            <ResilientSection label="Education">
              <PremiumEducation />
            </ResilientSection>
            <SectionDivider />
            <ResilientSection label="Contact">
              <ContactForm />
            </ResilientSection>
          </main>
          <ErrorBoundary scope="assistant" fallback={null}>
            <Suspense fallback={null}>
              <ConsultSystem />
            </Suspense>
          </ErrorBoundary>
          <footer className="border-t border-white/8 bg-background py-10">
            <div className="mx-auto flex w-[92%] max-w-7xl flex-col items-center justify-between gap-4 md:flex-row">
              <p className="text-sm font-medium text-white/60">
                © {new Date().getFullYear()} Anupam Roy · Intelligence Systems
                Portfolio
              </p>
              <div className="flex gap-5 text-sm">
                <a
                  className="text-primary"
                  href="mailto:anupam020202@gmail.com"
                >
                  Email
                </a>
                <a
                  className="text-white/65"
                  href="https://github.com/Anupam0202/"
                  target="_blank"
                  rel="noreferrer"
                >
                  GitHub
                </a>
                <a
                  className="text-white/65"
                  href="https://www.linkedin.com/in/anupam--roy/"
                  target="_blank"
                  rel="noreferrer"
                >
                  LinkedIn
                </a>
              </div>
            </div>
          </footer>
        </div>
      </div>
      <AnimatePresence>
        {executiveOpen && (
          <ErrorBoundary scope="executive-view" fallback={null}>
            <Suspense fallback={null}>
              <ExecutiveView onClose={() => setExecutiveOpen(false)} />
            </Suspense>
          </ErrorBoundary>
        )}
      </AnimatePresence>
      <PortfolioEntrySignal open={entrySignalOpen} onClose={closeEntrySignal} />
    </>
  );
}
