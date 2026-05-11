import SectionWrapper from "@/components/layout/section-wrapper";
import SectionHeading from "@/components/shared/section-heading";
import FadeContainer from "@/components/motion/fade-container";
import MasteryOverview from "./mastery-overview";
import CapabilityGraph from "./capability-graph";
import ProviderGrid from "./provider-grid";

export default function IntelligenceVault() {
  return (
    <SectionWrapper className="overflow-hidden border-t border-white/5" id="intelligence-vault">
      <FadeContainer>
        <SectionHeading
          eyebrow="INTELLIGENCE VAULT"
          title="Infrastructure & Capability Systems"
          description="A connected ecosystem of AI, cloud, infrastructure, security, DevOps, architecture, and enterprise systems expertise represented through verified certification intelligence."
        />
      </FadeContainer>

      <MasteryOverview />

      <CapabilityGraph />

      <ProviderGrid />
    </SectionWrapper>
  );
}
