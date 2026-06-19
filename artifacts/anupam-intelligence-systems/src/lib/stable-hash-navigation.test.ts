import { describe, expect, it } from "vitest";
import { HASH_SCROLL_DELAYS, getHashTargetId } from "./stable-hash-navigation";

describe("stable hash navigation", () => {
  it("extracts safe internal target ids", () => {
    expect(getHashTargetId("#systems")).toBe("systems");
    expect(getHashTargetId("#portfolio%20proof")).toBe("portfolio proof");
    expect(getHashTargetId("https://example.com/#systems")).toBeNull();
    expect(getHashTargetId("#")).toBeNull();
  });

  it("rechecks the anchor after lazy sections can settle", () => {
    expect(HASH_SCROLL_DELAYS[0]).toBe(0);
    expect(HASH_SCROLL_DELAYS.at(-1)).toBeGreaterThanOrEqual(1_000);
    expect(HASH_SCROLL_DELAYS.length).toBeGreaterThanOrEqual(3);
  });
});
