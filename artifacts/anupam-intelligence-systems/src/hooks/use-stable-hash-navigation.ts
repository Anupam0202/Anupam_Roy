import { useEffect } from "react";
import { getHashTargetId } from "@/lib/stable-hash-navigation";
const TARGET_WAIT_MS = 3_000;
export function useStableHashNavigation(enabled = true) {
  useEffect(() => {
    if (!enabled) return;
    let observer: MutationObserver | null = null;
    let timeout: number | null = null;
    const stop = () => {
      observer?.disconnect();
      observer = null;
      if (timeout !== null) clearTimeout(timeout);
      timeout = null;
    };
    const navigate = (hash: string) => {
      stop();
      const id = getHashTargetId(hash);
      if (!id) return;
      const align = () => {
        const target = document.getElementById(id);
        if (!target) return false;
        target.scrollIntoView({
          behavior: matchMedia("(prefers-reduced-motion: reduce)").matches
            ? "auto"
            : "smooth",
          block: "start",
        });
        stop();
        return true;
      };
      if (align()) return;
      observer = new MutationObserver(() => align());
      observer.observe(document.body, { childList: true, subtree: true });
      timeout = window.setTimeout(stop, TARGET_WAIT_MS);
    };
    const click = (event: MouseEvent) => {
      const a = (event.target as Element | null)?.closest<HTMLAnchorElement>(
        'a[href^="#"]',
      );
      if (!a?.hash) return;
      event.preventDefault();
      history.pushState(null, "", a.hash);
      navigate(a.hash);
    };
    const location = () => navigate(window.location.hash);
    document.addEventListener("click", click);
    addEventListener("hashchange", location);
    addEventListener("popstate", location);
    if (window.location.hash) navigate(window.location.hash);
    return () => {
      document.removeEventListener("click", click);
      removeEventListener("hashchange", location);
      removeEventListener("popstate", location);
      stop();
    };
  }, [enabled]);
}
