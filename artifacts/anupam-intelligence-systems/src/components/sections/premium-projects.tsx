import { useState } from "react";
import { ChevronDown, ExternalLink, Github, Network } from "lucide-react";
import { projects, projectTabs } from "@/data/projects";
import type { Project } from "@/data/types";
import { SectionHeader } from "./section-header";

type ProjectTab = "All Systems" | Project["tab"];

function ArchitectureFlow({ steps }: { steps: string[] }) {
  return (
    <div className="mt-5 grid gap-2 md:grid-cols-4">
      {steps.map((step, index) => (
        <div key={`${step}-${index}`} className="rounded-xl border border-primary/15 bg-primary/[0.045] p-3 text-center text-xs font-medium text-primary/90">
          {step}
        </div>
      ))}
    </div>
  );
}

function ProjectCard({ project }: { project: Project }) {
  const featured = project.rank === "flagship";
  const [showArchitecture, setShowArchitecture] = useState(featured);

  return (
    <article className={`rounded-3xl border bg-white/[0.03] p-5 ${featured ? "border-primary/25 lg:col-span-2" : "border-white/8"}`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="text-xs font-semibold uppercase text-primary">{project.rank === "flagship" ? "Flagship System" : project.tab}</div>
          <h3 className="mt-2 font-display text-2xl font-bold text-white">{project.name}</h3>
        </div>
        <div className="flex gap-2">
          <a href={project.live} target="_blank" rel="noreferrer" className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/70 hover:text-white" aria-label={`${project.name} live site`}>
            <ExternalLink className="h-4 w-4" />
          </a>
          <a href={project.github} target="_blank" rel="noreferrer" className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/70 hover:text-white" aria-label={`${project.name} GitHub`}>
            <Github className="h-4 w-4" />
          </a>
        </div>
      </div>
      <p className="mt-4 text-base font-medium leading-relaxed text-white/85">{project.oneLiner}</p>
      <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{project.problem}</p>

      <div className="mt-5 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setShowArchitecture((value) => !value)}
          aria-expanded={showArchitecture}
          className="inline-flex min-h-11 items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-2 text-xs font-semibold text-primary transition hover:bg-primary/15"
        >
          {showArchitecture ? "Hide architecture" : "View architecture"}
          <ChevronDown className={`h-3.5 w-3.5 transition-transform ${showArchitecture ? "rotate-180" : ""}`} />
        </button>
      </div>

      {showArchitecture && (
        <>
          {project.visualFlow && <ArchitectureFlow steps={project.visualFlow} />}

          <div className="mt-5 grid gap-2">
            {project.architecture.slice(0, featured ? 7 : 4).map((item) => (
              <div key={item} className="flex gap-2 rounded-xl border border-white/8 bg-black/20 p-3 text-xs leading-relaxed text-muted-foreground">
                <Network className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-primary" />
                <span>{item}</span>
              </div>
            ))}
          </div>
        </>
      )}

      <div className="mt-5 flex flex-wrap gap-2">
        {project.tech.map((tech) => (
          <span key={tech} className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5 text-xs text-white/70">{tech}</span>
        ))}
      </div>
    </article>
  );
}

export function PremiumProjects() {
  const [activeTab, setActiveTab] = useState<ProjectTab>("All Systems");
  const tabs: ProjectTab[] = ["All Systems", ...projectTabs];
  const visible = activeTab === "All Systems" ? projects : projects.filter((project) => project.tab === activeTab);

  return (
    <section id="projects" className="border-y border-white/5 bg-white/[0.015] py-20 md:py-28">
      <div className="mx-auto w-[92%] max-w-7xl">
        <SectionHeader
          eyebrow="Projects / AI Lab"
          title="One ranked project lab for every system."
          description="A single project section covers flagship AI systems, RAG builds, ML research, and older frontend experiments without duplicating separate project surfaces."
        />

        <div className="mt-8 flex flex-wrap gap-2">
          {tabs.map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              aria-pressed={activeTab === tab}
              className={`min-h-11 rounded-full border px-4 py-2 text-sm font-medium transition ${activeTab === tab ? "border-primary/40 bg-primary/15 text-primary" : "border-white/10 bg-white/[0.03] text-white/55 hover:text-white"}`}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="mt-8 grid gap-5 lg:grid-cols-2">
          {visible.map((project) => <ProjectCard key={project.name} project={project} />)}
        </div>
      </div>
    </section>
  );
}
