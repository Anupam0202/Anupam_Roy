import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import {
  Award,
  ChevronLeft,
  ChevronRight,
  Download,
  ExternalLink,
  FileText,
  Maximize2,
  Search,
  ShieldCheck,
  X,
} from "lucide-react";
import SectionWrapper from "@/components/layout/section-wrapper";
import FadeContainer from "@/components/motion/fade-container";
import RevealMask from "@/components/motion/reveal-mask";
import {
  ALL_CERTS,
  CERTIFICATION_CATEGORIES,
  FEATURED_CERT_NAMES,
  LEVEL_STYLE,
  PROVIDER_CONFIG,
  getCertificationCategory,
  type Cert,
  type CertificationCategory,
  type ProviderKey,
} from "@/data/certifications";

type CategoryFilter = CertificationCategory | "all";

function useCounter(target: number, duration = 1.4) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const done = useRef(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting || done.current) return;
        done.current = true;
        let value = 0;
        const step = target / (duration * 60);
        const timer = window.setInterval(() => {
          value += step;
          if (value >= target) {
            setCount(target);
            window.clearInterval(timer);
            return;
          }
          setCount(Math.floor(value));
        }, 1000 / 60);
      },
      { threshold: 0.35 },
    );

    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [duration, target]);

  return { count, ref };
}

function isPresent(value: string) {
  return value !== "-" && value !== "\u2014";
}

function yearFromIssued(value: string) {
  if (!isPresent(value)) return "-";
  return value.includes(",") ? value.split(",").at(-1)?.trim() ?? value : value;
}

function CertificationModal({
  cert,
  idx,
  total,
  onPrev,
  onNext,
  onClose,
}: {
  cert: Cert;
  idx: number;
  total: number;
  onPrev: () => void;
  onNext: () => void;
  onClose: () => void;
}) {
  const closeRef = useRef<HTMLButtonElement>(null);
  const category = getCertificationCategory(cert);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "ArrowLeft") onPrev();
      if (event.key === "ArrowRight") onNext();
      if (event.key === "Escape") onClose();
      if (event.key === "Tab") {
        const focusable = Array.from(
          document.querySelectorAll<HTMLElement>(
            "[data-cert-modal] button, [data-cert-modal] a",
          ),
        ).filter((item) => !item.hasAttribute("disabled"));
        if (focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose, onNext, onPrev]);

  const modal = (
    <div
      className="fixed inset-0 flex items-center justify-center p-3 md:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="certification-modal-title"
      data-cert-modal
      style={{ zIndex: 10000 }}
    >
      <div
        aria-hidden="true"
        className="absolute inset-0 h-full w-full cursor-default bg-black/85 backdrop-blur-md"
        onClick={onClose}
      />

      <div className="relative z-10 flex h-[92dvh] w-full max-w-6xl flex-col overflow-hidden rounded-2xl border border-white/12 bg-[#0c0f1a] shadow-[0_32px_80px_-8px_rgba(0,0,0,0.8)]">
        <div className="flex shrink-0 items-center gap-3 border-b border-white/8 bg-white/[0.03] px-4 py-3">
          <div className="hidden gap-1.5 min-[360px]:flex" aria-hidden="true">
            <span className="h-3 w-3 rounded-full bg-[#FF5F57]" />
            <span className="h-3 w-3 rounded-full bg-[#FEBC2E]" />
            <span className="h-3 w-3 rounded-full bg-[#28C840]" />
          </div>
          <p className="min-w-0 flex-1 truncate text-center font-mono text-xs text-white/55">
            {cert.name}
          </p>
          <span className="shrink-0 font-mono text-[10px] text-white/25">
            {idx + 1} / {total}
          </span>
          <button
            ref={closeRef}
            onClick={onClose}
            aria-label="Close certificate viewer"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-white/45 transition hover:bg-white/10 hover:text-white focus:outline-none focus:ring-2 focus:ring-primary/60"
            type="button"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="grid min-h-0 flex-1 md:grid-cols-[320px_1fr]">
          <aside className="flex min-h-0 flex-col border-b border-white/8 bg-white/[0.025] md:border-b-0 md:border-r">
            <div className="min-h-0 flex-1 overflow-y-auto p-5 [scrollbar-width:thin]">
              <div>
                <p className="font-mono text-[10px] font-bold uppercase text-primary" style={{ color: cert.color }}>
                  {cert.provider}
                </p>
                <h3 id="certification-modal-title" className="mt-3 font-display text-2xl font-bold leading-tight text-white">
                  {cert.name}
                </h3>
                <div className="mt-4 flex flex-wrap gap-2">
                  <span className={`rounded-full border px-2.5 py-1 font-mono text-[10px] ${LEVEL_STYLE[cert.level] ?? "border-white/10 bg-white/5 text-white/45"}`}>
                    {cert.level}
                  </span>
                  <span className="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 font-mono text-[10px] text-white/55">
                    {category}
                  </span>
                </div>
              </div>

              <div className="mt-5 space-y-3 text-xs">
                {isPresent(cert.issued) && (
                  <div className="rounded-xl border border-white/8 bg-black/20 p-3">
                    <p className="font-mono uppercase text-white/30">Validity</p>
                    <p className="mt-1 text-white/70">
                      {cert.issued} to {cert.expires}
                    </p>
                  </div>
                )}
                {isPresent(cert.certId) && (
                  <div className="rounded-xl border border-white/8 bg-black/20 p-3">
                    <p className="font-mono uppercase text-white/30">Credential ID</p>
                    <p className="mt-1 break-all font-mono text-white/60">{cert.certId}</p>
                  </div>
                )}
                <div className="rounded-xl border border-white/8 bg-black/20 p-3">
                  <p className="font-mono uppercase text-white/30">Proof Layer</p>
                  <p className="mt-1 text-white/65">
                    Official verification link plus a certificate PDF preview.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex shrink-0 gap-2 border-t border-white/8 bg-[#0c0f1a]/95 p-3 md:flex-col md:p-5">
              <a
                href={cert.verify}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl px-2 py-2 text-[10px] font-bold uppercase transition hover:brightness-125 focus:outline-none focus:ring-2 focus:ring-primary/60 md:px-4 md:py-3 md:text-xs"
                style={{ borderWidth: 1, borderStyle: "solid", borderColor: `${cert.color}55`, background: `${cert.color}1f`, color: cert.color }}
              >
                <ShieldCheck className="h-4 w-4" />
                Verify Credential
              </a>
              <a
                href={cert.pdf}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-2 py-2 font-mono text-[10px] text-white/70 transition hover:border-white/20 hover:text-white focus:outline-none focus:ring-2 focus:ring-primary/60 md:px-4 md:py-3 md:text-xs"
              >
                <Download className="h-4 w-4" />
                Open PDF
              </a>
            </div>
          </aside>

          <div className="min-h-0 bg-[#111827] p-3">
            <div className="flex h-full min-h-[260px] items-center justify-center overflow-hidden rounded-xl border border-white/10 bg-white p-3 sm:p-4">
              <img
                key={cert.thumb}
                src={cert.thumb}
                alt={`${cert.name} certificate preview`}
                className="h-full w-full object-contain"
                loading="lazy"
              />
            </div>
          </div>
        </div>

        <div className="flex shrink-0 items-center justify-between gap-2 border-t border-white/8 bg-[#0c0f1a]/98 px-3 py-2 sm:px-5 sm:py-3">
          <div className="flex items-center justify-between gap-2 sm:justify-start">
            <button
              onClick={onPrev}
              disabled={idx === 0}
              className="flex h-11 w-11 items-center justify-center rounded-lg border border-white/10 text-white/50 transition hover:border-white/25 hover:text-white disabled:cursor-not-allowed disabled:opacity-20 focus:outline-none focus:ring-2 focus:ring-primary/60"
              type="button"
              aria-label="Previous certificate"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="min-w-20 text-center font-mono text-[10px] text-white/35">{idx + 1} of {total}</span>
            <button
              onClick={onNext}
              disabled={idx === total - 1}
              className="flex h-11 w-11 items-center justify-center rounded-lg border border-white/10 text-white/50 transition hover:border-white/25 hover:text-white disabled:cursor-not-allowed disabled:opacity-20 focus:outline-none focus:ring-2 focus:ring-primary/60"
              type="button"
              aria-label="Next certificate"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          <a
            href={cert.verify}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-11 items-center justify-center gap-1.5 rounded-lg border px-2.5 py-2 font-mono text-[10px] font-semibold transition hover:brightness-110 focus:outline-none focus:ring-2 focus:ring-primary/60 sm:px-4 sm:py-2.5 sm:text-xs"
            style={{ borderColor: `${cert.color}45`, background: `${cert.color}20`, color: cert.color }}
          >
            <ExternalLink className="h-3.5 w-3.5" />
            Issuer Link
          </a>
        </div>
      </div>
    </div>
  );

  return createPortal(modal, document.body);
}

function CertificationCard({ cert, onClick, delay }: { cert: Cert; onClick: () => void; delay: number }) {
  const category = getCertificationCategory(cert);
  return (
    <motion.button
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.35, delay: Math.min(delay, 0.45) }}
      whileHover={{ y: -4, scale: 1.015 }}
      onClick={onClick}
      className="group relative w-full cursor-pointer overflow-hidden rounded-xl border border-white/6 bg-white/[0.026] text-left transition duration-300 hover:border-white/16 focus:outline-none focus:ring-2 focus:ring-primary/60"
      type="button"
      aria-label={`Open ${cert.name} certificate`}
    >
      <div
        className="absolute inset-x-0 top-0 h-[2px] opacity-75 transition group-hover:opacity-100"
        style={{ background: `linear-gradient(90deg, ${cert.color}, ${cert.color}30, transparent)` }}
      />
      <div
        className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full opacity-0 blur-2xl transition duration-500 group-hover:opacity-100"
        style={{ background: `${cert.color}24` }}
      />

      <div className="relative p-4">
        <div className="mb-3 flex items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-1.5">
            <ShieldCheck className="h-3 w-3 shrink-0" style={{ color: cert.color }} />
            <span className="truncate font-mono text-[9px] font-semibold uppercase" style={{ color: cert.color }}>
              {cert.provider}
            </span>
          </div>
          <span className={`shrink-0 rounded-full border px-1.5 py-0.5 font-mono text-[8px] ${LEVEL_STYLE[cert.level] ?? "border-white/10 bg-white/5 text-white/45"}`}>
            {cert.level}
          </span>
        </div>

        <p className="mb-3 line-clamp-2 min-h-[34px] pr-1 text-xs font-medium leading-snug text-white/85 transition group-hover:text-white">
          {cert.name}
        </p>
        <p className="mb-3 line-clamp-1 text-[10px] text-white/38">{category}</p>

        <div className="flex items-center justify-between">
          <span className="font-mono text-[9px] text-white/32">{yearFromIssued(cert.issued)}</span>
          <span
            className="flex items-center gap-1 rounded-full px-2 py-0.5 opacity-75 transition group-hover:opacity-100"
            style={{ background: `${cert.color}12`, border: `1px solid ${cert.color}25` }}
          >
            <FileText className="h-2.5 w-2.5" style={{ color: cert.color }} />
            <span className="font-mono text-[8px]" style={{ color: cert.color }}>PDF</span>
          </span>
        </div>
      </div>
    </motion.button>
  );
}

export default function CertificationsVault() {
  const [filter, setFilter] = useState<ProviderKey>("all");
  const [category, setCategory] = useState<CategoryFilter>("all");
  const [query, setQuery] = useState("");
  const [expanded, setExpanded] = useState(false);
  const [modalIdx, setModalIdx] = useState<number | null>(null);
  const { count: certCount, ref: certCountRef } = useCounter(ALL_CERTS.length);

  useEffect(() => {
    const saved = sessionStorage.getItem("cert-filter") as ProviderKey | null;
    if (saved) {
      setFilter(saved);
      sessionStorage.removeItem("cert-filter");
    }

    const onFilterChange = (event: Event) => {
      const next = (event as CustomEvent<ProviderKey>).detail;
      if (!next) return;
      setFilter(next);
      setQuery("");
      setExpanded(false);
    };

    window.addEventListener("cert-filter-change", onFilterChange as EventListener);
    return () => window.removeEventListener("cert-filter-change", onFilterChange as EventListener);
  }, []);

  const counts = useMemo(() => {
    const next: Record<ProviderKey, number> = {
      all: ALL_CERTS.length,
      aws: 0,
      google: 0,
      microsoft: 0,
      snowflake: 0,
      databricks: 0,
      anthropic: 0,
      mongodb: 0,
    };
    for (const cert of ALL_CERTS) next[cert.key] += 1;
    return next;
  }, []);

  const visible = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return ALL_CERTS.filter((cert) => {
      const providerMatch = filter === "all" || cert.key === filter;
      const categoryMatch = category === "all" || getCertificationCategory(cert) === category;
      const searchMatch =
        !normalizedQuery ||
        [cert.provider, cert.name, cert.level, cert.certId, getCertificationCategory(cert)]
          .join(" ")
          .toLowerCase()
          .includes(normalizedQuery);
      return providerMatch && categoryMatch && searchMatch;
    });
  }, [category, filter, query]);

  const featured = useMemo(
    () => ALL_CERTS.filter((cert) => FEATURED_CERT_NAMES.has(cert.name)),
    [],
  );
  const shouldLimit = filter === "all" && category === "all" && !query.trim() && !expanded;
  const displayed = shouldLimit ? visible.slice(0, 24) : visible;

  const openCert = useCallback((cert: Cert) => {
    setModalIdx(ALL_CERTS.indexOf(cert));
  }, []);
  const closeModal = useCallback(() => setModalIdx(null), []);
  const prevModal = useCallback(() => setModalIdx((idx) => (idx !== null && idx > 0 ? idx - 1 : idx)), []);
  const nextModal = useCallback(
    () => setModalIdx((idx) => (idx !== null && idx < ALL_CERTS.length - 1 ? idx + 1 : idx)),
    [],
  );

  return (
    <SectionWrapper id="certifications">
      <FadeContainer className="mb-14">
        <div className="flex flex-col justify-between gap-8 md:flex-row md:items-end">
          <div>
            <p className="mb-4 text-sm uppercase text-primary">Authority Matrix</p>
            <RevealMask>
              <h2 className="font-display text-5xl font-bold leading-none text-white md:text-7xl">
                Wall of<br />
                <span className="text-gradient">Mastery</span>
              </h2>
            </RevealMask>
            <p className="mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground">
              A vault-style proof wall for verified credentials across AI, cloud architecture, data, security, developer tooling, and business platforms.
            </p>
          </div>

          <motion.div
            initial={{ opacity: 0, scale: 0.86 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
            className="relative shrink-0"
          >
            <div className="absolute inset-0 rounded-3xl bg-primary/20 blur-[40px]" />
            <div className="glass relative min-w-[180px] rounded-3xl border border-primary/20 px-10 py-8 text-center">
              <div className="font-display text-7xl font-bold leading-none text-primary">
                <span ref={certCountRef}>{certCount}</span>
              </div>
              <div className="mt-3 text-xs uppercase text-muted-foreground">Verified certs</div>
              <div className="mt-3 text-[10px] font-mono text-primary/70">PDF + issuer links</div>
            </div>
          </motion.div>
        </div>
      </FadeContainer>

      <FadeContainer className="mb-8">
        <div className="grid gap-3 md:grid-cols-4">
          {[
            ["180+", "digital badges"],
            ["AWS + Azure + GCP", "multi-cloud validated"],
            ["AI / Data / Security", "coverage depth"],
            ["Issuer links", "verification ready"],
          ].map(([value, label]) => (
            <div key={value} className="rounded-2xl border border-white/8 bg-white/[0.03] p-4">
              <p className="text-lg font-semibold text-white">{value}</p>
              <p className="mt-1 text-xs uppercase text-white/40">{label}</p>
            </div>
          ))}
        </div>
      </FadeContainer>

      <FadeContainer className="mb-10">
        <div className="rounded-3xl border border-primary/15 bg-primary/[0.045] p-5">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase text-primary">Featured credentials</p>
              <p className="mt-1 text-sm text-muted-foreground">
                The strongest GenAI, cloud AI, architecture, and developer proof points.
              </p>
            </div>
            <span className="rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs text-primary">
              {featured.length} featured
            </span>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {featured.map((cert, index) => (
              <CertificationCard
                key={`featured-${cert.name}`}
                cert={cert}
                onClick={() => openCert(cert)}
                delay={index * 0.03}
              />
            ))}
          </div>
        </div>
      </FadeContainer>

      <FadeContainer className="mb-10">
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap gap-2" aria-label="Filter certifications by provider">
            {PROVIDER_CONFIG.map((provider) => {
              const active = filter === provider.key;
              return (
                <button
                  key={provider.key}
                  onClick={() => {
                    setFilter(provider.key);
                    setExpanded(false);
                  }}
                  className={`flex min-h-11 items-center gap-2 rounded-full border px-4 py-2 text-xs font-medium transition ${
                    active
                      ? "text-white shadow-lg"
                      : "border-white/8 bg-white/[0.02] text-white/45 hover:border-white/15 hover:text-white/75"
                  }`}
                  style={
                    active
                      ? { borderColor: `${provider.color}40`, background: `${provider.color}15`, boxShadow: `0 0 20px ${provider.color}15` }
                      : undefined
                  }
                  type="button"
                >
                  {provider.key !== "all" && (
                    <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ backgroundColor: provider.color }} />
                  )}
                  {provider.label}
                  <span className="font-mono text-[10px] opacity-65">{counts[provider.key]}</span>
                </button>
              );
            })}
          </div>

          <div className="flex flex-wrap gap-2" aria-label="Filter certifications by category">
            {(["all", ...CERTIFICATION_CATEGORIES] as const).map((item) => {
              const active = category === item;
              const label = item === "all" ? "All Categories" : item;
              return (
                <button
                  key={item}
                  onClick={() => {
                    setCategory(item);
                    setExpanded(false);
                  }}
                  className={`min-h-11 rounded-full border px-4 py-2 text-xs font-medium transition ${
                    active
                      ? "border-primary/35 bg-primary/12 text-primary"
                      : "border-white/8 bg-white/[0.02] text-white/45 hover:text-white"
                  }`}
                  type="button"
                >
                  {label}
                </button>
              );
            })}
          </div>

          <label className="relative block max-w-xl">
            <span className="sr-only">Search certifications</span>
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/25" />
            <input
              value={query}
              onChange={(event) => {
                setQuery(event.target.value);
                setExpanded(false);
              }}
              placeholder="Search by provider, level, credential, category, or ID..."
              className="w-full rounded-2xl border border-white/8 bg-white/[0.035] py-3 pl-11 pr-4 text-sm text-white outline-none transition placeholder:text-white/25 hover:border-white/14 focus:border-primary/45 focus:ring-2 focus:ring-primary/20"
            />
          </label>
        </div>
      </FadeContainer>

      <FadeContainer className="mb-6">
        <div className="flex items-center gap-3 rounded-2xl border border-white/5 bg-white/[0.02] px-4 py-3">
          <FileText className="h-4 w-4 shrink-0 text-primary" />
          <p className="text-xs text-muted-foreground">
            <span className="font-medium text-white">Click any card</span> to inspect the credential, open its PDF, or verify it on the issuer site.
          </p>
        </div>
      </FadeContainer>

      <AnimatePresence mode="wait">
        <motion.div
          key={`${filter}-${category}-${expanded}-${query}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="mb-16 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5"
        >
          {displayed.map((cert, index) => (
            <CertificationCard
              key={`${cert.key}-${cert.name}`}
              cert={cert}
              onClick={() => openCert(cert)}
              delay={index * 0.018}
            />
          ))}
          {visible.length === 0 && (
            <div className="col-span-full rounded-2xl border border-white/8 bg-white/[0.03] p-8 text-center text-sm text-muted-foreground">
              No credentials match that search.
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {visible.length > displayed.length && (
        <div className="-mt-10 mb-16 flex justify-center">
          <button
            onClick={() => setExpanded(true)}
            className="rounded-full border border-primary/25 bg-primary/10 px-6 py-3 text-sm font-semibold text-primary transition hover:bg-primary/15 focus:outline-none focus:ring-2 focus:ring-primary/60"
            type="button"
          >
            Open full vault ({visible.length - displayed.length} more credentials)
          </button>
        </div>
      )}

      <FadeContainer>
        <div className="glass flex flex-wrap items-center justify-between gap-6 rounded-2xl border border-primary/10 p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-primary/20 bg-primary/10">
              <Award className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm font-semibold text-white">
                {ALL_CERTS.length} verified credentials, searchable by ecosystem and provider.
              </p>
              <p className="text-xs text-muted-foreground">
                PDFs are rendered from the local portfolio vault; issuer links open official verification pages.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-4">
            <a href="https://www.credly.com/users/anupam_roy/" target="_blank" rel="noreferrer" className="inline-flex min-h-11 items-center font-mono text-xs text-primary transition hover:text-white">
              Credly Profile
            </a>
            <a href="https://www.linkedin.com/in/anupam--roy/" target="_blank" rel="noreferrer" className="inline-flex min-h-11 items-center font-mono text-xs text-accent transition hover:text-white">
              LinkedIn
            </a>
          </div>
        </div>
      </FadeContainer>

      <AnimatePresence>
        {modalIdx !== null && (
          <CertificationModal
            cert={ALL_CERTS[modalIdx]}
            idx={modalIdx}
            total={ALL_CERTS.length}
            onPrev={prevModal}
            onNext={nextModal}
            onClose={closeModal}
          />
        )}
      </AnimatePresence>
    </SectionWrapper>
  );
}
