import { motion } from "framer-motion";

export default function SpatialGlow() {
  return (
    <>
      <motion.div
        animate={{ x: [0, 100, 0], y: [0, -50, 0] }}
        transition={{ duration: 18, repeat: Infinity, ease: "linear" }}
        className="pointer-events-none fixed left-[-10%] top-0 z-0 h-32 w-[70vw] -rotate-12 bg-gradient-to-r from-primary/10 via-accent/5 to-transparent blur-3xl"
      />
      <motion.div
        animate={{ x: [0, -100, 0], y: [0, 80, 0] }}
        transition={{ duration: 22, repeat: Infinity, ease: "linear" }}
        className="pointer-events-none fixed bottom-8 right-[-12%] z-0 h-32 w-[64vw] rotate-12 bg-gradient-to-r from-secondary/10 via-primary/6 to-transparent blur-3xl"
      />
    </>
  );
}
