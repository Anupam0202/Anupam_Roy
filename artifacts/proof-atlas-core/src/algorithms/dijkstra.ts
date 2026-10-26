/**
 * Dijkstra's shortest paths with a binary-heap priority queue and a full,
 * deterministic trace.
 *
 * - Edge weights must be finite and non-negative; negative edges are rejected.
 * - Queue ties are broken by node id, so equal-distance nodes settle in a
 *   stable order. Distances only update on a strictly shorter path, so among
 *   equal shortest paths the first one discovered in that order is kept.
 */

export interface GraphEdge {
  from: string;
  to: string;
  weight: number;
}

export interface Graph {
  nodes: readonly string[];
  edges: readonly GraphEdge[];
  directed?: boolean;
}

export interface Relaxation {
  from: string;
  to: string;
  weight: number;
  previous: number;
  candidate: number;
  improved: boolean;
}

export interface DijkstraStep {
  step: number;
  settled: string;
  distance: number;
  relaxations: Relaxation[];
  /** Snapshot of tentative distances after this step (Infinity = unreached). */
  distances: Record<string, number>;
}

export type DijkstraOutcome =
  | {
      ok: true;
      source: string;
      distances: Record<string, number>;
      previous: Record<string, string | null>;
      steps: DijkstraStep[];
    }
  | { ok: false; error: "negative-weight" | "invalid-graph"; message: string };

export class MinHeap<T> {
  private readonly items: T[] = [];
  constructor(private readonly less: (a: T, b: T) => boolean) {}
  get size() {
    return this.items.length;
  }
  push(item: T) {
    this.items.push(item);
    let i = this.items.length - 1;
    while (i > 0) {
      const parent = (i - 1) >> 1;
      if (!this.less(this.items[i], this.items[parent])) break;
      [this.items[i], this.items[parent]] = [this.items[parent], this.items[i]];
      i = parent;
    }
  }
  pop(): T | undefined {
    if (!this.items.length) return undefined;
    const top = this.items[0];
    const last = this.items.pop() as T;
    if (this.items.length) {
      this.items[0] = last;
      let i = 0;
      for (;;) {
        const l = 2 * i + 1;
        const r = l + 1;
        let best = i;
        if (l < this.items.length && this.less(this.items[l], this.items[best])) best = l;
        if (r < this.items.length && this.less(this.items[r], this.items[best])) best = r;
        if (best === i) break;
        [this.items[i], this.items[best]] = [this.items[best], this.items[i]];
        i = best;
      }
    }
    return top;
  }
}

export function dijkstra(graph: Graph, source: string): DijkstraOutcome {
  const nodeSet = new Set(graph.nodes);
  if (nodeSet.size !== graph.nodes.length)
    return { ok: false, error: "invalid-graph", message: "Node ids must be unique." };
  if (!nodeSet.has(source))
    return { ok: false, error: "invalid-graph", message: `Unknown source node "${source}".` };

  const adjacency = new Map<string, GraphEdge[]>();
  for (const node of graph.nodes) adjacency.set(node, []);
  for (const edge of graph.edges) {
    if (!nodeSet.has(edge.from) || !nodeSet.has(edge.to))
      return {
        ok: false,
        error: "invalid-graph",
        message: `Edge ${edge.from} → ${edge.to} references an unknown node.`,
      };
    if (!Number.isFinite(edge.weight))
      return {
        ok: false,
        error: "invalid-graph",
        message: `Edge ${edge.from} → ${edge.to} has a non-finite weight.`,
      };
    if (edge.weight < 0)
      return {
        ok: false,
        error: "negative-weight",
        message: `Edge ${edge.from} → ${edge.to} has negative weight ${edge.weight}. Dijkstra's algorithm requires non-negative weights.`,
      };
    adjacency.get(edge.from)!.push(edge);
    if (!graph.directed)
      adjacency.get(edge.to)!.push({ from: edge.to, to: edge.from, weight: edge.weight });
  }
  for (const list of adjacency.values())
    list.sort((a, b) => (a.to < b.to ? -1 : a.to > b.to ? 1 : a.weight - b.weight));

  const distances: Record<string, number> = {};
  const previous: Record<string, string | null> = {};
  for (const node of graph.nodes) {
    distances[node] = Infinity;
    previous[node] = null;
  }
  distances[source] = 0;

  const heap = new MinHeap<{ node: string; distance: number }>(
    (a, b) => a.distance < b.distance || (a.distance === b.distance && a.node < b.node),
  );
  heap.push({ node: source, distance: 0 });
  const settled = new Set<string>();
  const steps: DijkstraStep[] = [];

  while (heap.size) {
    const current = heap.pop()!;
    if (settled.has(current.node) || current.distance > distances[current.node]) continue;
    settled.add(current.node);
    const relaxations: Relaxation[] = [];
    for (const edge of adjacency.get(current.node)!) {
      if (settled.has(edge.to)) continue;
      const candidate = current.distance + edge.weight;
      const previousDistance = distances[edge.to];
      const improved = candidate < previousDistance;
      relaxations.push({
        from: edge.from,
        to: edge.to,
        weight: edge.weight,
        previous: previousDistance,
        candidate,
        improved,
      });
      if (improved) {
        distances[edge.to] = candidate;
        previous[edge.to] = current.node;
        heap.push({ node: edge.to, distance: candidate });
      }
    }
    steps.push({
      step: steps.length + 1,
      settled: current.node,
      distance: current.distance,
      relaxations,
      distances: { ...distances },
    });
  }
  return { ok: true, source, distances, previous, steps };
}

/** Returns the node path from the source to `target`, or null when unreachable. */
export function reconstructPath(
  previous: Record<string, string | null>,
  source: string,
  target: string,
): string[] | null {
  if (!(target in previous)) return null;
  const path: string[] = [];
  let node: string | null = target;
  const guard = Object.keys(previous).length + 1;
  while (node !== null && path.length <= guard) {
    path.push(node);
    if (node === source) return path.reverse();
    node = previous[node];
  }
  return null;
}
