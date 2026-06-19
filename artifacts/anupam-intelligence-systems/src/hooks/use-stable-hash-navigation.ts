import { useEffect } from "react";
import { getHashTargetId, HASH_SCROLL_DELAYS } from "@/lib/stable-hash-navigation";

export function useStableHashNavigation() {
  useEffect(() => {
    const timers = new Set<number>();

    const scheduleScroll = (hash: string) => {
      const targetId = getHashTargetId(hash);
      if (!targetId) return;
      const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

      HASH_SCROLL_DELAYS.forEach((delay, index) => {
        const timer = window.setTimeout(() => {
          timers.delete(timer);
          document.getElementById(targetId)?.scrollIntoView({
            behavior: index === 0 && !reducedMotion ? "smooth" : "auto",
            block: "start",
          });
        }, delay);
        timers.add(timer);
      });
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
    };
  }, []);
}
