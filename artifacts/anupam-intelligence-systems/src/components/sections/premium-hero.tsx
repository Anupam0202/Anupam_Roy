import { Github, Linkedin, Mail, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import { portfolioMetrics, proofChips, profile } from "@/data/profile";
import { MetricCard } from "./metric-card";

export function PremiumHero() {
  return (
    <section id="hero" className="relative overflow-hidden pt-28 md:pt-36">
      <div className="absolute inset-0 grid-background opacity-40" />
      <div className="absolute inset-x-0 top-0 h-64 bg-[radial-gradient(circle_at_50%_0%,rgba(45,212,191,0.18),transparent_55%)]" />

      <div className="relative z-10 mx-auto grid w-[92%] max-w-7xl gap-10 pb-16 lg:grid-cols-[1.1fr_0.9fr] lg:items-center lg:pb-24">
        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.65 }}>
          <div className="inline-flex rounded-full border border-primary/20 bg-primary/10 px-4 py-2 text-xs font-semibold uppercase text-primary">
            Production GenAI / RAG / Multi-Agent Systems
          </div>
          <h1 className="mt-7 font-display text-5xl font-bold leading-[1.02] text-white md:text-7xl">
            Anupam Roy
            <span className="mt-3 block text-3xl text-gradient md:text-5xl">AI/ML Analyst</span>
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground md:text-xl">{profile.headline}</p>
          <p className="mt-4 max-w-2xl text-base leading-relaxed text-muted-foreground">{profile.positioning}</p>

          <div className="mt-8 flex flex-wrap gap-3">
            <a href="#systems" className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-bold text-black hover:opacity-90">
              View Systems <ArrowRight className="h-4 w-4" />
            </a>
            <a href="#certifications" className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-6 py-3 text-sm font-semibold text-white hover:border-primary/30">
              Open Mastery Wall
            </a>
            <a href="#contact" className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-6 py-3 text-sm font-semibold text-white hover:border-primary/30">
              <Mail className="h-4 w-4" /> Contact Me
            </a>
            <a href="https://github.com/Anupam0202/" target="_blank" rel="noreferrer" className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/70 hover:text-white" aria-label="GitHub">
              <Github className="h-4 w-4" />
            </a>
            <a href="https://www.linkedin.com/in/anupam--roy/" target="_blank" rel="noreferrer" className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/70 hover:text-white" aria-label="LinkedIn">
              <Linkedin className="h-4 w-4" />
            </a>
          </div>

          <div className="mt-8 flex flex-wrap gap-2">
            {proofChips.map((chip) => (
              <span key={chip} className="rounded-full border border-primary/15 bg-primary/5 px-3 py-1.5 text-xs text-primary/80">
                {chip}
              </span>
            ))}
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.75, delay: 0.1 }} className="rounded-3xl border border-white/10 bg-white/[0.035] p-5 shadow-[0_0_70px_rgba(0,0,0,0.35)]">
          <div className="rounded-2xl border border-primary/15 bg-black/25 p-5">
            <p className="text-xs font-semibold uppercase text-primary">Enterprise Operational AI Platform</p>
            <h2 className="mt-3 font-display text-2xl font-bold text-white">Documents, tickets, logs, commits, and runbooks into decisions.</h2>
            <div className="mt-5 grid grid-cols-2 gap-3">
              {["Incident Agent", "Problem Agent", "Release Agent", "Service Request Agent"].map((agent) => (
                <div key={agent} className="rounded-xl border border-white/8 bg-white/[0.03] p-3 text-sm text-white/80">{agent}</div>
              ))}
            </div>
            <div className="mt-5 flex items-center gap-2 text-xs text-muted-foreground">
              <span className="h-2 w-2 rounded-full bg-primary shadow-[0_0_16px_rgba(45,212,191,0.9)]" />
              LangGraph orchestration, RAG, RCA, release intelligence, and ITSM automation.
            </div>
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {portfolioMetrics.map((metric) => <MetricCard key={metric.label} metric={metric} />)}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
