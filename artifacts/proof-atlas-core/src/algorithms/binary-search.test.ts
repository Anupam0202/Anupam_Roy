import { describe, expect, it } from "vitest";
import { binarySearch } from "./binary-search";

function found(values: number[], target: number) {
  const out = binarySearch(values, target);
  if (!out.ok) throw new Error(out.message);
  return out;
}

describe("binarySearch", () => {
  it("handles an empty array", () => {
    const out = found([], 3);
    expect(out).toMatchObject({ index: -1, found: false });
    expect(out.steps).toEqual([]);
  });

  it("handles a single element, present and absent", () => {
    expect(found([7], 7).index).toBe(0);
    expect(found([7], 6).index).toBe(-1);
    expect(found([7], 8).index).toBe(-1);
  });

  it("finds present values, including first and last", () => {
    const values = [1, 3, 5, 7, 9, 11, 13];
    values.forEach((v, i) => expect(found(values, v).index).toBe(i));
  });

  it("reports absent values between, before and after the array", () => {
    const values = [1, 3, 5, 7];
    for (const t of [0, 2, 4, 6, 8]) expect(found(values, t)).toMatchObject({ found: false, index: -1 });
  });

  it("returns a matching index when duplicates exist", () => {
    const values = [2, 4, 4, 4, 4, 9];
    const out = found(values, 4);
    expect(values[out.index]).toBe(4);
  });

  it("works with negative values", () => {
    const values = [-50, -20, -3, 0, 4];
    expect(found(values, -20).index).toBe(1);
    expect(found(values, -4).index).toBe(-1);
  });

  it("stays logarithmic on a large sorted array", () => {
    const values = Array.from({ length: 1_000_000 }, (_, i) => i * 2);
    const out = found(values, 1_999_998);
    expect(out.index).toBe(999_999);
    expect(out.steps.length).toBeLessThanOrEqual(Math.ceil(Math.log2(values.length + 1)));
    expect(found(values, 3).steps.length).toBeLessThanOrEqual(21);
  });

  it("keeps the target inside the remaining interval at every step", () => {
    const values = [1, 4, 9, 16, 25, 36, 49, 64, 81];
    const target = 49;
    const out = found(values, target);
    for (const step of out.steps) {
      expect(step.low <= step.mid && step.mid <= step.high).toBe(true);
      if (step.remaining) {
        const [lo, hi] = step.remaining;
        expect(values.slice(lo, hi + 1)).toContain(target);
      }
    }
    expect(out.steps.at(-1)?.comparison).toBe("equal");
  });

  it("rejects unsorted and non-finite input instead of guessing", () => {
    expect(binarySearch([3, 1, 2], 1)).toMatchObject({ ok: false, error: "unsorted" });
    expect(binarySearch([1, Number.NaN], 1)).toMatchObject({ ok: false, error: "not-finite" });
    expect(binarySearch([1, 2], Number.POSITIVE_INFINITY)).toMatchObject({ ok: false, error: "not-finite" });
  });
});
