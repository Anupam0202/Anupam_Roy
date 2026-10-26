import { describe, expect, it } from "vitest";
import { MinHeap, dijkstra, reconstructPath, type Graph } from "./dijkstra";

function run(graph: Graph, source: string) {
  const out = dijkstra(graph, source);
  if (!out.ok) throw new Error(out.message);
  return out;
}

describe("dijkstra", () => {
  const simple: Graph = {
    nodes: ["A", "B", "C", "D", "E"],
    edges: [
      { from: "A", to: "B", weight: 4 },
      { from: "A", to: "C", weight: 1 },
      { from: "C", to: "B", weight: 2 },
      { from: "B", to: "D", weight: 1 },
      { from: "C", to: "D", weight: 5 },
      { from: "D", to: "E", weight: 3 },
    ],
  };

  it("computes shortest distances and paths on a simple graph", () => {
    const out = run(simple, "A");
    expect(out.distances).toEqual({ A: 0, B: 3, C: 1, D: 4, E: 7 });
    expect(reconstructPath(out.previous, "A", "E")).toEqual(["A", "C", "B", "D", "E"]);
    expect(out.steps.map((s) => s.settled)).toEqual(["A", "C", "B", "D", "E"]);
  });

  it("records relaxations, including ones that do not improve", () => {
    const out = run(simple, "A");
    const fromC = out.steps.find((s) => s.settled === "C")!;
    expect(fromC.relaxations).toEqual([
      { from: "C", to: "B", weight: 2, previous: 4, candidate: 3, improved: true },
      { from: "C", to: "D", weight: 5, previous: Infinity, candidate: 6, improved: true },
    ]);
    const fromB = out.steps.find((s) => s.settled === "B")!;
    expect(fromB.relaxations.find((r) => r.to === "D")).toMatchObject({ previous: 6, candidate: 4, improved: true });
  });

  it("reports unreachable nodes in disconnected graphs", () => {
    const out = run({ nodes: ["A", "B", "X"], edges: [{ from: "A", to: "B", weight: 2 }] }, "A");
    expect(out.distances.X).toBe(Infinity);
    expect(reconstructPath(out.previous, "A", "X")).toBeNull();
  });

  it("handles source equal to target", () => {
    const out = run(simple, "D");
    expect(reconstructPath(out.previous, "D", "D")).toEqual(["D"]);
    expect(out.distances.D).toBe(0);
  });

  it("accepts zero-weight edges", () => {
    const out = run(
      { nodes: ["A", "B", "C"], edges: [{ from: "A", to: "B", weight: 0 }, { from: "B", to: "C", weight: 0 }] },
      "A",
    );
    expect(out.distances).toEqual({ A: 0, B: 0, C: 0 });
    expect(reconstructPath(out.previous, "A", "C")).toEqual(["A", "B", "C"]);
  });

  it("chooses deterministically between equal shortest paths", () => {
    const graph: Graph = {
      nodes: ["S", "Y", "X", "T"],
      edges: [
        { from: "S", to: "Y", weight: 1 },
        { from: "S", to: "X", weight: 1 },
        { from: "X", to: "T", weight: 1 },
        { from: "Y", to: "T", weight: 1 },
      ],
    };
    const a = run(graph, "S");
    const b = run({ ...graph, edges: [...graph.edges].reverse() }, "S");
    // X settles before Y (tie broken by id) and claims T first.
    expect(reconstructPath(a.previous, "S", "T")).toEqual(["S", "X", "T"]);
    expect(reconstructPath(b.previous, "S", "T")).toEqual(["S", "X", "T"]);
  });

  it("rejects negative edges", () => {
    const out = dijkstra({ nodes: ["A", "B"], edges: [{ from: "A", to: "B", weight: -1 }] }, "A");
    expect(out).toMatchObject({ ok: false, error: "negative-weight" });
  });

  it("rejects unknown nodes, duplicate nodes and non-finite weights", () => {
    expect(dijkstra({ nodes: ["A"], edges: [] }, "Z")).toMatchObject({ ok: false, error: "invalid-graph" });
    expect(dijkstra({ nodes: ["A", "A"], edges: [] }, "A")).toMatchObject({ ok: false, error: "invalid-graph" });
    expect(
      dijkstra({ nodes: ["A", "B"], edges: [{ from: "A", to: "B", weight: Number.NaN }] }, "A"),
    ).toMatchObject({ ok: false, error: "invalid-graph" });
  });

  it("respects edge direction when directed", () => {
    const out = run({ nodes: ["A", "B"], edges: [{ from: "B", to: "A", weight: 1 }], directed: true }, "A");
    expect(out.distances.B).toBe(Infinity);
  });
});

describe("MinHeap", () => {
  it("pops items in order", () => {
    const heap = new MinHeap<number>((a, b) => a < b);
    [5, 1, 4, 2, 3, 0].forEach((n) => heap.push(n));
    const out: number[] = [];
    while (heap.size) out.push(heap.pop()!);
    expect(out).toEqual([0, 1, 2, 3, 4, 5]);
    expect(heap.pop()).toBeUndefined();
  });
});
