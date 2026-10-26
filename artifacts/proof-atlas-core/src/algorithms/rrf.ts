/**
 * Reciprocal Rank Fusion.
 *
 *   RRF(d) = Σ_i 1 / (k + rank_i(d))
 *
 * Ranks are one-based. A document absent from a ranking contributes zero.
 * Ties on the fused score are broken by document id (code-point order) so the
 * output never depends on input order or locale.
 */

export interface Ranking {
  /** Label shown in explanations, e.g. "Lexical" or "Semantic". */
  label: string;
  /** Document ids, best first. */
  ids: readonly string[];
}

export interface RrfContribution {
  ranking: string;
  rank: number;
  contribution: number;
}

export interface RrfResult {
  id: string;
  score: number;
  contributions: RrfContribution[];
}

export interface RrfOutput {
  results: RrfResult[];
  warnings: string[];
}

export class RrfConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "RrfConfigError";
  }
}

export const DEFAULT_RRF_K = 60;

export function compareIds(a: string, b: string): number {
  return a < b ? -1 : a > b ? 1 : 0;
}

export function reciprocalRankFusion(
  rankings: readonly Ranking[],
  k: number = DEFAULT_RRF_K,
): RrfOutput {
  if (typeof k !== "number" || !Number.isFinite(k) || k <= 0) {
    throw new RrfConfigError("k must be a finite number greater than zero.");
  }

  const warnings: string[] = [];
  const fused = new Map<string, RrfResult>();

  for (const ranking of rankings) {
    const seen = new Set<string>();
    let rank = 0;
    for (const rawId of ranking.ids) {
      const id = rawId.trim();
      if (!id) {
        warnings.push(`${ranking.label}: an empty document id was ignored.`);
        continue;
      }
      if (seen.has(id)) {
        warnings.push(
          `${ranking.label}: duplicate id "${id}" ignored; its first (best) rank was kept.`,
        );
        continue;
      }
      seen.add(id);
      rank += 1;
      const contribution = 1 / (k + rank);
      const entry = fused.get(id) ?? { id, score: 0, contributions: [] };
      entry.score += contribution;
      entry.contributions.push({ ranking: ranking.label, rank, contribution });
      fused.set(id, entry);
    }
  }

  const results = [...fused.values()].sort(
    (a, b) => b.score - a.score || compareIds(a.id, b.id),
  );
  return { results, warnings };
}

/**
 * NexusRAG's deployed gateway blend, reproduced for comparison only.
 *
 * Source: Anupam0202/NexusRAG@85b14f1 apps/gateway/src/worker-lifecycle.js:91
 * (`hybridFuse`). Dense hits keep their order; lexical rows are scored by
 * term coverage, filtered to coverage > 0 and sorted by coverage. Each list
 * contributes 1 / (61 + zeroBasedRank) — equivalent to k = 60 with one-based
 * ranks — and results are ordered by
 *   α · denseRrf + (1 − α) · (lexicalRrf + 0.02 · coverage).
 * JavaScript's stable sort keeps insertion order (dense first) on ties.
 */
export interface GatewayBlendInput {
  denseIds: readonly string[];
  lexical: ReadonlyArray<{ id: string; coverage: number }>;
  alpha?: number;
  limit?: number;
}

export interface GatewayBlendResult {
  id: string;
  denseRrf: number;
  lexicalRrf: number;
  coverage: number;
  score: number;
}

export function nexusragGatewayBlend({
  denseIds,
  lexical,
  alpha = 0.6,
  limit = 8,
}: GatewayBlendInput): GatewayBlendResult[] {
  const rawAlpha = Number(alpha);
  const weight = Number.isFinite(rawAlpha)
    ? Math.max(0, Math.min(1, rawAlpha))
    : 0.6;
  const fused = new Map<string, GatewayBlendResult>();
  denseIds.forEach((id, rank) => {
    // Matches the gateway: a repeated dense id is overwritten by its later rank.
    if (id)
      fused.set(id, {
        id,
        denseRrf: 1 / (61 + rank),
        lexicalRrf: 0,
        coverage: 0,
        score: 0,
      });
  });
  [...lexical]
    .filter((row) => row.coverage > 0)
    .sort((a, b) => b.coverage - a.coverage)
    .forEach((row, rank) => {
      const current = fused.get(row.id) ?? {
        id: row.id,
        denseRrf: 0,
        lexicalRrf: 0,
        coverage: 0,
        score: 0,
      };
      current.lexicalRrf += 1 / (61 + rank);
      current.coverage = row.coverage;
      fused.set(row.id, current);
    });
  const results = [...fused.values()].map((item) => ({
    ...item,
    score:
      weight * item.denseRrf +
      (1 - weight) * (item.lexicalRrf + 0.02 * item.coverage),
  }));
  return results
    .sort((a, b) => b.score - a.score)
    .slice(0, Math.max(1, Math.min(limit, 12)));
}
