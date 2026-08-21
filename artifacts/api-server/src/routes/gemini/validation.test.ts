import { describe, expect, it } from "vitest";
import { isJsonContentType, normalizeChatPayload } from "./validation";

describe("Gemini chat validation", () => {
  it("accepts only JSON content types", () => {
    expect(isJsonContentType("application/json; charset=utf-8")).toBe(true);
    expect(isJsonContentType("text/plain")).toBe(false);
    expect(isJsonContentType(undefined)).toBe(false);
  });

  it("requires non-empty content and bounds its length", () => {
    expect(normalizeChatPayload({ content: "   " })).toBeNull();
    expect(
      normalizeChatPayload({ content: "a".repeat(2_000) })?.content,
    ).toHaveLength(1_500);
  });

  it("filters roles and bounds recent history", () => {
    const history = Array.from({ length: 12 }, (_, index) => ({
      role: index === 2 ? "system" : index % 2 ? "assistant" : "user",
      content: `message-${index}`,
    }));
    const payload = normalizeChatPayload({ content: "hello", history });
    expect(payload?.history).toHaveLength(8);
    expect(
      payload?.history.every(
        (item) => item.role === "user" || item.role === "model",
      ),
    ).toBe(true);
    expect(
      payload?.history.some((item) => item.parts[0]?.text === "message-2"),
    ).toBe(false);
  });
});
