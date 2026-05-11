import { motion } from "framer-motion";
import SectionWrapper from "@/components/layout/section-wrapper";
import SectionHeading from "@/components/shared/section-heading";
import DataStreams from "@/components/shared/data-streams";
import DivisionGrid from "./division-grid";
import SystemsTelemetry from "./systems-telemetry";
import OperationalStatus from "./operational-status";

export default function OrganizationDashboard() {
  return (
    <SectionWrapper className="overflow-hidden" id="dashboard">
      <div className="relative">
        <DataStreams />

        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          <SectionHeading
            eyebrow="ORGANIZATION OVERVIEW"
            title="Operational AI Infrastructure"
            description="A command-center view of the real portfolio: enterprise multi-agent operations, retrieval architectures, cloud infrastructure, and production intelligence systems."
          />
        </motion.div>

        <SystemsTelemetry />

        <DivisionGrid />

        <OperationalStatus />
      </div>
    </SectionWrapper>
  );
}
