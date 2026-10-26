import { describe, expect, it } from "vitest";
import {
  RrfConfigError,
  nexusragGatewayBlend,
  reciprocalRankFusion,
} from "./rrf";

const ids = (out: ReturnType<typeof reciprocalRankFusion>) =>
  out.results.map((r) => r.id);

describe("reciprocalRankFusion", () => {
  it("fuses the spec fixture with computed, not hard-coded, scores", () => {
    const out = reciprocalRankFusion([
      { label: "Lexical", ids: ["D2", "D1", "D3"] },
      { label: "Semantic", ids: ["D1", "D3", "D4"] },
    ]);
    const score = Object.fromEntries(out.results.map((r) => [r.id, r.score]));
    expect(score.D1).toBeCloseTo(1 / 62 + 1 / 61, 12);
    expect(score.D2).toBeCloseTo(1 / 61, 12);
    expect(score.D3).toBeCloseTo(1 / 63 + 1 / 62, 12);
    expect(score.D4).toBeCloseTo(1 / 63, 12);
    expect(ids(out)).toEqual(["D1", "D3", "D2", "D4"]);
    expect(out.warnings).toEqual([]);
  });

  it("records each one-based contribution", () => {
    const d3 = reciprocalRankFusion([
      { label: "Lexical", ids: ["D2", "D1", "D3"] },
      { label: "Semantic", ids: ["D1", "D3", "D4"] },
    ]).results.find((r) => r.id === "D3");
    expect(d3?.contributions).toEqual([
      { ranking: "Lexical", rank: 3, contribution: 1 / 63 },
      { ranking: "Semantic", rank: 2, contribution: 1 / 62 },
    ]);
  });

  it("keeps order for identical rankings", () => {
    const out = reciprocalRankFusion([
      { label: "A", ids: ["x", "y", "z"] },
      { label: "B", ids: ["x", "y", "z"] },
    ]);
    expect(ids(out)).toEqual(["x", "y", "z"]);
    expect(out.results[0].score).toBeCloseTo(2 / 61, 12);
  });

  it("handles disjoint rankings and gives absent documents zero contribution", () => {
    const out = reciprocalRankFusion([
      { label: "A", ids: ["a1", "a2"] },
      { label: "B", ids: ["b1", "b2"] },
    ]);
    // a1 and b1 tie at 1/61; ties break by id.
    expect(ids(out)).toEqual(["a1", "b1", "a2", "b2"]);
    for (const r of out.results) expect(r.contributions).toHaveLength(1);
  });

  it("returns nothing for empty input and empty rankings", () => {
    expect(reciprocalRankFusion([]).results).toEqual([]);
    expect(
      reciprocalRankFusion([{ label: "A", ids: [] }, { label: "B", ids: [] }]).results,
    ).toEqual([]);
  });

  it("supports a single ranking", () => {
    expect(ids(reciprocalRankFusion([{ label: "A", ids: ["q", "p"] }]))).toEqual([
      "q",
      "p",
    ]);
  });

  it("normalizes duplicate ids deterministically with a warning", () => {
    const out = reciprocalRankFusion([{ label: "A", ids: ["d1", "d2", "d1"] }]);
    expect(ids(out)).toEqual(["d1", "d2"]);
    expect(out.results[1].contributions[0].rank).toBe(2);
    expect(out.warnings[0]).toMatch(/duplicate id "d1"/);
  });

  it("ignores empty ids with a warning", () => {
    const out = reciprocalRankFusion([{ label: "A", ids: ["", "d1"] }]);
    expect(ids(out)).toEqual(["d1"]);
    expect(out.results[0].contributions[0].rank).toBe(1);
    expect(out.warnings).toHaveLength(1);
  });

  it.each([0, -1, Number.NaN, Number.POSITIVE_INFINITY])(
    "rejects invalid k = %s",
    (k) => {
      expect(() => reciprocalRankFusion([{ label: "A", ids: ["d"] }], k)).toThrow(
        RrfConfigError,
      );
    },
  );

  it("breaks ties by id regardless of input order", () => {
    const a = reciprocalRankFusion([
      { label: "A", ids: ["m"] },
      { label: "B", ids: ["c"] },
    ]);
    const b = reciprocalRankFusion([
      { label: "B", ids: ["c"] },
      { label: "A", ids: ["m"] },
    ]);
    expect(ids(a)).toEqual(["c", "m"]);
    expect(ids(b)).toEqual(["c", "m"]);
  });

  it("uses k to flatten or sharpen rank differences", () => {
    const small = reciprocalRankFusion([{ label: "A", ids: ["a", "b"] }], 1);
    expect(small.results[0].score / small.results[1].score).toBeCloseTo(1.5, 12);
    const large = reciprocalRankFusion([{ label: "A", ids: ["a", "b"] }], 1000);
    expect(large.results[0].score / large.results[1].score).toBeCloseTo(1002 / 1001, 12);
  });
});

describe("nexusragGatewayBlend (reproduction of hybridFuse)", () => {
  it("weights dense and lexical RRF contributions by alpha", () => {
    const out = nexusragGatewayBlend({
      denseIds: ["D1", "D3", "D4"],
      lexical: [
        { id: "D2", coverage: 1 },
        { id: "D1", coverage: 0.5 },
        { id: "D3", coverage: 0.25 },
        { id: "D9", coverage: 0 },
      ],
      alpha: 0.6,
    });
    const d1 = out.find((r) => r.id === "D1")!;
    expect(d1.denseRrf).toBeCloseTo(1 / 61, 12);
    expect(d1.lexicalRrf).toBeCloseTo(1 / 62, 12);
    expect(d1.score).toBeCloseTo(0.6 / 61 + 0.4 * (1 / 62 + 0.02 * 0.5), 12);
    expect(out.some((r) => r.id === "D9")).toBe(false);
    // D1 0.02029 > D3 0.01803 > D2 0.01456 > D4 0.00952
    expect(out.map((r) => r.id)).toEqual(["D1", "D3", "D2", "D4"]);
  });

  it("clamps alpha and caps the limit at 12", () => {
    const dense = Array.from({ length: 20 }, (_, i) => `d${i}`);
    expect(nexusragGatewayBlend({ denseIds: dense, lexical: [], alpha: 5, limit: 50 })).toHaveLength(12);
    const pureLexical = nexusragGatewayBlend({
      denseIds: ["a"],
      lexical: [{ id: "b", coverage: 1 }],
      alpha: -3,
    });
    expect(pureLexical[0].id).toBe("b");
  });
});
