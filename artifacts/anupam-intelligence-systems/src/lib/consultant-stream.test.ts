import { describe, expect, it } from "vitest";
import { createConsultantStreamParser } from "./consultant-stream";

describe("consultant SSE parser", () => {
  it("retains split events and emits content exactly once", () => {
    const parser = createConsultantStreamParser();
    expect(parser.push('data: {"content":"Hel')).toEqual([]);
    expect(
      parser.push('lo","mode":"gemini"}\n\ndata: {"done":true}\n\n'),
    ).toEqual([
      { type: "content", content: "Hello", mode: "gemini" },
      { type: "done", mode: undefined },
    ]);
  });

  it("reports malformed and error events without throwing", () => {
    const parser = createConsultantStreamParser();
    expect(
      parser.push(
        'data: not-json\n\ndata: {"error":"quota","mode":"offline"}\n\n',
      ),
    ).toEqual([
      { type: "malformed" },
      { type: "error", error: "quota", mode: "offline" },
    ]);
  });

  it("flushes a final event without a trailing separator", () => {
    const parser = createConsultantStreamParser();
    parser.push('data: {"content":"final"}');
    expect(parser.finish()).toEqual([
      { type: "content", content: "final", mode: undefined },
    ]);
  });
});
