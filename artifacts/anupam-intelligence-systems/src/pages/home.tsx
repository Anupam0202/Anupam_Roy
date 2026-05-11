import { lazy, Suspense, useState } from "react";
import { AnimatePresence } from "framer-motion";
import Navbar from "@/components/layout/navbar";
import SystemLoader from "@/components/layout/system-loader";
import SystemClock from "@/components/layout/system-clock";
import PageTransition from "@/components/layout/page-transition";
import ScrollProgress from "@/components/layout/scroll-progress";
import CustomCursor from "@/components/layout/custom-cursor";
import HeroSection from "@/components/hero/hero-section";
import SectionDivider from "@/components/shared/section-divider";
import SpatialGlow from "@/components/shared/spatial-glow";
import { PremiumAbout } from "@/components/sections/premium-about";

const AutonomousOperations = lazy(() => import("@/components/systems/autonomous-operations"));
const CertificationsVault = lazy(() => import("@/components/certifications/certifications-vault"));
const ContactForm = lazy(() => import("@/components/contact/contact-form"));
const ConsultSystem = lazy(() => import("@/components/assistant/consult-system"));
const ExecutiveView = lazy(() => import("@/components/sections/executive-view").then((module) => ({ default: module.ExecutiveView })));
const IntelligenceVault = lazy(() => import("@/components/vault/intelligence-vault"));
const OrganizationDashboard = lazy(() => import("@/components/systems/organization-dashboard"));
const PremiumAchievements = lazy(() => import("@/components/sections/premium-achievements").then((module) => ({ default: module.PremiumAchievements })));
const PremiumEducation = lazy(() => import("@/components/sections/premium-education").then((module) => ({ default: module.PremiumEducation })));
const PremiumExperience = lazy(() => import("@/components/sections/premium-experience").then((module) => ({ default: module.PremiumExperience })));
const PremiumProjects = lazy(() => import("@/components/sections/premium-projects").then((module) => ({ default: module.PremiumProjects })));
const PremiumSystems = lazy(() => import("@/components/sections/premium-systems").then((module) => ({ default: module.PremiumSystems })));


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

  return (
    <>
      <SystemLoader />
      <ScrollProgress />
      <CustomCursor />
      <PageTransition>
        <div className="min-h-screen overflow-x-hidden bg-background text-foreground">
          <Navbar executiveOpen={executiveOpen} onToggleExecutive={() => setExecutiveOpen((value) => !value)} />
          <SpatialGlow />
          <SystemClock />
          <HeroSection />
          <SectionDivider />
          <PremiumAbout />
          <SectionDivider />
          <Suspense fallback={<SectionFallback label="Experience" />}>
            <PremiumExperience />
          </Suspense>
          <SectionDivider />
          <Suspense fallback={<SectionFallback label="Operational AI Infrastructure" />}>
            <OrganizationDashboard />
          </Suspense>
          <SectionDivider />
          <Suspense fallback={<SectionFallback label="Autonomous Operations" />}>
            <AutonomousOperations />
          </Suspense>
          <SectionDivider />
          <Suspense fallback={<SectionFallback label="Systems" />}>
            <PremiumSystems />
          </Suspense>
          <SectionDivider />
          <Suspense fallback={<SectionFallback label="Projects" />}>
            <PremiumProjects />
          </Suspense>
          <SectionDivider />
          <Suspense fallback={<SectionFallback label="Intelligence Vault" />}>
            <IntelligenceVault />
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

          <footer className="border-t border-white/5 bg-background py-8">
            <div className="mx-auto flex w-[92%] max-w-7xl flex-col items-center justify-between gap-4 md:flex-row">
              <div className="text-sm font-medium uppercase text-white/40">
                (c) {new Date().getFullYear()} Anupam Roy - Production AI Systems Portfolio
              </div>
              <div className="flex items-center gap-2 text-sm text-white/35">
                <span className="h-2 w-2 rounded-full bg-primary" />
                Recruiter-ready command center
              </div>
            </div>
          </footer>
        </div>
      </PageTransition>

      <AnimatePresence>
        {executiveOpen && (
          <Suspense fallback={null}>
            <ExecutiveView onClose={() => setExecutiveOpen(false)} />
          </Suspense>
        )}
      </AnimatePresence>
    </>
  );
}

