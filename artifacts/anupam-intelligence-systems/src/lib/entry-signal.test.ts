import { describe, expect, it } from "vitest";
import { shouldAutoOpenEntrySignal } from "./entry-signal";

describe("portfolio entry signal", () => {
  it("opens once for a motion-enabled landing visit", () => {
    expect(
      shouldAutoOpenEntrySignal({
        hash: "",
        reducedMotion: false,
        seen: false,
      }),
    ).toBe(true);
  });

  it("does not interrupt deep links", () => {
    expect(
      shouldAutoOpenEntrySignal({
        hash: "#certifications",
        reducedMotion: false,
        seen: false,
      }),
    ).toBe(false);
  });

  it("respects reduced motion and prior session state", () => {
    expect(
      shouldAutoOpenEntrySignal({
        hash: "#hero",
        reducedMotion: true,
        seen: false,
      }),
    ).toBe(false);
    expect(
      shouldAutoOpenEntrySignal({
        hash: "#hero",
        reducedMotion: false,
        seen: true,
      }),
    ).toBe(false);
  });
});
