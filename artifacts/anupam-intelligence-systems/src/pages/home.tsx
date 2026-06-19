import { lazy, Suspense, useState } from "react";
import { AnimatePresence } from "framer-motion";
import HybridSynapseLaunch from "@/components/layout/hybrid-synapse-launch";
import Navbar from "@/components/layout/navbar";
import ScrollProgress from "@/components/layout/scroll-progress";
import SystemTimeDock from "@/components/layout/system-time-dock";
import HeroSection from "@/components/hero/hero-section";
import SectionDivider from "@/components/shared/section-divider";
import SpatialGlow from "@/components/shared/spatial-glow";
import { PremiumAbout } from "@/components/sections/premium-about";
import { useIntroSession } from "@/hooks/use-intro-session";
import { useStableHashNavigation } from "@/hooks/use-stable-hash-navigation";

const SystemsArchitecture = lazy(() => import("@/components/systems/autonomous-operations"));
const CertificationsVault = lazy(() => import("@/components/certifications/certifications-vault"));
const ContactForm = lazy(() => import("@/components/contact/contact-form"));
const ConsultSystem = lazy(() => import("@/components/assistant/consult-system"));
const ExecutiveView = lazy(() => import("@/components/sections/executive-view").then((module) => ({ default: module.ExecutiveView })));
const PremiumAchievements = lazy(() => import("@/components/sections/premium-achievements").then((module) => ({ default: module.PremiumAchievements })));
const PremiumEducation = lazy(() => import("@/components/sections/premium-education").then((module) => ({ default: module.PremiumEducation })));
const PremiumExperience = lazy(() => import("@/components/sections/premium-experience").then((module) => ({ default: module.PremiumExperience })));
const PremiumProjects = lazy(() => import("@/components/sections/premium-projects").then((module) => ({ default: module.PremiumProjects })));

function SectionFallback({ label }: { label: string }) {
  return (
    <div className="mx-auto w-[92%] max-w-7xl py-16">
      <div className="rounded-3xl border border-white/8 bg-white/[0.03] p-8 text-sm text-muted-foreground">
        Loading {label}...
      </div>
    </div>
  );
}

export default function Home() {
  const [executiveOpen, setExecutiveOpen] = useState(false);
  const { introOpen, reducedMotion, replayIntro, skipIntro } = useIntroSession();
  useStableHashNavigation();

  return (
    <>
      <ScrollProgress />
      <div className="min-h-screen overflow-x-hidden bg-background text-foreground">
        <Navbar executiveOpen={executiveOpen} onToggleExecutive={() => setExecutiveOpen((value) => !value)} />
        <SpatialGlow />
        <HeroSection />
        <SectionDivider />
        <PremiumAbout />
        <SectionDivider />
        <Suspense fallback={<SectionFallback label="Experience" />}>
          <PremiumExperience />
        </Suspense>
        <SectionDivider />
        <Suspense fallback={<SectionFallback label="Systems" />}>
          <SystemsArchitecture />
        </Suspense>
        <SectionDivider />
        <Suspense fallback={<SectionFallback label="Projects" />}>
          <PremiumProjects />
        </Suspense>
        <SectionDivider />
        <Suspense fallback={<SectionFallback label="Mastery Wall" />}>
          <CertificationsVault />
        </Suspense>
        <SectionDivider />
        <Suspense fallback={<SectionFallback label="Achievements" />}>
          <PremiumAchievements />
        </Suspense>
        <SectionDivider />
        <Suspense fallback={<SectionFallback label="Education" />}>
          <PremiumEducation />
        </Suspense>
        <SectionDivider />
        <Suspense fallback={<SectionFallback label="Contact" />}>
          <ContactForm />
        </Suspense>
        <Suspense fallback={null}>
          <ConsultSystem />
        </Suspense>
        <SystemTimeDock onReplay={replayIntro} />

        <footer className="border-t border-white/5 bg-background pb-24 pt-8 sm:py-8">
          <div className="mx-auto flex w-[92%] max-w-7xl flex-col items-center justify-between gap-4 md:flex-row">
            <div className="text-sm font-medium uppercase text-white/40">
              (c) {new Date().getFullYear()} Anupam Roy - Production AI Systems Portfolio
            </div>
            <div className="flex items-center gap-2 text-sm text-white/35">
              <span className="h-2 w-2 rounded-full bg-primary" />
              Recruiter-ready engineering proof
            </div>
          </div>
        </footer>
      </div>

      <AnimatePresence>
        {introOpen && <HybridSynapseLaunch reducedMotion={reducedMotion} onSkip={skipIntro} />}
        {executiveOpen && (
          <Suspense fallback={null}>
            <ExecutiveView onClose={() => setExecutiveOpen(false)} />
          </Suspense>
        )}
      </AnimatePresence>
    </>
  );
}
