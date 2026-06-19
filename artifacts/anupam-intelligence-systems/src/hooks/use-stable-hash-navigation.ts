import { useEffect } from "react";
import { getHashTargetId, HASH_SCROLL_DELAYS } from "@/lib/stable-hash-navigation";

const HASH_WATCH_DURATION_MS = 9_000;
const HASH_WATCH_INTERVAL_MS = 300;

export function useStableHashNavigation(enabled = true) {
  useEffect(() => {
    if (!enabled) return;

    const timers = new Set<number>();
    const intervals = new Set<number>();

    const scheduleScroll = (hash: string) => {
      const targetId = getHashTargetId(hash);
      if (!targetId) return;
      const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

      const alignTarget = (index: number) => {
        const target = document.getElementById(targetId);
        if (!target) return false;
        target.scrollIntoView({
          behavior: index === 0 && !reducedMotion ? "smooth" : "auto",
          block: "start",
        });
        return true;
      };

      HASH_SCROLL_DELAYS.forEach((delay, index) => {
        const timer = window.setTimeout(() => {
          timers.delete(timer);
          alignTarget(index);
        }, delay);
        timers.add(timer);
      });

      const startedAt = Date.now();
      const interval = window.setInterval(() => {
        const expired = Date.now() - startedAt > HASH_WATCH_DURATION_MS;
        const aligned = alignTarget(1);
        if (aligned || expired) {
          window.clearInterval(interval);
          intervals.delete(interval);
        }
      }, HASH_WATCH_INTERVAL_MS);
      intervals.add(interval);
    };

    const onClick = (event: MouseEvent) => {
      const anchor = (event.target as Element | null)?.closest<HTMLAnchorElement>('a[href^="#"]');
      if (anchor) scheduleScroll(anchor.hash);
    };
    const onHashChange = () => scheduleScroll(window.location.hash);

    document.addEventListener("click", onClick);
    window.addEventListener("hashchange", onHashChange);
    if (window.location.hash) scheduleScroll(window.location.hash);

    return () => {
      document.removeEventListener("click", onClick);
      window.removeEventListener("hashchange", onHashChange);
      timers.forEach((timer) => window.clearTimeout(timer));
      intervals.forEach((interval) => window.clearInterval(interval));
    };
  }, [enabled]);
}
