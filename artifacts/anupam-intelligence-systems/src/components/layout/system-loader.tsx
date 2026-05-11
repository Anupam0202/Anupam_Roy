import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";

const bootLines = [
  "ANUPAM ROY / AUTONOMOUS AI SYSTEMS",
  "LOADING ENTERPRISE RAG, MULTI-AGENT, AND CLOUD ARCHITECTURE SIGNALS",
  "74 VERIFIABLE CREDENTIALS AND CERTIFICATE PDFS INDEXED",
  "20% FASTER TURNAROUND / 50% LOWER SME DEPENDENCY",
  "PORTFOLIO COMMAND CENTER READY",
];

export default function SystemLoader() {
  const [visibleLines, setVisibleLines] = useState(0);
  const [finished, setFinished] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setVisibleLines((prev) => {
        if (prev < bootLines.length) {
          return prev + 1;
        }
        clearInterval(interval);
        setTimeout(() => setFinished(true), 500);
        return prev;
      });
    }, 220);
    return () => clearInterval(interval);
  }, []);

  return (
    <AnimatePresence>
      {!finished && (
        <motion.div
          exit={{ opacity: 0, transition: { duration: 0.6 } }}
          className="fixed inset-0 z-[9999] flex items-center justify-center overflow-hidden bg-background"
        >
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(0,245,212,0.08),transparent_60%)]" />

          <div className="relative z-10 w-full max-w-2xl px-6">
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mb-10 text-center text-xs uppercase tracking-[0.4em] text-primary"
            >
              ANUPAM ROY · OPERATIONAL INTELLIGENCE PORTFOLIO
            </motion.p>

            <div className="glass rounded-3xl border border-white/10 p-8">
              <div className="mb-6 flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-red-500/80" />
                <div className="h-3 w-3 rounded-full bg-yellow-500/80" />
                <div className="h-3 w-3 rounded-full bg-green-500/80" />
                <span className="ml-2 text-[10px] font-mono text-muted-foreground/50 tracking-widest">
                  sys/init
                </span>
              </div>

              <div className="space-y-3 font-mono text-sm text-muted-foreground min-h-[200px]">
                {bootLines.slice(0, visibleLines).map((line, index) => (
                  <motion.p
                    key={line}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.04 }}
                    className="flex items-center gap-3"
                  >
                    <span className="text-primary shrink-0">&gt;</span>
                    <span
                      className={
                        index === visibleLines - 1 &&
                        visibleLines === bootLines.length
                          ? "text-primary font-semibold"
                          : ""
                      }
                    >
                      {line}
                    </span>
                  </motion.p>
                ))}

                {visibleLines > 0 && visibleLines < bootLines.length && (
                  <motion.span
                    animate={{ opacity: [1, 0, 1] }}
                    transition={{ duration: 0.8, repeat: Infinity }}
                    className="inline-block w-2 h-4 bg-primary ml-1"
                  />
                )}
              </div>
            </div>

            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 2.6, duration: 1, ease: [0.16, 1, 0.3, 1] }}
              className="mx-auto mt-12 flex h-24 w-24 items-center justify-center rounded-full border border-primary/20 bg-primary/10 backdrop-blur-xl"
            >
              <div className="h-10 w-10 animate-pulse rounded-full bg-primary shadow-[0_0_60px_rgba(0,245,212,0.8)]" />
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
