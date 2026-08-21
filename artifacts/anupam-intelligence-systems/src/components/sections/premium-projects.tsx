import { useState, type KeyboardEvent } from "react";
import {
  ChevronDown,
  ExternalLink,
  Github,
  Route,
  ShieldCheck,
} from "lucide-react";
import { projects, projectTabs } from "@/data/projects";
import type { Project } from "@/data/types";
import { SectionHeader } from "./section-header";
type Tab = "All Systems" | Project["tab"];
function keyNav(
  e: KeyboardEvent<HTMLButtonElement>,
  i: number,
  tabs: Tab[],
  select: (x: Tab) => void,
) {
  if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(e.key)) return;
  e.preventDefault();
  const n =
    e.key === "Home"
      ? 0
      : e.key === "End"
        ? tabs.length - 1
        : e.key === "ArrowRight"
          ? (i + 1) % tabs.length
          : (i - 1 + tabs.length) % tabs.length;
  select(tabs[n]);
  requestAnimationFrame(() =>
    e.currentTarget.parentElement
      ?.querySelectorAll<HTMLButtonElement>('[role="tab"]')
      [n]?.focus(),
  );
}
function Card({ project }: { project: Project }) {
  const flagship = project.rank === "flagship";
  const [open, setOpen] = useState(flagship);
  const live = project.live.includes("github.com")
    ? "Open notebook"
    : "Open live system";
  const id = `architecture-${project.name.replace(/[^a-z0-9]/gi, "-")}`;
  return (
    <article
      className={`rounded-[2rem] border bg-white/[0.03] p-5 sm:p-6 ${flagship ? "border-primary/28 lg:col-span-2" : "border-white/9"}`}
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex gap-2">
            <span className="rounded-full border border-primary/22 bg-primary/10 px-3 py-1.5 text-xs font-semibold uppercase text-primary">
              {flagship ? "Flagship system" : project.tab}
            </span>
            <span className="rounded-full border border-white/10 px-3 py-1.5 text-xs text-white/52">
              {project.rank}
            </span>
          </div>
          <h3 className="mt-4 font-display text-3xl font-bold text-white">
            {project.name}
          </h3>
        </div>
        <div className="flex gap-2">
          <a
            href={project.live}
            target="_blank"
            rel="noreferrer"
            className="inline-flex min-h-11 items-center gap-2 rounded-full border border-primary/22 px-4 text-xs font-semibold text-primary"
          >
            <ExternalLink className="h-4 w-4" />
            {live}
          </a>
          <a
            href={project.github}
            target="_blank"
            rel="noreferrer"
            className="inline-flex min-h-11 items-center gap-2 rounded-full border border-white/12 px-4 text-xs font-semibold text-white/72"
          >
            <Github className="h-4 w-4" />
            Source
          </a>
        </div>
      </div>
      <p className="mt-5 text-base font-semibold leading-relaxed text-white/88">
        {project.oneLiner}
      </p>
      <div className="mt-4 rounded-2xl border border-white/8 bg-black/20 p-4">
        <p className="text-xs font-semibold uppercase text-white/42">
          Problem addressed
        </p>
        <p className="mt-2 text-sm leading-relaxed text-white/68">
          {project.problem}
        </p>
      </div>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        aria-controls={id}
        className="mt-5 inline-flex min-h-11 items-center gap-2 rounded-full border border-primary/22 bg-primary/10 px-4 text-xs font-semibold text-primary"
      >
        <Route className="h-4 w-4" />
        {open ? "Hide case study" : "Inspect case study"}
        <ChevronDown className={`h-4 w-4 ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div id={id} className="mt-5 border-t border-white/9 pt-5">
          {project.visualFlow && (
            <ol className="grid gap-2 md:grid-cols-4">
              {project.visualFlow.map((x, i) => (
                <li
                  key={`${x}-${i}`}
                  className="rounded-2xl border border-primary/18 bg-primary/[0.055] p-3 text-center text-xs font-semibold text-primary/90"
                >
                  <span className="mb-2 block text-xs text-primary/55">
                    STEP {String(i + 1).padStart(2, "0")}
                  </span>
                  {x}
                </li>
              ))}
            </ol>
          )}
          <div className="mt-5 grid gap-3 md:grid-cols-2">
            {project.architecture.map((x, i) => (
              <div
                key={x}
                className="flex gap-3 rounded-2xl border border-white/9 bg-black/20 p-4 text-sm leading-relaxed text-white/66"
              >
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-primary/[0.07] text-xs text-primary">
                  {String(i + 1).padStart(2, "0")}
                </span>
                {x}
              </div>
            ))}
          </div>
          <div className="mt-4 flex gap-3 rounded-2xl border border-white/8 p-4">
            <ShieldCheck className="h-4 w-4 shrink-0 text-primary" />
            <p className="text-xs leading-relaxed text-white/55">
              Follow the source link for implementation evidence and the
              live-system link for current availability.
            </p>
          </div>
        </div>
      )}
      <div className="mt-5 flex flex-wrap gap-2">
        {project.tech.map((x) => (
          <span
            key={x}
            className="rounded-full border border-white/10 px-3 py-1.5 text-xs text-white/68"
          >
            {x}
          </span>
        ))}
      </div>
    </article>
  );
}
export function PremiumProjects() {
  const [active, setActive] = useState<Tab>("All Systems");
  const tabs: Tab[] = ["All Systems", ...projectTabs];
  const visible =
    active === "All Systems"
      ? projects
      : projects.filter((x) => x.tab === active);
  return (
    <section
      id="projects"
      className="border-y border-white/5 bg-white/[0.015] py-20 md:py-28"
    >
      <div className="mx-auto w-[92%] max-w-7xl">
        <SectionHeader
          eyebrow="Projects / AI Lab"
          title="A ranked systems lab with inspectable architecture."
          description="Flagship production patterns lead; RAG, computer vision, and earlier frontend experiments remain available as a transparent engineering timeline."
        />
        <div
          className="mt-8 flex gap-2 overflow-x-auto pb-2"
          role="tablist"
          aria-label="Project collections"
        >
          {tabs.map((tab, i) => (
            <button
              key={tab}
              type="button"
              role="tab"
              aria-selected={active === tab}
              tabIndex={active === tab ? 0 : -1}
              onKeyDown={(e) => keyNav(e, i, tabs, setActive)}
              onClick={() => setActive(tab)}
              className={`min-h-11 shrink-0 rounded-full border px-4 text-sm font-semibold ${active === tab ? "border-primary/40 bg-primary/15 text-primary" : "border-white/10 text-white/58"}`}
            >
              {tab}
            </button>
          ))}
        </div>
        <div role="tabpanel" className="mt-8 grid gap-5 lg:grid-cols-2">
          {visible.map((p) => (
            <Card key={p.name} project={p} />
          ))}
        </div>
      </div>
    </section>
  );
}
