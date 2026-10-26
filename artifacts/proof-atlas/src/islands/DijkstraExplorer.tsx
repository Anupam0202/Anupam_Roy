import { useId, useMemo, useState } from "react";
import { dijkstra, reconstructPath, type GraphEdge } from "@workspace/proof-atlas-core/algorithms/dijkstra";
import { IslandBoundary } from "./IslandBoundary";

/** Fixed layout for the example graph (viewBox 560 × 340). */
const POS: Record<string, [number, number]> = {
  A: [60, 170],
  B: [200, 70],
  C: [200, 270],
  D: [360, 70],
  E: [360, 270],
  F: [500, 170],
  G: [500, 300],
};
const NODES = Object.keys(POS);
const DEFAULT_EDGES: GraphEdge[] = [
  { from: "A", to: "B", weight: 4 },
  { from: "A", to: "C", weight: 2 },
  { from: "B", to: "C", weight: 1 },
  { from: "B", to: "D", weight: 5 },
  { from: "C", to: "D", weight: 8 },
  { from: "C", to: "E", weight: 10 },
  { from: "D", to: "E", weight: 2 },
  { from: "D", to: "F", weight: 6 },
  { from: "E", to: "F", weight: 3 },
];

const fmt = (d: number) => (Number.isFinite(d) ? String(d) : "∞");
const edgeKey = (a: string, b: string) => [a, b].sort().join("–");

function DijkstraExplorerInner() {
  const id = useId();
  const [weights, setWeights] = useState<string[]>(DEFAULT_EDGES.map((e) => String(e.weight)));
  const [source, setSource] = useState("A");
  const [target, setTarget] = useState("F");
  const [step, setStep] = useState(0);

  const edges = useMemo(() => DEFAULT_EDGES.map((e, i) => ({ ...e, weight: weights[i].trim() === "" ? NaN : Number(weights[i]) })), [weights]);
  const outcome = useMemo(() => dijkstra({ nodes: NODES, edges }, source), [edges, source]);
  const steps = useMemo(() => (outcome.ok ? outcome.steps : []), [outcome]);
  const at = Math.min(step, steps.length);
  const current = at > 0 ? steps[at - 1] : undefined;
  const done = outcome.ok && at === steps.length;

  // Replay the trace up to this step to get distances and predecessors as they were then.
  const snapshot = useMemo(() => {
    const dist: Record<string, number> = Object.fromEntries(NODES.map((n) => [n, n === source ? 0 : Infinity]));
    const prev: Record<string, string | null> = Object.fromEntries(NODES.map((n) => [n, null]));
    const settled = new Set<string>();
    for (const s of steps.slice(0, at)) {
      settled.add(s.settled);
      for (const r of s.relaxations) if (r.improved) prev[r.to] = r.from;
      Object.assign(dist, s.distances);
    }
    return { dist, prev, settled };
  }, [steps, at, source]);

  const path = done && outcome.ok ? reconstructPath(outcome.previous, source, target) : null;
  const pathEdges = new Set<string>();
  if (path) for (let i = 1; i < path.length; i += 1) pathEdges.add(edgeKey(path[i - 1], path[i]));
  const treeEdges = new Set(NODES.filter((n) => snapshot.prev[n]).map((n) => edgeKey(n, snapshot.prev[n]!)));
  const activeEdges = new Set((current?.relaxations ?? []).map((r) => edgeKey(r.from, r.to)));

  const nodeState = (n: string) => (current && n === current.settled ? "current" : snapshot.settled.has(n) ? "settled" : Number.isFinite(snapshot.dist[n]) ? "frontier" : "unreached");
  const STATE_LABEL: Record<string, string> = { current: "just settled", settled: "settled", frontier: "in queue", unreached: "not reached" };

  const reset = () => setStep(0);
  const summary = !outcome.ok
    ? outcome.message
    : at === 0
      ? `Ready. ${source} starts at distance 0; every other node starts at ∞. The priority queue holds only ${source}.`
      : `Step ${at} of ${steps.length}: settle ${current!.settled} at distance ${current!.distance}. ${
          current!.relaxations.length
            ? current!.relaxations.map((r) => `${r.to}: ${fmt(r.previous)} → ${r.improved ? `${r.candidate} via ${r.from}` : `stays (${r.candidate} is not shorter)`}`).join("; ") + "."
            : "No unsettled neighbours to relax."
        }`;
  const pathText = !done
    ? ""
    : path
      ? `Shortest path ${source} → ${target}: ${path.join(" → ")}, total ${fmt(outcome.ok ? outcome.distances[target] : Infinity)}.`
      : `${target} is unreachable from ${source}.`;

  return (
    <div className="tool lab-tool">
      <div className="grid grid--3 lab-inputs">
        <div className="field">
          <label htmlFor={`${id}-src`}>Source</label>
          <select
            id={`${id}-src`}
            className="select"
            value={source}
            onChange={(e) => {
              setSource(e.target.value);
              reset();
            }}
          >
            {NODES.map((n) => (
              <option key={n}>{n}</option>
            ))}
          </select>
        </div>
        <div className="field">
          <label htmlFor={`${id}-tgt`}>Target</label>
          <select id={`${id}-tgt`} className="select" value={target} onChange={(e) => setTarget(e.target.value)}>
            {NODES.map((n) => (
              <option key={n}>{n}</option>
            ))}
          </select>
        </div>
        <details className="disclosure">
          <summary>Edit edge weights</summary>
          <div className="disclosure-body weights">
            {DEFAULT_EDGES.map((e, i) => (
              <div key={edgeKey(e.from, e.to)} className="field weight">
                <label htmlFor={`${id}-w${i}`} className="mono">
                  {e.from}–{e.to}
                </label>
                <input
                  id={`${id}-w${i}`}
                  className="input mono"
                  type="number"
                  step="1"
                  value={weights[i]}
                  onChange={(ev) => {
                    const next = [...weights];
                    next[i] = ev.target.value;
                    setWeights(next);
                    reset();
                  }}
                />
              </div>
            ))}
            <button type="button" className="link-button" onClick={() => {
                setWeights(DEFAULT_EDGES.map((e) => String(e.weight)));
                reset();
              }}>
              Restore example weights
            </button>
          </div>
        </details>
      </div>

      {!outcome.ok ? (
        <p className="error" role="alert">
          {outcome.message}
        </p>
      ) : (
        <>
          <div className="cluster stepper" role="group" aria-label="Step controls">
            <button type="button" className="button button--ghost button--small" onClick={() => setStep(Math.max(0, at - 1))} disabled={at === 0}>
              Previous step
            </button>
            <button type="button" className="button button--small" onClick={() => setStep(at + 1)} disabled={done}>
              Next step
            </button>
            <button type="button" className="button button--ghost button--small" onClick={() => setStep(steps.length)} disabled={done}>
              Run to end
            </button>
            <button type="button" className="button button--ghost button--small" onClick={reset} disabled={at === 0}>
              Reset
            </button>
          </div>
          <div role="status" aria-live="polite">
            <p className="lab-summary">{summary}</p>
            {pathText && (
              <p className="lab-summary">
                <strong>{pathText}</strong>
              </p>
            )}
          </div>

          <div className="graph-lab">
            <svg viewBox="0 0 560 340" role="img" aria-label="Example weighted graph. The tables below list the same edges, distances and predecessors.">
              {edges.map((e) => {
                const [x1, y1] = POS[e.from];
                const [x2, y2] = POS[e.to];
                const k = edgeKey(e.from, e.to);
                const cls = pathEdges.has(k) ? "gl-edge gl-edge--path" : activeEdges.has(k) ? "gl-edge gl-edge--active" : treeEdges.has(k) ? "gl-edge gl-edge--tree" : "gl-edge";
                return (
                  <g key={k}>
                    <line x1={x1} y1={y1} x2={x2} y2={y2} className={cls} />
                    <text x={(x1 + x2) / 2} y={(y1 + y2) / 2 - 6} textAnchor="middle" className="gl-weight">
                      {Number.isFinite(e.weight) ? e.weight : "?"}
                    </text>
                  </g>
                );
              })}
              {NODES.map((n) => {
                const [x, y] = POS[n];
                return (
                  <g key={n}>
                    <circle cx={x} cy={y} r="22" className={`gl-node gl-node--${nodeState(n)}`} />
                    <text x={x} y={y + 5} textAnchor="middle" className="gl-label">
                      {n}
                    </text>
                    <text x={x} y={y + 40} textAnchor="middle" className="gl-dist">
                      d={fmt(snapshot.dist[n])}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>
          <ul className="legend" aria-label="Legend">
            <li>
              <span className="swatch swatch--current" aria-hidden="true" /> Just settled
            </li>
            <li>
              <span className="swatch swatch--settled" aria-hidden="true" /> Settled
            </li>
            <li>
              <span className="swatch swatch--frontier" aria-hidden="true" /> In queue
            </li>
            <li>
              <span className="swatch" aria-hidden="true" /> Not reached
            </li>
            <li>
              <span className="swatch swatch--line" aria-hidden="true" /> Current predecessor edge
            </li>
            <li>
              <span className="swatch swatch--line swatch--path" aria-hidden="true" /> Final shortest path
            </li>
          </ul>

          <div className="grid grid--2 dijkstra-tables">
          <div className="table-wrap">
            <table>
              <caption className="table-caption">Edges (undirected) with their current weights</caption>
              <thead>
                <tr>
                  <th scope="col">From</th>
                  <th scope="col">To</th>
                  <th scope="col" className="num">
                    Weight
                  </th>
                </tr>
              </thead>
              <tbody>
                {edges.map((e) => (
                  <tr key={edgeKey(e.from, e.to)} className={pathEdges.has(edgeKey(e.from, e.to)) ? "row--path" : undefined}>
                    <td className="mono">{e.from}</td>
                    <td className="mono">{e.to}</td>
                    <td className="num mono">
                      {Number.isFinite(e.weight) ? e.weight : "?"}
                      {pathEdges.has(edgeKey(e.from, e.to)) && <span className="visually-hidden"> (on the shortest path)</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="table-wrap">
            <table>
              <caption className="table-caption">Distances and predecessors after step {at}</caption>
              <thead>
                <tr>
                  <th scope="col">Node</th>
                  <th scope="col" className="num">
                    Distance
                  </th>
                  <th scope="col">Predecessor</th>
                  <th scope="col">State</th>
                </tr>
              </thead>
              <tbody>
                {NODES.map((n) => (
                  <tr key={n}>
                    <th scope="row" className="mono">
                      {n}
                    </th>
                    <td className="num mono">{fmt(snapshot.dist[n])}</td>
                    <td className="mono">{snapshot.prev[n] ?? "—"}</td>
                    <td>{STATE_LABEL[nodeState(n)]}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          </div>
        </>
      )}
      <p className="notice notice--tech small">
        <strong>Why it works.</strong> With non-negative weights, the node the priority queue returns next can never be reached more cheaply later, so it is settled for good. A negative edge breaks that guarantee, which is why the explorer rejects one instead of showing a wrong answer. With a binary heap the run takes O((V + E) log V) time.
      </p>
    </div>
  );
}

export default function DijkstraExplorer() {
  return (
    <IslandBoundary name="dijkstra">
      <DijkstraExplorerInner />
    </IslandBoundary>
  );
}
