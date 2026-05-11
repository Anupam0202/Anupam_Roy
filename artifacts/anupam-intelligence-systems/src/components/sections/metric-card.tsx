import type { Metric } from "@/data/types";

export function MetricCard({ metric }: { metric: Metric }) {
  return (
    <div className="rounded-2xl border border-white/8 bg-white/[0.035] p-5">
      <div className="font-display text-3xl font-bold text-primary md:text-4xl">{metric.value}</div>
      <div className="mt-2 text-sm font-semibold text-white">{metric.label}</div>
      {metric.detail && <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{metric.detail}</p>}
    </div>
  );
}
