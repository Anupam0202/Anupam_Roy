import { motion, useScroll, useSpring } from "framer-motion";

export default function ScrollProgress() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 100, damping: 30 });

  return (
    <motion.div
      style={{ scaleX }}
      className="fixed left-0 top-0 z-[999] h-[2px] w-full origin-left bg-gradient-to-r from-primary via-accent to-secondary"
    />
  );
}
