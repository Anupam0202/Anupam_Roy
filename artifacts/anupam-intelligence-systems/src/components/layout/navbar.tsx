import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  BrainCircuit,
  Briefcase,
  Github,
  Linkedin,
  Menu,
  X,
} from "lucide-react";
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
export default function Navbar({
  executiveOpen,
  onToggleExecutive,
}: NavbarProps) {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const headerRef = useRef<HTMLElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLElement>(null);
  useEffect(() => {
    const run = () => setScrolled(window.scrollY > 48);
    run();
    window.addEventListener("scroll", run, { passive: true });
    return () => window.removeEventListener("scroll", run);
  }, []);
  useEffect(() => {
    if (!open) return;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const frame = requestAnimationFrame(() =>
      menuRef.current?.querySelector<HTMLElement>("a, button")?.focus(),
    );
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        setOpen(false);
        requestAnimationFrame(() => triggerRef.current?.focus());
        return;
      }
      if (e.key !== "Tab" || !menuRef.current) return;
      const items = Array.from(
        menuRef.current.querySelectorAll<HTMLElement>(
          "a[href],button:not([disabled])",
        ),
      );
      if (!items.length) return;
      const [first, last] = [items[0], items.at(-1)!];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      cancelAnimationFrame(frame);
      document.body.style.overflow = overflow;
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);
  return (
    <motion.header
      ref={headerRef}
      initial={{ opacity: 0, y: -24 }}
      animate={{ opacity: 1, y: 0 }}
      className="fixed left-0 top-0 z-50 flex w-full flex-col items-center pt-3 sm:pt-5"
    >
      <div
        className={`flex w-[95%] max-w-7xl items-center justify-between rounded-2xl px-4 py-2.5 transition sm:px-5 ${scrolled ? "border border-white/12 bg-background/92 shadow-[0_12px_44px_rgba(0,0,0,0.38)] backdrop-blur-xl" : "border border-white/8 bg-[#061310]/78 backdrop-blur-lg"}`}
      >
        <a
          href="#hero"
          className="flex min-h-11 shrink-0 items-center gap-2.5"
          aria-label="Anupam Roy portfolio home"
        >
          <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-primary/25 bg-[#061310]">
            <BrainCircuit className="h-5 w-5 text-primary" aria-hidden="true" />
          </span>
          <span className="hidden flex-col leading-none sm:flex">
            <span className="font-display text-sm font-bold text-white">
              Anupam Roy
            </span>
            <span className="mt-1 text-xs font-semibold uppercase tracking-[0.14em] text-primary/85">
              Intelligence Systems
            </span>
          </span>
        </a>
        <nav
          className="hidden items-center gap-4 lg:flex"
          aria-label="Main navigation"
        >
          {links.map((link) => (
            <a
              key={link.name}
              href={link.href}
              className="inline-flex min-h-11 items-center px-1 text-sm text-white/65 transition hover:text-white"
            >
              {link.name}
            </a>
          ))}
        </nav>
        <div className="flex items-center gap-1 sm:gap-2">
          <a
            href="https://github.com/Anupam0202/"
            target="_blank"
            rel="noreferrer"
            aria-label="Anupam Roy on GitHub"
            className="flex h-11 w-11 items-center justify-center rounded-full text-white/65 hover:text-white"
          >
            <Github className="h-4 w-4" />
          </a>
          <a
            href="https://www.linkedin.com/in/anupam--roy/"
            target="_blank"
            rel="noreferrer"
            aria-label="Anupam Roy on LinkedIn"
            className="flex h-11 w-11 items-center justify-center rounded-full text-white/65 hover:text-white"
          >
            <Linkedin className="h-4 w-4" />
          </a>
          <button
            type="button"
            onClick={onToggleExecutive}
            aria-pressed={executiveOpen}
            className="hidden min-h-11 items-center gap-2 rounded-full border border-white/12 px-4 text-xs font-semibold text-white/70 sm:inline-flex"
          >
            <Briefcase className="h-4 w-4" />
            {executiveOpen ? "Close Brief" : "Executive Brief"}
          </button>
          <a
            href="#contact"
            className="hidden min-h-11 items-center rounded-full border border-primary/25 bg-primary/10 px-5 text-sm font-semibold text-primary sm:inline-flex"
          >
            Contact
          </a>
          <button
            ref={triggerRef}
            type="button"
            onClick={() => setOpen(!open)}
            aria-label={open ? "Close navigation menu" : "Open navigation menu"}
            aria-expanded={open}
            aria-controls="mobile-navigation"
            className="flex h-11 w-11 items-center justify-center rounded-full text-white/70 lg:hidden"
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>
      <AnimatePresence>
        {open && (
          <motion.nav
            ref={menuRef}
            id="mobile-navigation"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="mt-2 max-h-[calc(100dvh-7rem)] w-[95%] max-w-7xl overflow-y-auto rounded-2xl border border-white/12 bg-[#07110f]/98 p-4 shadow-2xl backdrop-blur-2xl lg:hidden"
            aria-label="Mobile navigation"
          >
            <div className="flex flex-col gap-1">
              {links.map((link) => (
                <a
                  key={link.name}
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className="inline-flex min-h-12 items-center rounded-xl px-3 text-sm text-white/70 hover:bg-white/5 hover:text-white"
                >
                  {link.name}
                </a>
              ))}
              <div className="my-2 h-px bg-white/10" />
              <button
                type="button"
                onClick={() => {
                  setOpen(false);
                  onToggleExecutive();
                }}
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-white/12 px-5 text-sm font-semibold text-white/70"
              >
                <Briefcase className="h-4 w-4" />
                {executiveOpen
                  ? "Close Executive Brief"
                  : "Open Executive Brief"}
              </button>
            </div>
          </motion.nav>
        )}
      </AnimatePresence>
    </motion.header>
  );
}
