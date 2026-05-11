import { motion } from "framer-motion";

export default function TiltCard({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      whileHover={{ rotateX: 4, rotateY: -4 }}
      transition={{ duration: 0.3 }}
      style={{ transformStyle: "preserve-3d" }}
    >
      {children}
    </motion.div>
  );
}
