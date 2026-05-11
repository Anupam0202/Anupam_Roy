import { motion } from "framer-motion";

export default function DataStreams() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {[...Array(12)].map((_, i) => (
        <motion.div
          key={i}
          initial={{ y: -200, opacity: 0 }}
          animate={{ y: "120vh", opacity: [0, 0.25, 0] }}
          transition={{
            duration: 10 + i * 1.2,
            repeat: Infinity,
            delay: i * 1.5,
            ease: "linear",
          }}
          className="absolute h-40 w-[1px] bg-gradient-to-b from-transparent via-primary to-transparent"
          style={{ left: `${i * 9 + 2}%` }}
        />
      ))}
    </div>
  );
}
