import { motion } from "framer-motion";

export default function SpatialGlow() {
  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
      <motion.div
        animate={{ x: [0, 100, 0], y: [0, -50, 0] }}
        transition={{ duration: 18, repeat: Infinity, ease: "linear" }}
        className="absolute left-0 top-0 h-32 w-[70vw] max-w-full -translate-x-1/4 -rotate-12 bg-gradient-to-r from-primary/10 via-accent/5 to-transparent blur-3xl"
      />
      <motion.div
        animate={{ x: [0, -100, 0], y: [0, 80, 0] }}
        transition={{ duration: 22, repeat: Infinity, ease: "linear" }}
        className="absolute bottom-8 right-0 h-32 w-[64vw] max-w-full translate-x-1/4 rotate-12 bg-gradient-to-r from-secondary/10 via-primary/6 to-transparent blur-3xl"
      />
    </div>
  );
}
