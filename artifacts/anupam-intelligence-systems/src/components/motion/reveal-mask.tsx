import { motion, useReducedMotion } from "framer-motion";
import type { ReactNode } from "react";

type RevealMaskProps = {
  children: ReactNode;
  delay?: number;
};

export default function RevealMask({ children, delay = 0 }: RevealMaskProps) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <div className="overflow-hidden">
      <motion.div
        initial={shouldReduceMotion ? false : { y: "100%" }}
        whileInView={{ y: 0 }}
        viewport={{ once: true }}
        transition={{
          duration: shouldReduceMotion ? 0 : 1,
          delay: shouldReduceMotion ? 0 : delay,
          ease: [0.22, 1, 0.36, 1],
        }}
      >
        {children}
      </motion.div>
    </div>
  );
}
