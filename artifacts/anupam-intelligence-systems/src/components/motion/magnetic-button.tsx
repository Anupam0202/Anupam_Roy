import { motion, useMotionValue, useSpring } from "framer-motion";
import { ReactNode } from "react";

export default function MagneticButton({ children }: { children: ReactNode }) {
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const springX = useSpring(x, { stiffness: 120, damping: 12 });
  const springY = useSpring(y, { stiffness: 120, damping: 12 });

  function handleMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    x.set((e.clientX - centerX) * 0.25);
    y.set((e.clientY - centerY) * 0.25);
  }

  function reset() {
    x.set(0);
    y.set(0);
  }

  return (
    <motion.div
      style={{ x: springX, y: springY }}
      onMouseMove={handleMouseMove}
      onMouseLeave={reset}
      className="inline-block"
    >
      {children}
    </motion.div>
  );
}
