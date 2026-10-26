import { describe, expect, it } from "vitest";
import { createRateLimiter } from "./rate-limit";

describe("createRateLimiter", () => {
  it("blocks requests above the configured limit and recovers after the window", () => {
    const clock = { now: 0 };
    const limiter = createRateLimiter({ limit: 2, windowMs: 1_000, now: () => clock.now });
    expect(limiter("visitor")).toBe(false);
    expect(limiter("visitor")).toBe(false);
    expect(limiter("visitor")).toBe(true);
    clock.now = 1_001;
    expect(limiter("visitor")).toBe(false);
  });

  it("evicts the least recently seen key when over capacity", () => {
    const limiter = createRateLimiter({ limit: 5, windowMs: 60_000, maxKeys: 2, now: () => 0 });
    limiter("a");
    limiter("b");
    limiter("a");
    limiter("c");
    expect(limiter.has("a")).toBe(true);
    expect(limiter.has("b")).toBe(false);
    expect(limiter.size()).toBe(2);
  });

  it("sweeps keys whose window has passed", () => {
    const clock = { now: 0 };
    const limiter = createRateLimiter({ limit: 5, windowMs: 1_000, now: () => clock.now });
    for (let i = 0; i < 50; i += 1) limiter(`k${i}`);
    clock.now = 2_000;
    for (let i = 0; i < 50; i += 1) limiter("fresh");
    expect(limiter.size()).toBe(1);
  });
});
