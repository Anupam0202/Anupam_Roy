import { describe, expect, it } from "vitest";
import { formatSystemTime } from "./system-time";

describe("formatSystemTime", () => {
  it("formats a truthful IANA timezone and UTC offset", () => {
    const snapshot = formatSystemTime(new Date("2026-06-15T10:20:30.000Z"), "UTC");
    expect(snapshot).toEqual({
      time: "10:20:30",
      timeZone: "UTC",
      offset: "UTC+00:00",
    });
  });

  it("formats half-hour offsets", () => {
    const snapshot = formatSystemTime(new Date("2026-06-15T10:20:30.000Z"), "Asia/Kolkata");
    expect(snapshot.time).toBe("15:50:30");
    expect(snapshot.offset).toBe("UTC+05:30");
  });
});
