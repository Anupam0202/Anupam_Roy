import { useEffect, useState } from "react";
import { Clock3, RotateCcw } from "lucide-react";
import { formatSystemTime } from "@/lib/system-time";

interface SystemTimeDockProps {
  onReplay: () => void;
}

export default function SystemTimeDock({ onReplay }: SystemTimeDockProps) {
  const [snapshot, setSnapshot] = useState(() => formatSystemTime(new Date()));

  useEffect(() => {
    const interval = window.setInterval(() => setSnapshot(formatSystemTime(new Date())), 1_000);
    return () => window.clearInterval(interval);
  }, []);

  return (
    <aside
      className="fixed bottom-3 left-3 z-[90] flex max-w-[calc(100vw-5.75rem)] items-center gap-2 border border-white/10 bg-[#07110f]/94 p-1.5 shadow-[0_8px_36px_rgba(0,0,0,0.38)] backdrop-blur-xl sm:bottom-8 sm:left-8 sm:max-w-none sm:gap-3 sm:p-2"
      aria-label="Browser-local system time"
      data-system-time-dock="true"
    >
      <div className="flex min-h-10 min-w-0 items-center gap-2 px-1.5 sm:px-2" aria-live="off">
        <Clock3 className="h-3.5 w-3.5 shrink-0 text-primary" />
        <div className="min-w-0">
          <time className="block font-mono text-[11px] font-bold text-white sm:text-xs">{snapshot.time}</time>
          <span className="block truncate font-mono text-[8px] uppercase text-white/42 sm:hidden">Portfolio ready</span>
          <span className="hidden font-mono text-[9px] text-white/42 sm:block">
            {snapshot.timeZone} | {snapshot.offset} | Portfolio ready
          </span>
        </div>
      </div>
      <button
        type="button"
        onClick={onReplay}
        className="flex h-10 w-10 shrink-0 items-center justify-center border border-white/10 text-white/55 transition hover:border-primary/35 hover:bg-primary/8 hover:text-primary sm:w-auto sm:gap-2 sm:px-3"
        aria-label="Replay intro"
        title="Replay intro"
      >
        <RotateCcw className="h-3.5 w-3.5" />
        <span className="hidden text-[10px] font-semibold uppercase sm:inline">Replay intro</span>
      </button>
    </aside>
  );
}
