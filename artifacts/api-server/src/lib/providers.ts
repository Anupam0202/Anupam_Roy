import {
  EgressError,
  guardedFetch,
  retryAfterSeconds,
  type GuardedResponse,
} from "@workspace/proof-atlas-core/security/egress";
import {
  PROVIDER_POLICIES,
  egressPolicy,
  publicProviderSummary,
  validateProviderPolicies,
  type PolicyIssue,
} from "@workspace/proof-atlas-core/providers/policies";
import type { Deps } from "./deps";
import { logger } from "./logger";

export type UnavailableReason = "disabled" | "policy" | "budget" | "cooldown";

export class ProviderUnavailable extends Error {
  /** Seconds until a retry can succeed, when known. */
  readonly retryAfterSeconds?: number;
  /** True when the provider itself asked us to slow down. */
  readonly rateLimited: boolean;
  /** For budget stops: whether the budget is used up or a threshold paused this kind of call. */
  readonly budgetLevel?: BudgetLevel;

  constructor(
    readonly provider: string,
    readonly reason: UnavailableReason,
    message: string,
    details: { retryAfterSeconds?: number; rateLimited?: boolean; budgetLevel?: BudgetLevel } = {},
  ) {
    super(message);
    this.name = "ProviderUnavailable";
    this.retryAfterSeconds = details.retryAfterSeconds;
    this.rateLimited = details.rateLimited ?? false;
    this.budgetLevel = details.budgetLevel;
  }
}

/**
 * How much a call matters. It decides when a budget threshold stops the call
 * (spec "Budget behavior": 50% warn, 80% stop nonessential enrichment, 95%
 * stop optional calls, 100% stop everything).
 * - core: the tool's main job (analyse a repository, resolve or search citations, deliver a contact message).
 * - enrichment: extras a visitor asks for (declared dependencies, package lookups, registry comparison).
 * - optional: calls with a deterministic fallback (Ask the Atlas).
 */
export type CallTier = "core" | "enrichment" | "optional";

export const BUDGET_THRESHOLDS = { warn: 0.5, enrichment: 0.8, optional: 0.95 } as const;
export type BudgetLevel = "normal" | "warning" | "enrichment-paused" | "optional-paused" | "exhausted";

/** Opens after this many consecutive network, timeout or 5xx failures. */
export const BREAKER_FAILURES = 3;
export const BREAKER_COOLDOWN_SECONDS = 30;
/** Cooldown when a provider rate-limits without saying for how long. */
export const DEFAULT_RATE_LIMIT_SECONDS = 60;

/** True when the Gemini assistant may run: key present and not switched off. */
export function aiConfigured(env: Deps["env"]): boolean {
  return Boolean(env.GEMINI_API_KEY?.trim()) && env.AI_ASSISTANT_ENABLED?.trim().toLowerCase() !== "false";
}

/** True when contact delivery has a key and a recipient. */
export function contactConfigured(env: Deps["env"]): boolean {
  return Boolean(env.RESEND_API_KEY?.trim()) && Boolean(env.CONTACT_TO_EMAIL?.trim());
}

/** Provider ids switched off with PROVIDERS_DISABLED (comma-separated policy ids). */
export function disabledByConfig(env: Deps["env"]): string[] {
  return [
    ...new Set(
      (env.PROVIDERS_DISABLED ?? "")
        .split(",")
        .map((s) => s.trim().toLowerCase())
        .filter((s) => s in PROVIDER_POLICIES),
    ),
  ];
}

function runtimeEnabled(id: string, env: Deps["env"]): boolean {
  const policy = PROVIDER_POLICIES[id];
  if (!policy?.enabled) return false;
  if (disabledByConfig(env).includes(id)) return false;
  if (id === "gemini") return aiConfigured(env);
  if (id === "resend") return contactConfigured(env);
  return true;
}

const utcDay = (now: number) => new Date(now).toISOString().slice(0, 10);

/** Seconds until the next UTC midnight, when daily budgets reset. */
export function secondsUntilUtcMidnight(now: number): number {
  const d = new Date(now);
  const next = Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() + 1);
  return Math.max(1, Math.ceil((next - now) / 1_000));
}

/** Counts upstream calls per provider per UTC day (per server instance) and applies the budget thresholds. */
export class DailyBudget {
  private day = "";
  private readonly used = new Map<string, number>();
  private readonly warned = new Set<string>();

  private roll(now: number) {
    const today = utcDay(now);
    if (today !== this.day) {
      this.day = today;
      this.used.clear();
      this.warned.clear();
    }
  }

  usage(id: string, now: number): { used: number; limit?: number; level: BudgetLevel } {
    this.roll(now);
    const used = this.used.get(id) ?? 0;
    const limit = PROVIDER_POLICIES[id]?.dailyBudget;
    if (limit === undefined) return { used, level: "normal" };
    const ratio = used / limit;
    const level: BudgetLevel =
      ratio >= 1
        ? "exhausted"
        : ratio >= BUDGET_THRESHOLDS.optional
          ? "optional-paused"
          : ratio >= BUDGET_THRESHOLDS.enrichment
            ? "enrichment-paused"
            : ratio >= BUDGET_THRESHOLDS.warn
              ? "warning"
              : "normal";
    return { used, limit, level };
  }

  /** Counts the call and returns true, or returns false when a threshold stops this tier. */
  take(id: string, now: number, tier: CallTier = "core"): boolean {
    const { used, limit, level } = this.usage(id, now);
    const stopped =
      level === "exhausted" ||
      (tier !== "core" && level === "optional-paused") ||
      (tier === "enrichment" && level === "enrichment-paused");
    if (stopped) return false;
    this.used.set(id, used + 1);
    if (limit !== undefined && (used + 1) / limit >= BUDGET_THRESHOLDS.warn && !this.warned.has(id)) {
      this.warned.add(id);
      logger.warn({ provider: id, used: used + 1, limit }, "Provider passed half of today's request budget");
    }
    return true;
  }
}

/**
 * Seconds the provider asked us to wait, or null when the response is not a
 * rate limit. Covers 429, 503 with Retry-After, and GitHub's primary
 * (x-ratelimit-remaining: 0) and secondary (403 with retry-after or the
 * "secondary rate limit" message) limits.
 */
export function rateLimitSignal(id: string, response: GuardedResponse, now: number): number | null {
  const retryAfter = retryAfterSeconds(response.headers, now);
  const reset = Number(response.headers.get("x-ratelimit-reset"));
  const untilReset = Number.isFinite(reset) && reset > 0 ? Math.max(1, Math.ceil(reset - now / 1_000)) : null;
  if (response.status === 429) return retryAfter ?? untilReset ?? DEFAULT_RATE_LIMIT_SECONDS;
  if (response.status === 503 && retryAfter !== null) return retryAfter;
  if (id === "github" && response.status === 403) {
    if (response.headers.get("x-ratelimit-remaining") === "0") return retryAfter ?? untilReset ?? DEFAULT_RATE_LIMIT_SECONDS;
    if (retryAfter !== null) return Math.max(retryAfter, 1);
    if (/secondary rate limit/i.test(response.text.slice(0, 2_000))) return DEFAULT_RATE_LIMIT_SECONDS;
  }
  return null;
}

interface Breaker {
  openUntil: number;
  failures: number;
  probing: boolean;
  rateLimited: boolean;
}

export interface RequestOptions {
  tier?: CallTier;
}

export interface ProviderStatus {
  providers: ReturnType<typeof publicProviderSummary>;
  policyIssues: PolicyIssue[];
  disabledByConfig: string[];
  budgets: Array<{ id: string; used: number; limit?: number; level: BudgetLevel }>;
  cooldowns: Array<{ id: string; retryAfterSeconds: number; rateLimited: boolean }>;
}

export interface ProviderClient {
  /** Throws ProviderUnavailable when the provider may not be called right now. */
  assertUsable(id: string): void;
  request(id: string, url: string, init?: RequestInit, options?: RequestOptions): Promise<GuardedResponse>;
  status(): ProviderStatus;
}

export function createProviderClient(deps: Deps): ProviderClient {
  const budget = new DailyBudget();
  const breakers = new Map<string, Breaker>();
  const inFlight = new Map<string, Promise<GuardedResponse>>();
  const active = new Map<string, number>();
  const waiting = new Map<string, Array<() => void>>();
  let issuesDay = "";
  let issues: PolicyIssue[] = [];

  /** Policy validation depends only on the date, so it runs once per UTC day. */
  const policyIssues = () => {
    const day = utcDay(deps.now());
    if (day !== issuesDay) {
      issues = validateProviderPolicies(PROVIDER_POLICIES, new Date(deps.now()));
      issuesDay = day;
    }
    return issues;
  };

  const assertUsable = (id: string) => {
    if (!runtimeEnabled(id, deps.env)) throw new ProviderUnavailable(id, "disabled", `${id} is not enabled on this server.`);
    if (policyIssues().some((i) => i.provider === id))
      throw new ProviderUnavailable(id, "policy", `${id} is paused until its provider policy is reviewed again.`);
  };

  const breakerFor = (id: string) => {
    let b = breakers.get(id);
    if (!b) breakers.set(id, (b = { openUntil: 0, failures: 0, probing: false, rateLimited: false }));
    return b;
  };

  /** Rejects while the breaker is open; lets one probe through once the cooldown ends. */
  const enterBreaker = (id: string) => {
    const b = breakerFor(id);
    if (!b.openUntil) return;
    const now = deps.now();
    const wait = Math.ceil((b.openUntil - now) / 1_000);
    if (wait > 0 || b.probing)
      throw new ProviderUnavailable(id, "cooldown", b.rateLimited ? `${id} asked us to slow down.` : `${id} is failing; calls are paused briefly.`, {
        retryAfterSeconds: Math.max(1, wait),
        rateLimited: b.rateLimited,
      });
    b.probing = true;
  };

  const open = (id: string, seconds: number, rateLimited: boolean) => {
    const b = breakerFor(id);
    Object.assign(b, { openUntil: deps.now() + seconds * 1_000, probing: false, rateLimited, failures: rateLimited ? 0 : b.failures });
  };

  const recordFailure = (id: string) => {
    const b = breakerFor(id);
    b.failures += 1;
    if (b.probing || b.failures >= BREAKER_FAILURES) open(id, BREAKER_COOLDOWN_SECONDS, false);
    b.probing = false;
  };

  const recordSuccess = (id: string) => Object.assign(breakerFor(id), { openUntil: 0, failures: 0, probing: false, rateLimited: false });

  /** Waits for a concurrency slot; a released slot passes straight to the next waiter. */
  const acquire = async (id: string) => {
    const max = PROVIDER_POLICIES[id]?.maxConcurrency;
    if (!max) return;
    if ((active.get(id) ?? 0) < max) {
      active.set(id, (active.get(id) ?? 0) + 1);
      return;
    }
    await new Promise<void>((resolve) => {
      const queue = waiting.get(id) ?? [];
      queue.push(resolve);
      waiting.set(id, queue);
    });
  };

  const release = (id: string) => {
    if (!PROVIDER_POLICIES[id]?.maxConcurrency) return;
    const next = waiting.get(id)?.shift();
    if (next) next();
    else active.set(id, Math.max(0, (active.get(id) ?? 1) - 1));
  };

  async function perform(id: string, url: string, init: RequestInit, tier: CallTier): Promise<GuardedResponse> {
    const policy = PROVIDER_POLICIES[id];
    await acquire(id);
    try {
      for (let attempt = 0; ; attempt += 1) {
        enterBreaker(id);
        if (!budget.take(id, deps.now(), tier)) {
          breakerFor(id).probing = false;
          const level = budget.usage(id, deps.now()).level;
          throw new ProviderUnavailable(
            id,
            "budget",
            level === "exhausted" ? `${id} has reached today's request budget.` : `${id} ${tier} calls are paused to save today's remaining budget.`,
            { retryAfterSeconds: secondsUntilUtcMidnight(deps.now()), budgetLevel: level },
          );
        }
        let response: GuardedResponse;
        try {
          response = await guardedFetch(url, egressPolicy(id), init, deps.fetch);
        } catch (error) {
          if (error instanceof EgressError && (error.code === "network" || error.code === "timeout")) recordFailure(id);
          else breakerFor(id).probing = false;
          throw error;
        }
        const limitedFor = rateLimitSignal(id, response, deps.now());
        if (limitedFor !== null) open(id, limitedFor, true);
        else if (response.status >= 500) recordFailure(id);
        else recordSuccess(id);
        const retry = policy.retryPolicy;
        if (limitedFor === null && attempt < retry.maxRetries && retry.retryStatuses.includes(response.status) && !breakerFor(id).openUntil) continue;
        return response;
      }
    } finally {
      release(id);
    }
  }

  return {
    assertUsable,
    async request(id, url, init = {}, options = {}) {
      assertUsable(id);
      const tier = options.tier ?? "core";
      const method = (init.method ?? "GET").toUpperCase();
      // Identical concurrent GETs share one upstream call (and one budget unit).
      if (method !== "GET") return perform(id, url, init, tier);
      const headers = new Headers(init.headers);
      const key = `${id} ${url} ${[...headers].map(([k, v]) => `${k}=${v}`).sort().join("&")}`;
      const pending = inFlight.get(key);
      if (pending) return pending;
      const promise = perform(id, url, init, tier).finally(() => inFlight.delete(key));
      inFlight.set(key, promise);
      return promise;
    },
    status() {
      const now = deps.now();
      const overrides = Object.fromEntries(
        Object.keys(PROVIDER_POLICIES).map((id) => [id, runtimeEnabled(id, deps.env) && !policyIssues().some((i) => i.provider === id)]),
      );
      return {
        providers: publicProviderSummary(overrides),
        policyIssues: policyIssues(),
        disabledByConfig: disabledByConfig(deps.env),
        budgets: Object.values(PROVIDER_POLICIES)
          .filter((p) => p.enabled && p.dailyBudget !== undefined)
          .map((p) => ({ id: p.id, ...budget.usage(p.id, now) })),
        cooldowns: [...breakers]
          .filter(([, b]) => b.openUntil > now)
          .map(([id, b]) => ({ id, retryAfterSeconds: Math.ceil((b.openUntil - now) / 1_000), rateLimited: b.rateLimited })),
      };
    },
  };
}

export { EgressError };
