/**
 * Iterative binary search over a sorted (non-decreasing) numeric array, with a
 * full trace for the Lab explorer.
 *
 * Invariant: if the target exists in the original sorted array, it remains
 * inside [low, high] until it is found or the interval becomes empty.
 * Worst case O(log n) time, O(1) auxiliary space (the trace is for teaching
 * and is not part of the search itself).
 */

export type Comparison = "equal" | "less" | "greater";

export interface BinarySearchStep {
  step: number;
  low: number;
  high: number;
  mid: number;
  value: number;
  comparison: Comparison;
  decision: string;
  /** Interval that remains after this step, or null when the search ends. */
  remaining: [number, number] | null;
}

export type BinarySearchOutcome =
  | { ok: true; index: number; found: boolean; steps: BinarySearchStep[] }
  | { ok: false; error: "not-finite" | "unsorted"; message: string };

export function validateSortedNumbers(
  values: readonly number[],
): { ok: true } | { ok: false; error: "not-finite" | "unsorted"; message: string } {
  for (let i = 0; i < values.length; i += 1) {
    if (!Number.isFinite(values[i]))
      return {
        ok: false,
        error: "not-finite",
        message: `Item ${i + 1} is not a finite number.`,
      };
    if (i > 0 && values[i] < values[i - 1])
      return {
        ok: false,
        error: "unsorted",
        message: `The array is not sorted: item ${i + 1} (${values[i]}) is smaller than item ${i} (${values[i - 1]}).`,
      };
  }
  return { ok: true };
}

export function binarySearch(
  values: readonly number[],
  target: number,
): BinarySearchOutcome {
  const valid = validateSortedNumbers(values);
  if (!valid.ok) return valid;
  if (!Number.isFinite(target))
    return { ok: false, error: "not-finite", message: "The target is not a finite number." };

  const steps: BinarySearchStep[] = [];
  let low = 0;
  let high = values.length - 1;
  while (low <= high) {
    // Avoids overflow in fixed-width languages; harmless here.
    const mid = low + Math.floor((high - low) / 2);
    const value = values[mid];
    if (value === target) {
      steps.push({
        step: steps.length + 1,
        low,
        high,
        mid,
        value,
        comparison: "equal",
        decision: `a[${mid}] = ${value} equals the target. Found at index ${mid}.`,
        remaining: null,
      });
      return { ok: true, index: mid, found: true, steps };
    }
    if (value < target) {
      const nextLow = mid + 1;
      steps.push({
        step: steps.length + 1,
        low,
        high,
        mid,
        value,
        comparison: "less",
        decision: `a[${mid}] = ${value} is less than ${target}, so the target can only be right of ${mid}. Set low = ${nextLow}.`,
        remaining: nextLow <= high ? [nextLow, high] : null,
      });
      low = nextLow;
    } else {
      const nextHigh = mid - 1;
      steps.push({
        step: steps.length + 1,
        low,
        high,
        mid,
        value,
        comparison: "greater",
        decision: `a[${mid}] = ${value} is greater than ${target}, so the target can only be left of ${mid}. Set high = ${nextHigh}.`,
        remaining: low <= nextHigh ? [low, nextHigh] : null,
      });
      high = nextHigh;
    }
  }
  return { ok: true, index: -1, found: false, steps };
}
