export const HASH_SCROLL_DELAYS = [0, 240, 720, 1_400, 2_800, 4_800] as const;

export function getHashTargetId(href: string) {
  if (!href.startsWith("#") || href.length < 2) return null;
  try {
    return decodeURIComponent(href.slice(1));
  } catch {
    return null;
  }
}
