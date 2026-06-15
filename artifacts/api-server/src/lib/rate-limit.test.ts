import { describe, expect, it, vi } from "vitest";
import { createRateLimiter } from "./rate-limit";

describe("createRateLimiter", () => {
  it("blocks requests above the configured limit and recovers after the window", () => {
    vi.useFakeTimers();
    const limiter = createRateLimiter({ limit: 2, windowMs: 1_000 });

    expect(limiter("visitor")).toBe(false);
    expect(limiter("visitor")).toBe(false);
    expect(limiter("visitor")).toBe(true);

    vi.advanceTimersByTime(1_001);
    expect(limiter("visitor")).toBe(false);
    vi.useRealTimers();
  });
});
