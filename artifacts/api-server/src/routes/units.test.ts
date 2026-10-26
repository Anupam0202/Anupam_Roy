import { describe, expect, it } from "vitest";
import { generationConfigFor, isModelUnavailable, resolveGeminiModel, thinkingConfigFor } from "./ai";
import { redact } from "./client-error";
import { addressDomain, validateContact } from "./contact";
import { githubTtlSeconds } from "./repository";

describe("Gemini settings", () => {
  it("never sends both a thinking budget and a thinking level", () => {
    expect(thinkingConfigFor("gemini-2.5-flash")).toEqual({ thinkingBudget: 0 });
    expect(thinkingConfigFor("gemini-2.5-flash-lite")).toEqual({ thinkingBudget: 0 });
    expect(thinkingConfigFor("gemini-3.8-flash")).toEqual({ thinkingLevel: "low" });
    expect(thinkingConfigFor("gemini-3-pro-preview")).toEqual({ thinkingLevel: "low" });
    expect(thinkingConfigFor("gemini-2.5-pro")).toBeUndefined();
    expect(generationConfigFor("gemini-2.5-pro")).not.toHaveProperty("thinkingConfig");
  });

  it("resolves the configured model or the default", () => {
    expect(resolveGeminiModel({})).toBe("gemini-3.8-flash");
    expect(resolveGeminiModel({ GEMINI_MODEL: " gemini-2.5-flash " })).toBe("gemini-2.5-flash");
    expect(resolveGeminiModel({ GEMINI_MODEL: "models/../x" })).toBe("gemini-3.8-flash");
  });

  it("recognises a missing model, and nothing else", () => {
    expect(isModelUnavailable(404, "")).toBe(true);
    expect(isModelUnavailable(400, '{"error":{"message":"models/gemini-x is not found for API version v1beta"}}')).toBe(true);
    expect(isModelUnavailable(400, '{"error":{"message":"Model gemini-x is not supported for generateContent."}}')).toBe(true);
    expect(isModelUnavailable(400, '{"error":{"message":"API key not found. Please pass a valid API key."}}')).toBe(false);
    expect(isModelUnavailable(400, '{"error":{"message":"Invalid JSON payload"}}')).toBe(false);
    expect(isModelUnavailable(429, "model not found")).toBe(false);
    expect(isModelUnavailable(503, "")).toBe(false);
  });
});

describe("GitHub cache lifetimes", () => {
  it("follow the spec per resource", () => {
    expect(githubTtlSeconds("/repos/o/r")).toBe(600);
    expect(githubTtlSeconds("/repos/o/r/readme")).toBe(1_800);
    expect(githubTtlSeconds("/repos/o/r/contents/package.json")).toBe(1_800);
    expect(githubTtlSeconds("/repos/o/r/contents")).toBe(600);
    expect(githubTtlSeconds("/repos/o/r/releases?per_page=5")).toBe(900);
    expect(githubTtlSeconds("/repos/o/r/languages")).toBe(3_600);
  });
});

describe("validateContact", () => {
  it("keeps the subject on one line and the message's line breaks", () => {
    const out = validateContact({ name: "Ada\u0000", email: "A@B.co", subject: "Hi\r\nBcc: x", message: "Line one\r\nline two is long enough" });
    expect(out).toEqual({ name: "Ada", email: "a@b.co", subject: "Hi Bcc: x", message: "Line one\nline two is long enough" });
  });
});

describe("addressDomain", () => {
  it("keeps only the domain of a bare or named address", () => {
    expect(addressDomain("Someone@Example.COM")).toBe("example.com");
    expect(addressDomain("Anupam Roy Portfolio <onboarding@resend.dev>")).toBe("resend.dev");
    expect(addressDomain("no-at-sign")).toBe("no-at-sign");
    expect(addressDomain("trailing@")).toBe("unknown");
  });
});

describe("client error redaction", () => {
  it("replaces email-like strings and runs in linear time on hostile input", () => {
    expect(redact("boom for ada@example.com at /x")).toBe("boom for [email] at /x");
    for (const hostile of ["a".repeat(5_000) + "@", "@".repeat(5_000), "a@".repeat(2_500), `${"x".repeat(64)}@${"y".repeat(4_000)}`]) {
      const t = performance.now();
      redact(hostile);
      expect(performance.now() - t).toBeLessThan(50);
    }
  });
});
