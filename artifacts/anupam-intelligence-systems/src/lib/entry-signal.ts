export const ENTRY_SIGNAL_SESSION_KEY = "portfolio-entry-signal-seen-v1";

export interface EntrySignalEnvironment {
  hash: string;
  reducedMotion: boolean;
  seen: boolean;
}

interface StorageReader {
  getItem: (key: string) => string | null;
}

interface StorageWriter {
  setItem: (key: string, value: string) => void;
}

export function shouldAutoOpenEntrySignal({
  hash,
  reducedMotion,
  seen,
}: EntrySignalEnvironment) {
  const normalizedHash = hash.trim().toLowerCase();
  const isLandingEntry =
    normalizedHash === "" ||
    normalizedHash === "#" ||
    normalizedHash === "#hero";
  return isLandingEntry && !reducedMotion && !seen;
}

export function readEntrySignalSeen(storage: StorageReader | null) {
  try {
    return storage?.getItem(ENTRY_SIGNAL_SESSION_KEY) === "true";
  } catch {
    return false;
  }
}

export function markEntrySignalSeen(storage: StorageWriter | null) {
  try {
    storage?.setItem(ENTRY_SIGNAL_SESSION_KEY, "true");
  } catch {
    // A blocked storage API must never block access to the portfolio.
  }
}
