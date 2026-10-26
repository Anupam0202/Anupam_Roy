import { useId, useMemo, useState } from "react";
import { DEFAULT_RRF_K, RrfConfigError, nexusragGatewayBlend, reciprocalRankFusion } from "@workspace/proof-atlas-core/algorithms/rrf";
import { IslandBoundary } from "./IslandBoundary";
import { useClientValue } from "./util";

/** Ids used from each ranking; longer rankings are cut with a visible warning. */
export const MAX_IDS = 20;

const splitIds = (s: string) =>
  s
    .split(/[,\s]+/)
    .map((x) => x.trim())
    .filter(Boolean);
const parseIds = (s: string) => splitIds(s).slice(0, MAX_IDS);

const fixed = (n: number, d = 6) => n.toFixed(d);

function RrfExplorerInner({ preset }: { preset?: string }) {
  const id = useId();
  const [lexical, setLexical] = useState("D2, D1, D3");
  const [semantic, setSemantic] = useState("D1, D3, D4");
  const [kText, setKText] = useState(String(DEFAULT_RRF_K));
  // ?preset=nexusrag opens the comparison; the visitor's own choice wins once made.
  const presetFromUrl = useClientValue(() => new URLSearchParams(location.search).get("preset") === "nexusrag", false);
  const [chosen, setCompare] = useState<boolean | null>(null);
  const compare = chosen ?? (preset === "nexusrag" || presetFromUrl);
  const [alpha, setAlpha] = useState(0.6);
  const [coverage, setCoverage] = useState("1, 0.67, 0.33");

  const rankings = useMemo(
    () => [
      { label: "Lexical", ids: parseIds(lexical) },
      { label: "Semantic", ids: parseIds(semantic) },
    ],
    [lexical, semantic],
  );
  const k = Number(kText);
  const kValid = /^\d+$/.test(kText.trim()) && k >= 1 && k <= 1000;
  const truncated = [
    { label: "lexical", count: splitIds(lexical).length },
    { label: "semantic", count: splitIds(semantic).length },
  ].filter((r) => r.count > MAX_IDS);
  const result = useMemo(() => {
    if (!kValid) return { ok: false as const, message: "k must be a whole number from 1 to 1000." };
    try {
      return { ok: true as const, out: reciprocalRankFusion(rankings, k) };
    } catch (e) {
      return { ok: false as const, message: e instanceof RrfConfigError ? e.message : "Invalid input." };
    }
  }, [rankings, k, kValid]);

  const coverageValues = useMemo(() => parseIds(coverage).map(Number), [coverage]);
  const blend = useMemo(
    () =>
      nexusragGatewayBlend({
        denseIds: rankings[1].ids,
        lexical: rankings[0].ids.map((docId, i) => ({ id: docId, coverage: Number.isFinite(coverageValues[i]) ? Math.max(0, Math.min(1, coverageValues[i])) : 0 })),
        alpha,
        limit: 12,
      }),
    [rankings, coverageValues, alpha],
  );

  const order = result.ok ? result.out.results.map((r) => r.id).join(", ") : "";
  return (
    <div className="tool lab-tool">
      <p className="formula-text mono">RRF(d) = Σᵢ 1 / (k + rankᵢ(d)) — ranks start at 1; a document missing from a ranking adds nothing.</p>
      <p className="small muted">Fixture query: “What handles a scanned PDF?”</p>
      <div className="grid grid--3 lab-inputs">
        <div className="field">
          <label htmlFor={`${id}-lex`}>Lexical ranking (best first)</label>
          <input id={`${id}-lex`} className="input mono" value={lexical} onChange={(e) => setLexical(e.target.value)} spellCheck={false} />
        </div>
        <div className="field">
          <label htmlFor={`${id}-sem`}>Semantic ranking (best first)</label>
          <input id={`${id}-sem`} className="input mono" value={semantic} onChange={(e) => setSemantic(e.target.value)} spellCheck={false} />
        </div>
        <div className="field">
          <label htmlFor={`${id}-k`}>k (smoothing constant)</label>
          <input id={`${id}-k`} className="input mono" type="number" min="1" max="1000" step="1" value={kText} onChange={(e) => setKText(e.target.value)} aria-describedby={`${id}-k-hint`} />
          <p id={`${id}-k-hint`} className="hint">
            Larger k flattens the difference between ranks. The usual default is 60.
          </p>
        </div>
      </div>

      {!result.ok ? (
        <p className="error" role="alert">
          {result.message}
        </p>
      ) : (
        <>
          <p className="lab-summary" role="status" aria-live="polite">
            Fused order: <strong>{order || "(no documents)"}</strong>
          </p>
          {(result.out.warnings.length > 0 || truncated.length > 0) && (
            <ul className="notice small">
              {truncated.map((t) => (
                <li key={t.label}>
                  Only the first {MAX_IDS} ids of the {t.label} ranking are used; it has {t.count}.
                </li>
              ))}
              {result.out.warnings.map((w) => (
                <li key={w}>{w}</li>
              ))}
            </ul>
          )}
          <div className="table-wrap">
            <table>
              <caption className="visually-hidden">Reciprocal Rank Fusion contributions</caption>
              <thead>
                <tr>
                  <th scope="col">Fused</th>
                  <th scope="col">Document</th>
                  {rankings.map((r) => (
                    <th key={r.label} scope="col" className="num">
                      {r.label}: rank → 1/(k+rank)
                    </th>
                  ))}
                  <th scope="col" className="num">
                    RRF score
                  </th>
                </tr>
              </thead>
              <tbody>
                {result.out.results.map((row, i) => (
                  <tr key={row.id}>
                    <td>{i + 1}</td>
                    <th scope="row" className="mono">
                      {row.id}
                    </th>
                    {rankings.map((r) => {
                      const c = row.contributions.find((x) => x.ranking === r.label);
                      return (
                        <td key={r.label} className="num mono">
                          {c ? `${c.rank} → 1/${k + c.rank} = ${fixed(c.contribution)}` : "absent → 0"}
                        </td>
                      );
                    })}
                    <td className="num mono">
                      <strong>{fixed(row.score)}</strong>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="hint">Ties are broken by document id, so the order never depends on input order.</p>
        </>
      )}

      <label className="check compare-toggle">
        <input type="checkbox" checked={compare} onChange={(e) => setCompare(e.target.checked)} /> Compare with NexusRAG's deployed gateway blend
      </label>
      {compare && (
        <section className="card compare-panel" aria-labelledby={`${id}-cmp`}>
          <h3 id={`${id}-cmp`} className="h4">
            NexusRAG gateway blend
          </h3>
          <p className="small muted">
            Reproduced from <a href="/sources/#nexus-fusion">worker-lifecycle.js</a>: score = α·1/(61 + dense rank) + (1−α)·(1/(61 + lexical rank) + 0.02·coverage), with zero-based ranks. Lexical candidates are ordered by term coverage; here the semantic list plays the dense role.
          </p>
          <div className="grid grid--2">
            <div className="field">
              <label htmlFor={`${id}-alpha`}>α (dense weight): {alpha.toFixed(2)}</label>
              <input id={`${id}-alpha`} type="range" min="0" max="1" step="0.05" value={alpha} onChange={(e) => setAlpha(Number(e.target.value))} />
            </div>
            <div className="field">
              <label htmlFor={`${id}-cov`}>Coverage of each lexical document (0–1)</label>
              <input id={`${id}-cov`} className="input mono" value={coverage} onChange={(e) => setCoverage(e.target.value)} spellCheck={false} />
            </div>
          </div>
          <div className="table-wrap">
            <table>
              <caption className="visually-hidden">Gateway blend scores</caption>
              <thead>
                <tr>
                  <th scope="col">Order</th>
                  <th scope="col">Document</th>
                  <th scope="col" className="num">
                    Dense term
                  </th>
                  <th scope="col" className="num">
                    Lexical term
                  </th>
                  <th scope="col" className="num">
                    Coverage
                  </th>
                  <th scope="col" className="num">
                    Blend score
                  </th>
                </tr>
              </thead>
              <tbody>
                {blend.map((b, i) => (
                  <tr key={b.id}>
                    <td>{i + 1}</td>
                    <th scope="row" className="mono">
                      {b.id}
                    </th>
                    <td className="num mono">{fixed(b.denseRrf)}</td>
                    <td className="num mono">{fixed(b.lexicalRrf)}</td>
                    <td className="num mono">{b.coverage.toFixed(2)}</td>
                    <td className="num mono">
                      <strong>{fixed(b.score)}</strong>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="small" role="status" aria-live="polite">
            Gateway order: <strong>{blend.map((b) => b.id).join(", ")}</strong>
            {result.ok && (blend.map((b) => b.id).join(", ") !== order ? " — different from plain RRF." : " — same as plain RRF for these inputs.")}
          </p>
        </section>
      )}
    </div>
  );
}

export default function RrfExplorer(props: { preset?: string }) {
  return (
    <IslandBoundary name="rrf-explorer">
      <RrfExplorerInner {...props} />
    </IslandBoundary>
  );
}
