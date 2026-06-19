import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BrainCircuit, Github, Linkedin, Menu, X, Briefcase } from "lucide-react";

const links = [
  { name: "About", href: "#about" },
  { name: "Experience", href: "#experience" },
  { name: "Systems", href: "#systems" },
  { name: "Projects", href: "#projects" },
  { name: "Mastery", href: "#certifications" },
  { name: "Achievements", href: "#achievements" },
  { name: "Contact", href: "#contact" },
];

interface NavbarProps {
  executiveOpen: boolean;
  onToggleExecutive: () => void;
}

export default function Navbar({ executiveOpen, onToggleExecutive }: NavbarProps) {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  return (
    <motion.header
      initial={{ opacity: 0, y: -40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.55 }}
      className="fixed left-0 top-0 z-50 flex w-full flex-col items-center pt-4 sm:pt-6"
    >
      <div
        className={`flex w-[95%] max-w-7xl items-center justify-between rounded-2xl px-4 py-3 transition-all duration-300 sm:px-6 sm:py-4 ${
          scrolled
            ? "border border-white/10 bg-background/88 shadow-[0_8px_40px_rgba(0,0,0,0.45)] backdrop-blur-xl"
            : "border border-white/8 bg-white/[0.035] backdrop-blur-xl"
        }`}
      >
        <a href="#hero" className="flex min-h-11 flex-shrink-0 items-center gap-2.5" aria-label="SynapseOps AI Command Center home">
          <div className="relative flex h-11 w-11 items-center justify-center overflow-hidden rounded-xl border border-primary/25 bg-[#061310] shadow-[0_0_24px_rgba(45,212,191,0.18)] sm:h-9 sm:w-9">
            <span className="absolute -left-2 top-0 h-7 w-7 rounded-full bg-cyan-400/35 blur-md" />
            <span className="absolute -bottom-2 right-0 h-7 w-7 rounded-full bg-amber-400/35 blur-md" />
            <BrainCircuit className="relative h-[18px] w-[18px] text-primary" />
          </div>
          <span className="hidden flex-col leading-none sm:flex">
            <span className="font-display text-sm font-bold text-white">SynapseOps</span>
            <span className="text-[10px] font-semibold uppercase text-primary/80">Anupam Roy</span>
          </span>
        </a>

        <nav className="hidden items-center gap-5 lg:flex" aria-label="Main navigation">
          {links.map((link) => (
            <a key={link.name} href={link.href} className="inline-flex min-h-11 items-center px-1 text-sm text-muted-foreground transition-colors hover:text-white">
              {link.name}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-1.5 sm:gap-2">
          <a href="https://github.com/Anupam0202/" target="_blank" rel="noreferrer" aria-label="GitHub" className="flex h-11 w-11 items-center justify-center rounded-full text-muted-foreground transition hover:bg-white/8 hover:text-white">
            <Github className="h-4 w-4" />
          </a>
          <a href="https://www.linkedin.com/in/anupam--roy/" target="_blank" rel="noreferrer" aria-label="LinkedIn" className="flex h-11 w-11 items-center justify-center rounded-full text-muted-foreground transition hover:bg-white/8 hover:text-white">
            <Linkedin className="h-4 w-4" />
          </a>
          <button
            onClick={onToggleExecutive}
            aria-pressed={executiveOpen}
            className={`hidden min-h-11 items-center gap-1.5 rounded-full border px-3.5 py-2 text-xs font-medium transition sm:inline-flex ${
              executiveOpen ? "border-yellow-400/30 bg-yellow-400/10 text-yellow-300" : "border-white/10 bg-white/[0.03] text-white/60 hover:text-white"
            }`}
          >
            <Briefcase className="h-3.5 w-3.5" />
            {executiveOpen ? "Exit Executive" : "Executive View"}
          </button>
          <a href="#contact" className="hidden min-h-11 items-center rounded-full border border-primary/20 bg-primary/10 px-5 py-2 text-sm font-medium text-primary transition hover:bg-primary/20 sm:inline-flex">
            Consult
          </a>
          <button
            onClick={() => setOpen((value) => !value)}
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            className="flex h-11 w-11 items-center justify-center rounded-full text-muted-foreground transition hover:bg-white/8 hover:text-white lg:hidden"
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {open && (
          <motion.nav
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mt-2 w-[95%] max-w-7xl rounded-2xl border border-white/10 bg-[#07110f]/96 p-5 backdrop-blur-2xl lg:hidden"
            aria-label="Mobile navigation"
          >
            <div className="flex flex-col gap-4">
              {links.map((link) => (
                <a key={link.name} href={link.href} onClick={() => setOpen(false)} className="inline-flex min-h-11 items-center text-sm text-muted-foreground transition-colors hover:text-white">
                  {link.name}
                </a>
              ))}
              <div className="h-px bg-white/8" />
              <button
                onClick={() => {
                  setOpen(false);
                  onToggleExecutive();
                }}
                className={`inline-flex items-center gap-2 rounded-full border px-5 py-2.5 text-sm font-medium ${
                  executiveOpen ? "border-yellow-400/30 bg-yellow-400/10 text-yellow-300" : "border-white/10 bg-white/[0.03] text-white/60"
                }`}
              >
                <Briefcase className="h-4 w-4" />
                {executiveOpen ? "Exit Executive View" : "Switch to Executive View"}
              </button>
            </div>
          </motion.nav>
        )}
      </AnimatePresence>
    </motion.header>
  );
}
