export const INTRO_SESSION_KEY = "synapseops:intro-seen:v1";
const STANDARD_DURATION_MS = 1_550;
const REDUCED_MOTION_DURATION_MS = 120;

export interface SessionStorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

export function shouldShowIntro(storage: SessionStorageLike) {
  try {
    return storage.getItem(INTRO_SESSION_KEY) !== "seen";
  } catch {
    return true;
  }
}

export function markIntroSeen(storage: SessionStorageLike) {
  try {
    storage.setItem(INTRO_SESSION_KEY, "seen");
    return true;
  } catch {
    return false;
  }
}

export function getIntroDuration(reducedMotion: boolean) {
  return reducedMotion ? REDUCED_MOTION_DURATION_MS : STANDARD_DURATION_MS;
}
