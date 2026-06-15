import { describe, expect, it } from "vitest";
import { getIntroDuration, INTRO_SESSION_KEY, markIntroSeen, shouldShowIntro } from "./intro-session";

function createStorage(initial?: string) {
  const values = new Map<string, string>();
  if (initial) values.set(INTRO_SESSION_KEY, initial);
  return {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => values.set(key, value),
  };
}

describe("intro session policy", () => {
  it("shows the intro on the first visit and skips after completion", () => {
    const storage = createStorage();
    expect(shouldShowIntro(storage)).toBe(true);
    expect(markIntroSeen(storage)).toBe(true);
    expect(shouldShowIntro(storage)).toBe(false);
  });

  it("does not change the completed policy when replay is requested", () => {
    const storage = createStorage("seen");
    expect(shouldShowIntro(storage)).toBe(false);
    expect(shouldShowIntro(storage)).toBe(false);
  });

  it("fails open when session storage is unavailable", () => {
    const storage = {
      getItem: () => {
        throw new Error("blocked");
      },
      setItem: () => {
        throw new Error("blocked");
      },
    };
    expect(shouldShowIntro(storage)).toBe(true);
    expect(markIntroSeen(storage)).toBe(false);
  });

  it("uses a near-instant reveal for reduced motion", () => {
    expect(getIntroDuration(true)).toBeLessThan(200);
    expect(getIntroDuration(false)).toBeLessThanOrEqual(1_600);
  });
});
