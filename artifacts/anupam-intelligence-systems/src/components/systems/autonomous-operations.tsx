import SectionWrapper from "@/components/layout/section-wrapper";
import SectionHeading from "@/components/shared/section-heading";
import FadeContainer from "@/components/motion/fade-container";
import EnterpriseFlow from "./enterprise-flow";
import LiveRCA from "./live-rca";
import OperationsGrid from "./operations-grid";
import SystemMetadata from "./system-metadata";

export default function AutonomousOperations() {
  return (
    <SectionWrapper
      className="overflow-hidden border-t border-white/5"
      id="systems"
    >
      <FadeContainer>
        <SectionHeading
          eyebrow="SYSTEMS ARCHITECTURE"
          title="From retrieval to operational action."
          description="A capability-led view of multi-agent orchestration, incident intelligence, release workflows, retrieval, automation, and auditable operational AI."
        />
      </FadeContainer>

      <EnterpriseFlow />

      <LiveRCA />

      <OperationsGrid />

      <SystemMetadata />
    </SectionWrapper>
  );
}
