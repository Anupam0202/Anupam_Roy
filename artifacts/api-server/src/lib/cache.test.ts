import { describe, expect, it } from "vitest";
import { LruCache } from "./cache";

const entry = (value: string, bytes?: number) => ({ value, storedAt: 0, bytes });

describe("LruCache", () => {
  it("evicts the least recently used entry", () => {
    const cache = new LruCache<string>(2);
    cache.set("a", entry("a"));
    cache.set("b", entry("b"));
    cache.get("a");
    cache.set("c", entry("c"));
    expect(cache.get("b")).toBeUndefined();
    expect(cache.get("a")?.value).toBe("a");
    expect(cache.get("c")?.value).toBe("c");
  });

  it("keeps the total size under its byte limit", () => {
    const cache = new LruCache<string>(100, 1_000);
    cache.set("a", entry("a", 400));
    cache.set("b", entry("b", 400));
    cache.set("c", entry("c", 400));
    expect(cache.get("a")).toBeUndefined();
    expect(cache.get("b")).toBeDefined();
    cache.set("b", entry("b2", 100));
    cache.set("d", entry("d", 400));
    expect(cache.get("c")).toBeDefined();
    expect(cache.get("b")?.value).toBe("b2");
    cache.set("huge", entry("huge", 2_000));
    expect(cache.get("huge")).toBeUndefined();
  });
});
