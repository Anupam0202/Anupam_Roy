import { skillGroups } from "@/data/skills";

export function SkillCloud() {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
      {skillGroups.map((group) => (
        <div
          key={group.title}
          className="rounded-2xl border border-white/8 bg-white/[0.03] p-5"
        >
          <h3 className="font-display text-base font-semibold text-white">
            {group.title}
          </h3>
          <div className="mt-4 flex flex-wrap gap-2">
            {group.skills.map((skill) => (
              <span
                key={skill}
                className="rounded-full border border-primary/15 bg-primary/5 px-3 py-1.5 text-xs font-medium text-primary/80"
              >
                {skill}
              </span>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
