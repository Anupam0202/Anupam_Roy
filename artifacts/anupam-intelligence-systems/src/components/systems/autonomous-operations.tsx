import SectionWrapper from "@/components/layout/section-wrapper";
import SectionHeading from "@/components/shared/section-heading";
import FadeContainer from "@/components/motion/fade-container";
import EnterpriseFlow from "./enterprise-flow";
import LiveRCA from "./live-rca";
import OperationsGrid from "./operations-grid";
import SystemMetadata from "./system-metadata";

export default function AutonomousOperations() {
  return (
    <SectionWrapper className="overflow-hidden border-t border-white/5" id="autonomous-ops">
      <FadeContainer>
        <SectionHeading
          eyebrow="AUTONOMOUS OPERATIONS DIVISION"
          title="Enterprise AI Operational Infrastructure"
          description="Production-grade autonomous AI systems built for enterprise operations, incident intelligence, release management, retrieval orchestration, and operational automation."
        />
      </FadeContainer>

      <EnterpriseFlow />

      <LiveRCA />

      <OperationsGrid />

      <SystemMetadata />
    </SectionWrapper>
  );
}
