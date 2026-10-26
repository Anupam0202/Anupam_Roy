import { describe, expect, it } from "vitest";
import { DailyBudget, disabledByConfig, rateLimitSignal, secondsUntilUtcMidnight } from "./providers";

const NOW = Date.parse("2026-10-25T12:00:00Z");
const response = (status: number, headers: Record<string, string> = {}, text = "") => ({ status, headers: new Headers(headers), url: "https://x", text });

describe("DailyBudget", () => {
  // resend's daily budget is 100.
  it("warns at 50%, pauses enrichment at 80% and optional calls at 95%, stops at 100%", () => {
    const budget = new DailyBudget();
    const take = (n: number) => {
      for (let i = 0; i < n; i += 1) expect(budget.take("resend", NOW, "core")).toBe(true);
    };
    take(49);
    expect(budget.usage("resend", NOW).level).toBe("normal");
    take(1);
    expect(budget.usage("resend", NOW).level).toBe("warning");
    take(30);
    expect(budget.usage("resend", NOW).level).toBe("enrichment-paused");
    expect(budget.take("resend", NOW, "enrichment")).toBe(false);
    expect(budget.take("resend", NOW, "optional")).toBe(true);
    take(14);
    expect(budget.usage("resend", NOW).level).toBe("optional-paused");
    expect(budget.take("resend", NOW, "optional")).toBe(false);
    take(5);
    expect(budget.usage("resend", NOW)).toEqual({ used: 100, limit: 100, level: "exhausted" });
    expect(budget.take("resend", NOW, "core")).toBe(false);
  });

  it("resets at midnight UTC", () => {
    const budget = new DailyBudget();
    for (let i = 0; i < 100; i += 1) budget.take("resend", NOW);
    expect(budget.take("resend", Date.parse("2026-10-25T23:59:59Z"))).toBe(false);
    expect(budget.take("resend", Date.parse("2026-10-26T00:00:00Z"))).toBe(true);
    expect(budget.usage("resend", Date.parse("2026-10-26T00:00:01Z")).used).toBe(1);
  });

  it("does not limit providers without a budget", () => {
    expect(new DailyBudget().usage("openalex", NOW)).toEqual({ used: 0, level: "normal" });
  });
});

describe("secondsUntilUtcMidnight", () => {
  it("counts to the next UTC midnight", () => {
    expect(secondsUntilUtcMidnight(NOW)).toBe(12 * 3_600);
    expect(secondsUntilUtcMidnight(Date.parse("2026-10-25T23:59:59.500Z"))).toBe(1);
  });
});

describe("rateLimitSignal", () => {
  it("reads Retry-After, reset times and GitHub's secondary limits", () => {
    expect(rateLimitSignal("npm", response(429, { "retry-after": "7" }), NOW)).toBe(7);
    expect(rateLimitSignal("npm", response(429), NOW)).toBe(60);
    expect(rateLimitSignal("crossref", response(503, { "retry-after": "5" }), NOW)).toBe(5);
    expect(rateLimitSignal("crossref", response(503), NOW)).toBeNull();
    expect(rateLimitSignal("github", response(403, { "x-ratelimit-remaining": "0", "x-ratelimit-reset": String(NOW / 1000 + 90) }), NOW)).toBe(90);
    expect(rateLimitSignal("github", response(403, { "retry-after": "30" }), NOW)).toBe(30);
    expect(rateLimitSignal("github", response(403, {}, '{"message":"You have exceeded a secondary rate limit"}'), NOW)).toBe(60);
    expect(rateLimitSignal("github", response(403, {}, '{"message":"Resource not accessible"}'), NOW)).toBeNull();
    expect(rateLimitSignal("npm", response(403, { "retry-after": "30" }), NOW)).toBeNull();
    expect(rateLimitSignal("github", response(200), NOW)).toBeNull();
  });
});

describe("disabledByConfig", () => {
  it("keeps only known provider ids", () => {
    expect(disabledByConfig({ PROVIDERS_DISABLED: " GitHub ,npm,npm,unknown," })).toEqual(["github", "npm"]);
    expect(disabledByConfig({})).toEqual([]);
  });
});
