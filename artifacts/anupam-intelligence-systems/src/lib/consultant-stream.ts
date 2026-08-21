export type ConsultantStreamMode = "gemini" | "offline";

export type ConsultantStreamEvent =
  | { type: "content"; content: string; mode?: ConsultantStreamMode }
  | { type: "done"; mode?: ConsultantStreamMode }
  | { type: "error"; error: string; mode?: ConsultantStreamMode }
  | { type: "malformed" };

function parseFrame(frame: string): ConsultantStreamEvent[] {
  const events: ConsultantStreamEvent[] = [];

  for (const line of frame.split(/\r?\n/)) {
    if (!line.startsWith("data:")) continue;
    const data = line.slice(5).trimStart();
    if (!data) continue;

    try {
      const payload = JSON.parse(data) as {
        content?: unknown;
        done?: unknown;
        error?: unknown;
        mode?: unknown;
      };
      const mode =
        payload.mode === "gemini" || payload.mode === "offline"
          ? payload.mode
          : undefined;
      if (typeof payload.content === "string" && payload.content) {
        events.push({ type: "content", content: payload.content, mode });
      }
      if (typeof payload.error === "string" && payload.error) {
        events.push({ type: "error", error: payload.error, mode });
      }
      if (payload.done === true) {
        events.push({ type: "done", mode });
      }
    } catch {
      events.push({ type: "malformed" });
    }
  }

  return events;
}

export function createConsultantStreamParser() {
  let buffer = "";

  return {
    push(chunk: string) {
      buffer += chunk;
      const frames = buffer.split(/\r?\n\r?\n/);
      buffer = frames.pop() ?? "";
      return frames.flatMap(parseFrame);
    },
    finish() {
      const final = buffer.trim() ? parseFrame(buffer) : [];
      buffer = "";
      return final;
    },
  };
}
