import { motion } from "framer-motion";

export default function RevealMask({ children }: { children: React.ReactNode }) {
  return (
    <div className="overflow-hidden">
      <motion.div
        initial={{ y: "100%" }}
        whileInView={{ y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
      >
        {children}
      </motion.div>
    </div>
  );
}
