import { useCallback, useEffect, useRef, useState } from "react";
import { useReducedMotion } from "framer-motion";
import { getIntroDuration, markIntroSeen, shouldShowIntro } from "@/lib/intro-session";

function getSessionStorage() {
  try {
    return window.sessionStorage;
  } catch {
    return null;
  }
}

export function useIntroSession() {
  const reducedMotion = useReducedMotion();
  const [introOpen, setIntroOpen] = useState(() => {
    const storage = getSessionStorage();
    return storage ? shouldShowIntro(storage) : true;
  });
  const replayFocusRef = useRef<HTMLElement | null>(null);

  const closeIntro = useCallback(() => {
    const storage = getSessionStorage();
    if (storage) markIntroSeen(storage);
    setIntroOpen(false);
    const replayFocus = replayFocusRef.current;
    replayFocusRef.current = null;
    if (replayFocus) window.setTimeout(() => replayFocus.focus(), 0);
  }, []);

  const replayIntro = useCallback(() => {
    replayFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    setIntroOpen(true);
  }, []);

  useEffect(() => {
    if (!introOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const timer = window.setTimeout(closeIntro, getIntroDuration(Boolean(reducedMotion)));
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeIntro();
    };

    document.addEventListener("keydown", onKeyDown);
    return () => {
      window.clearTimeout(timer);
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [closeIntro, introOpen, reducedMotion]);

  return {
    introOpen,
    reducedMotion: Boolean(reducedMotion),
    replayIntro,
    skipIntro: closeIntro,
  };
}
