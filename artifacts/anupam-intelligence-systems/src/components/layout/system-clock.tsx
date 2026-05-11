import { useEffect, useState } from "react";

export default function SystemClock() {
  const [time, setTime] = useState("");

  useEffect(() => {
    const tick = () =>
      setTime(
        new Date().toLocaleTimeString("en-US", {
          hour12: false,
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        })
      );
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="glass fixed bottom-24 left-6 z-50 hidden rounded-full px-5 py-3 text-xs text-muted-foreground lg:flex items-center gap-3 border border-white/8">
      <span className="text-primary font-mono tracking-widest">SYS TIME</span>
      <span className="font-mono tabular-nums">{time}</span>
    </div>
  );
}
