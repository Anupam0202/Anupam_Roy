import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  Award,
  CalendarClock,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Download,
  ExternalLink,
  FileText,
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
import { acquirePortfolioShellInert } from "@/lib/modal-a11y";
type Category = CertificationCategory | "all";
type Status = "active" | "expiring" | "historical" | "no-expiry" | "unknown";
type StatusFilter = Status | "all";
const statusInfo: Record<
  Status,
  { label: string; style: string; detail: string }
> = {
  active: {
    label: "Active",
    style: "border-emerald-400/30 bg-emerald-400/10 text-emerald-200",
    detail: "Listed expiry is more than six months away.",
  },
  expiring: {
    label: "Expiring soon",
    style: "border-amber-400/35 bg-amber-400/10 text-amber-200",
    detail: "Listed expiry is within six months.",
  },
  historical: {
    label: "Historical",
    style: "border-white/15 bg-white/[0.05] text-white/60",
    detail: "Listed expiry has passed; retained as learning history.",
  },
  "no-expiry": {
    label: "No expiry listed",
    style: "border-sky-400/30 bg-sky-400/10 text-sky-200",
    detail: "The record does not list an expiry date.",
  },
  unknown: {
    label: "Dates unavailable",
    style: "border-violet-400/30 bg-violet-400/10 text-violet-200",
    detail: "Issue or expiry details are unavailable in this record.",
  },
};
const present = (value: string) =>
  value !== "-" && value !== "—" && value.trim() !== "";
const date = (value: string) => {
  if (!present(value)) return null;
  const ms = Date.parse(value);
  return Number.isNaN(ms) ? null : new Date(ms);
};
export function getCredentialStatus(cert: Cert, now = new Date()): Status {
  const expiry = date(cert.expires);
  if (!expiry) return present(cert.issued) ? "no-expiry" : "unknown";
  expiry.setHours(23, 59, 59, 999);
  const days = Math.ceil((expiry.getTime() - now.getTime()) / 86_400_000);
  return days < 0 ? "historical" : days <= 183 ? "expiring" : "active";
}
function Badge({ cert }: { cert: Cert }) {
  const info = statusInfo[getCredentialStatus(cert)];
  return (
    <span
      className={`rounded-full border px-2 py-1 text-xs font-medium ${info.style}`}
    >
      {info.label}
    </span>
  );
}
function Card({
  cert,
  onOpen,
  delay = 0,
}: {
  cert: Cert;
  onOpen: () => void;
  delay?: number;
}) {
  const reduced = useReducedMotion();
  return (
    <motion.button
      type="button"
      onClick={onOpen}
      aria-label={`Open ${cert.name} credential`}
      initial={reduced ? false : { opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: reduced ? 0 : Math.min(delay, 0.2) }}
      className="group relative w-full overflow-hidden rounded-2xl border border-white/8 bg-white/[0.03] p-4 text-left transition hover:border-white/18"
    >
      <span
        className="absolute inset-x-0 top-0 h-0.5"
        style={{
          background: `linear-gradient(90deg,${cert.color},transparent)`,
        }}
      />
      <div className="flex items-start justify-between gap-2">
        <span
          className="flex min-w-0 items-center gap-2 text-xs font-semibold uppercase"
          style={{ color: cert.color }}
        >
          <ShieldCheck className="h-4 w-4 shrink-0" />
          <span className="truncate">{cert.provider}</span>
        </span>
        <Badge cert={cert} />
      </div>
      <p className="mt-4 line-clamp-3 min-h-[3.75rem] text-sm font-semibold leading-snug text-white/88">
        {cert.name}
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        <span
          className={`rounded-full border px-2 py-1 text-xs ${LEVEL_STYLE[cert.level] ?? "border-white/10 text-white/55"}`}
        >
          {cert.level}
        </span>
        <span className="rounded-full border border-white/10 px-2 py-1 text-xs text-white/58">
          {getCertificationCategory(cert)}
        </span>
      </div>
      <div className="mt-4 flex justify-between border-t border-white/8 pt-3 text-xs text-white/50">
        <span>
          {present(cert.issued)
            ? cert.issued.split(",").at(-1)
            : "Date unavailable"}
        </span>
        <span className="flex items-center gap-1" style={{ color: cert.color }}>
          <FileText className="h-4 w-4" />
          PDF + issuer
        </span>
      </div>
    </motion.button>
  );
}
function Modal({
  list,
  index,
  setIndex,
  close,
  returnFocus,
}: {
  list: Cert[];
  index: number;
  setIndex: (i: number) => void;
  close: () => void;
  returnFocus: HTMLElement | null;
}) {
  const cert = list[index];
  const closeRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const [failed, setFailed] = useState(false);
  const status = getCredentialStatus(cert);
  const info = statusInfo[status];
  useEffect(() => setFailed(false), [cert.thumb]);
  useEffect(() => {
    const overflow = document.body.style.overflow;
    const release = acquirePortfolioShellInert();
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();
    return () => {
      document.body.style.overflow = overflow;
      release();
      requestAnimationFrame(() => returnFocus?.focus());
    };
  }, [returnFocus]);
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
      if (e.key === "ArrowLeft" && index > 0) setIndex(index - 1);
      if (e.key === "ArrowRight" && index < list.length - 1)
        setIndex(index + 1);
      if (e.key !== "Tab" || !panelRef.current) return;
      const items = Array.from(
        panelRef.current.querySelectorAll<HTMLElement>(
          "a[href],button:not([disabled])",
        ),
      );
      if (!items.length) return;
      const first = items[0],
        last = items.at(-1)!;
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    addEventListener("keydown", key);
    return () => removeEventListener("keydown", key);
  }, [close, index, list.length, setIndex]);
  return createPortal(
    <div
      className="fixed inset-0 flex items-center justify-center p-3 md:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="credential-title"
      style={{ zIndex: 10000 }}
    >
      <button
        type="button"
        tabIndex={-1}
        aria-label="Close credential viewer"
        className="absolute inset-0 h-full w-full bg-black/86 backdrop-blur-md"
        onClick={close}
      />
      <div
        ref={panelRef}
        className="relative z-10 flex h-[92dvh] w-full max-w-6xl flex-col overflow-hidden rounded-3xl border border-white/14 bg-[#0c0f1a]"
      >
        <div className="flex items-center gap-3 border-b border-white/10 px-4 py-3">
          <p className="min-w-0 flex-1 truncate text-center text-sm text-white/62">
            {cert.name}
          </p>
          <span className="text-xs text-white/45">
            {index + 1}/{list.length}
          </span>
          <button
            ref={closeRef}
            type="button"
            onClick={close}
            aria-label="Close credential viewer"
            className="flex h-11 w-11 items-center justify-center rounded-xl text-white/65"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="grid min-h-0 flex-1 md:grid-cols-[340px_1fr]">
          <aside className="flex min-h-0 flex-col border-b border-white/10 md:border-b-0 md:border-r">
            <div className="min-h-0 flex-1 overflow-y-auto p-6">
              <p
                className="text-xs font-bold uppercase"
                style={{ color: cert.color }}
              >
                {cert.provider}
              </p>
              <h3
                id="credential-title"
                className="mt-3 font-display text-2xl font-bold text-white"
              >
                {cert.name}
              </h3>
              <div className="mt-4 flex flex-wrap gap-2">
                <Badge cert={cert} />
                <span
                  className={`rounded-full border px-3 py-1.5 text-xs ${LEVEL_STYLE[cert.level] ?? "border-white/10 text-white/60"}`}
                >
                  {cert.level}
                </span>
              </div>
              <dl className="mt-6 space-y-3 text-sm">
                <div className="rounded-2xl border border-white/9 bg-black/20 p-4">
                  <dt className="text-xs uppercase text-white/45">Validity</dt>
                  <dd className="mt-2 text-white/72">
                    {present(cert.issued)
                      ? cert.issued
                      : "Issue date unavailable"}{" "}
                    →{" "}
                    {present(cert.expires) ? cert.expires : "No expiry listed"}
                  </dd>
                </div>
                {present(cert.certId) && (
                  <div className="rounded-2xl border border-white/9 bg-black/20 p-4">
                    <dt className="text-xs uppercase text-white/45">
                      Credential ID
                    </dt>
                    <dd className="mt-2 break-all font-mono text-xs text-white/65">
                      {cert.certId}
                    </dd>
                  </div>
                )}
                <div className="rounded-2xl border border-white/9 bg-black/20 p-4">
                  <dt className="text-xs uppercase text-white/45">
                    Status context
                  </dt>
                  <dd className="mt-2 text-white/68">{info.detail}</dd>
                </div>
              </dl>
            </div>
            <div className="grid grid-cols-2 gap-2 border-t border-white/10 p-4 md:grid-cols-1">
              <a
                href={cert.verify}
                target="_blank"
                rel="noreferrer"
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border px-3 text-xs font-bold"
                style={{ borderColor: `${cert.color}55`, color: cert.color }}
              >
                <ShieldCheck className="h-4 w-4" />
                Verify with issuer
              </a>
              <a
                href={cert.pdf}
                target="_blank"
                rel="noreferrer"
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-white/12 px-3 text-xs text-white/72"
              >
                <Download className="h-4 w-4" />
                Open PDF
              </a>
            </div>
          </aside>
          <div className="min-h-0 bg-[#111827] p-4">
            <div className="flex h-full min-h-[280px] items-center justify-center rounded-2xl bg-white p-4">
              {failed ? (
                <div className="text-center text-slate-800">
                  <FileText className="mx-auto h-10 w-10" />
                  <p className="mt-4 font-semibold">Preview unavailable</p>
                  <a
                    href={cert.pdf}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-4 inline-flex min-h-11 items-center rounded-full bg-slate-900 px-5 text-sm text-white"
                  >
                    Open PDF
                  </a>
                </div>
              ) : (
                <img
                  src={cert.thumb}
                  alt={`${cert.name} certificate preview`}
                  className="h-full w-full object-contain"
                  onError={() => setFailed(true)}
                />
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center justify-between gap-3 border-t border-white/10 px-4 py-3">
          <button
            type="button"
            disabled={index === 0}
            onClick={() => setIndex(index - 1)}
            className="flex min-h-11 items-center gap-2 rounded-xl border border-white/12 px-3 text-xs text-white/68 disabled:opacity-30"
          >
            <ChevronLeft className="h-4 w-4" />
            Previous
          </button>
          <span className="text-xs text-white/45">Filtered collection</span>
          <button
            type="button"
            disabled={index === list.length - 1}
            onClick={() => setIndex(index + 1)}
            className="flex min-h-11 items-center gap-2 rounded-xl border border-white/12 px-3 text-xs text-white/68 disabled:opacity-30"
          >
            Next
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
export default function CertificationsVault() {
  const [provider, setProvider] = useState<ProviderKey>("all");
  const [category, setCategory] = useState<Category>("all");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [query, setQuery] = useState("");
  const [expanded, setExpanded] = useState(false);
  const [modal, setModal] = useState<{ list: Cert[]; index: number } | null>(
    null,
  );
  const trigger = useRef<HTMLElement | null>(null);
  useEffect(() => {
    const listener = (event: Event) => {
      const next = (event as CustomEvent<ProviderKey>).detail;
      if (next) {
        setProvider(next);
        setCategory("all");
        setStatus("all");
        setQuery("");
      }
    };
    addEventListener("cert-filter-change", listener);
    return () => removeEventListener("cert-filter-change", listener);
  }, []);
  const providerCounts = useMemo(() => {
    const counts = Object.fromEntries(
      PROVIDER_CONFIG.map((x) => [x.key, 0]),
    ) as Record<ProviderKey, number>;
    counts.all = ALL_CERTS.length;
    ALL_CERTS.forEach((x) => counts[x.key]++);
    return counts;
  }, []);
  const statusCounts = useMemo(() => {
    const counts: Record<StatusFilter, number> = {
      all: ALL_CERTS.length,
      active: 0,
      expiring: 0,
      historical: 0,
      "no-expiry": 0,
      unknown: 0,
    };
    ALL_CERTS.forEach((x) => counts[getCredentialStatus(x)]++);
    return counts;
  }, []);
  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return ALL_CERTS.filter(
      (cert) =>
        (provider === "all" || cert.key === provider) &&
        (category === "all" || getCertificationCategory(cert) === category) &&
        (status === "all" || getCredentialStatus(cert) === status) &&
        (!q ||
          [
            cert.provider,
            cert.name,
            cert.level,
            cert.certId,
            getCertificationCategory(cert),
            statusInfo[getCredentialStatus(cert)].label,
          ]
            .join(" ")
            .toLowerCase()
            .includes(q)),
    );
  }, [provider, category, status, query]);
  const featured = useMemo(
    () =>
      FEATURED_CERT_NAMES.map((name) =>
        ALL_CERTS.find((x) => x.name === name),
      ).filter((x): x is Cert => Boolean(x)),
    [],
  );
  const shown = expanded ? visible : visible.slice(0, 20);
  const open = (cert: Cert, list: Cert[]) => {
    trigger.current = document.activeElement as HTMLElement;
    setModal({
      list,
      index: Math.max(
        0,
        list.findIndex((x) => x.pdf === cert.pdf),
      ),
    });
  };
  const close = useCallback(() => setModal(null), []);
  const setIndex = useCallback(
    (index: number) => setModal((m) => (m ? { ...m, index } : null)),
    [],
  );
  const statuses: StatusFilter[] = [
    "all",
    "active",
    "expiring",
    "historical",
    "no-expiry",
    "unknown",
  ];
  return (
    <SectionWrapper id="certifications" className="overflow-hidden">
      <FadeContainer>
        <RevealMask>
          <p className="mb-3 text-xs font-semibold uppercase text-primary">
            Mastery evidence
          </p>
        </RevealMask>
        <RevealMask delay={0.05}>
          <h2 className="font-display text-4xl font-bold text-white sm:text-6xl">
            The Mastery Constellation
          </h2>
        </RevealMask>
        <p className="mt-5 max-w-3xl text-base leading-relaxed text-white/68">
          A searchable evidence wall connecting credential records, capability
          lenses, lifecycle status, local certificate PDFs, and official issuer
          verification.
        </p>
      </FadeContainer>
      <div className="mt-10 grid gap-3 sm:grid-cols-3">
        <div className="rounded-3xl border border-primary/20 bg-primary/[0.07] p-5">
          <p className="font-display text-4xl font-bold text-primary">
            {ALL_CERTS.length}
          </p>
          <p className="mt-2 text-sm text-white/65">credential records</p>
        </div>
        <div className="rounded-3xl border border-sky-400/20 bg-sky-400/[0.06] p-5">
          <p className="font-display text-4xl font-bold text-sky-300">
            {PROVIDER_CONFIG.length - 1}
          </p>
          <p className="mt-2 text-sm text-white/65">technology ecosystems</p>
        </div>
        <div className="rounded-3xl border border-amber-400/20 bg-amber-400/[0.06] p-5">
          <p className="font-display text-4xl font-bold text-amber-300">2×</p>
          <p className="mt-2 text-sm text-white/65">
            proof layer: PDF + issuer
          </p>
        </div>
      </div>
      <div className="mt-8 rounded-3xl border border-white/10 bg-black/20 p-5">
        <p className="text-xs font-semibold uppercase text-primary">
          Ecosystem constellation
        </p>
        <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-8">
          {PROVIDER_CONFIG.filter((x) => x.key !== "all").map((x) => (
            <button
              key={x.key}
              type="button"
              aria-pressed={provider === x.key}
              onClick={() => setProvider(x.key)}
              className={`min-h-24 rounded-2xl border p-3 text-left ${provider === x.key ? "border-white/25 bg-white/[0.08]" : "border-white/8"}`}
            >
              <span
                className="block h-2 w-2 rounded-full"
                style={{ background: x.color }}
              />
              <span className="mt-3 block text-xs font-semibold text-white">
                {x.label}
              </span>
              <span className="mt-1 block text-xs text-white/48">
                {providerCounts[x.key]} records
              </span>
            </button>
          ))}
        </div>
      </div>
      <div className="mt-10">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-display text-2xl font-bold text-white">
            Featured proof signals
          </h3>
          <span className="text-xs text-primary">
            {featured.length} selected
          </span>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {featured.map((cert, i) => (
            <Card
              key={cert.pdf}
              cert={cert}
              delay={i * 0.03}
              onOpen={() => open(cert, featured)}
            />
          ))}
        </div>
      </div>
      <div className="mt-10 space-y-4 rounded-3xl border border-white/10 bg-white/[0.025] p-5">
        <div className="flex flex-wrap gap-2">
          {PROVIDER_CONFIG.map((x) => (
            <button
              key={x.key}
              type="button"
              aria-pressed={provider === x.key}
              onClick={() => {
                setProvider(x.key);
                setExpanded(false);
              }}
              className={`min-h-11 rounded-full border px-4 text-xs font-semibold ${provider === x.key ? "border-white/25 bg-white/[0.09] text-white" : "border-white/9 text-white/58"}`}
            >
              {x.label} {providerCounts[x.key]}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          {(["all", ...CERTIFICATION_CATEGORIES] as const).map((x) => (
            <button
              key={x}
              type="button"
              aria-pressed={category === x}
              onClick={() => {
                setCategory(x);
                setExpanded(false);
              }}
              className={`min-h-11 rounded-full border px-4 text-xs font-semibold ${category === x ? "border-primary/35 bg-primary/12 text-primary" : "border-white/9 text-white/58"}`}
            >
              {x === "all" ? "All capabilities" : x}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          {statuses.map((x) => (
            <button
              key={x}
              type="button"
              aria-pressed={status === x}
              onClick={() => {
                setStatus(x);
                setExpanded(false);
              }}
              className={`min-h-11 rounded-full border px-4 text-xs font-semibold ${status === x ? "border-amber-300/35 bg-amber-300/10 text-amber-100" : "border-white/9 text-white/58"}`}
            >
              {x === "all" ? "All statuses" : statusInfo[x].label}{" "}
              {statusCounts[x]}
            </button>
          ))}
        </div>
        <label className="relative block max-w-2xl">
          <span className="sr-only">Search credentials</span>
          <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
          <input
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setExpanded(false);
            }}
            placeholder="Search provider, capability, status, name, or ID"
            className="w-full rounded-2xl border border-white/10 bg-black/20 py-3.5 pl-11 pr-4 text-sm text-white placeholder:text-white/35"
          />
        </label>
      </div>
      <div
        className="mt-6 flex flex-wrap justify-between gap-3"
        aria-live="polite"
      >
        <p className="text-sm text-white/62">
          <b className="text-white">{visible.length}</b> matching records
        </p>
        <p className="flex items-center gap-2 text-xs text-white/50">
          <CalendarClock className="h-4 w-4" />
          Status derives from listed dates at view time.
        </p>
      </div>
      <AnimatePresence mode="wait">
        <motion.div
          key={`${provider}-${category}-${status}-${query}-${expanded}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5"
        >
          {shown.map((cert, i) => (
            <Card
              key={cert.pdf}
              cert={cert}
              delay={i * 0.01}
              onOpen={() => open(cert, visible)}
            />
          ))}
          {!visible.length && (
            <div className="col-span-full rounded-3xl border border-white/10 p-10 text-center">
              <p className="font-semibold text-white">
                No records match these filters.
              </p>
              <button
                type="button"
                onClick={() => {
                  setProvider("all");
                  setCategory("all");
                  setStatus("all");
                  setQuery("");
                }}
                className="mt-4 min-h-11 rounded-full border border-primary/25 px-5 text-sm text-primary"
              >
                Reset filters
              </button>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
      {visible.length > shown.length && (
        <div className="mt-8 text-center">
          <button
            type="button"
            onClick={() => setExpanded(true)}
            className="min-h-12 rounded-full border border-primary/25 bg-primary/10 px-6 text-sm font-semibold text-primary"
          >
            Reveal {visible.length - shown.length} more records
          </button>
        </div>
      )}
      <FadeContainer className="mt-12">
        <div className="glass flex flex-wrap items-center justify-between gap-5 rounded-3xl p-6">
          <div className="flex gap-3">
            <Award className="h-6 w-6 text-primary" />
            <div>
              <p className="font-semibold text-white">
                Evidence, not decorative logos.
              </p>
              <p className="mt-1 max-w-2xl text-sm text-white/60">
                Open the issuer link for current verification; historical
                records remain visible as part of the learning timeline.
              </p>
            </div>
          </div>
          <div className="flex gap-4">
            <a
              href="https://www.credly.com/users/anupam_roy/"
              target="_blank"
              rel="noreferrer"
              className="inline-flex min-h-11 items-center gap-2 text-sm text-primary"
            >
              <CheckCircle2 className="h-4 w-4" />
              Credly
            </a>
            <a
              href="https://www.linkedin.com/in/anupam--roy/"
              target="_blank"
              rel="noreferrer"
              className="inline-flex min-h-11 items-center gap-2 text-sm text-sky-300"
            >
              LinkedIn
              <ExternalLink className="h-4 w-4" />
            </a>
          </div>
        </div>
      </FadeContainer>
      <AnimatePresence>
        {modal && (
          <Modal
            list={modal.list}
            index={modal.index}
            setIndex={setIndex}
            close={close}
            returnFocus={trigger.current}
          />
        )}
      </AnimatePresence>
    </SectionWrapper>
  );
}
