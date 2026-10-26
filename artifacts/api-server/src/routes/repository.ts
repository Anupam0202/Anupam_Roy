import { Router, type IRouter, type Response } from "express";
import {
  capResponseSize,
  decodeBase64Utf8,
  normalizeRepository,
  normalizeSections,
  parseRepositoryInput,
  plannedRequests,
  type RepoSection,
  type SectionPayload,
} from "@workspace/proof-atlas-core/github/index";
import { DEPENDENCY_MANIFESTS, buildDependencyReport, type ManifestState } from "@workspace/proof-atlas-core/github/dependencies";
import { PROVIDER_POLICIES } from "@workspace/proof-atlas-core/providers/policies";
import { LruCache } from "../lib/cache";
import type { Deps } from "../lib/deps";
import { clientKey, providerUnavailable, providerUserAgent, requireJson, str, tooMany, unavailable } from "../lib/http";
import { logger } from "../lib/logger";
import { EgressError, ProviderUnavailable, rateLimitSignal, type CallTier, type ProviderClient } from "../lib/providers";
import { createRateLimiter } from "../lib/rate-limit";

const GITHUB_API = "https://api.github.com";
const policy = PROVIDER_POLICIES.github;
const TOOL = "The repository tool";
/** The dependency step stops reading manifests after this long, well inside the 30 s function limit. */
export const DEPENDENCY_DEADLINE_MS = 20_000;
/** About 32 MB of cached GitHub responses per server instance. */
const CACHE_BYTES = 32 * 1024 * 1024;

interface Fetched {
  payload: SectionPayload;
  cache: "hit" | "miss" | "stale";
  storedAt: number;
  rateLimited?: boolean;
  retryAfter?: number;
}

/** Cache lifetime for a GitHub API path (spec "CACHE GUIDANCE"). */
export function githubTtlSeconds(path: string): number {
  const ttl = policy.resourceTtlSeconds ?? {};
  const kind = /\/contents\/[^/]+$/.test(path)
    ? "manifest"
    : /\/contents$/.test(path)
      ? "contents"
      : /\/readme$/.test(path)
        ? "readme"
        : /\/releases(\?|$)/.test(path)
          ? "releases"
          : /\/languages$/.test(path)
            ? "languages"
            : "repository";
  return ttl[kind] ?? policy.cacheTtlSeconds;
}

export function createRepositoryRouter(deps: Deps, providers: ProviderClient): IRouter {
  const router = Router();
  const limited = createRateLimiter({ limit: 10, windowMs: 60_000 });
  const dependencyLimited = createRateLimiter({ limit: 10, windowMs: 60_000 });
  const cache = new LruCache<SectionPayload>(400, CACHE_BYTES);
  const staleMs = (policy.staleIfErrorSeconds ?? 0) * 1_000;
  // Set once GitHub rejects GITHUB_TOKEN (wrong or expired); calls then go out without it.
  let tokenRejected = false;

  async function githubGet(path: string, tier: CallTier = "core"): Promise<Fetched> {
    const now = deps.now();
    const cached = cache.get(path);
    if (cached && now - cached.storedAt < githubTtlSeconds(path) * 1_000) return { payload: cached.value, cache: "hit", storedAt: cached.storedAt };

    const stale = (reason: string, extra: Partial<Fetched> = {}): Fetched =>
      cached && now - cached.storedAt < staleMs
        ? { payload: cached.value, cache: "stale", storedAt: cached.storedAt }
        : { payload: { state: "blocked", reason }, cache: "miss", storedAt: now, ...extra };

    const headers: Record<string, string> = {
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
      "User-Agent": providerUserAgent(),
    };
    const token = tokenRejected ? undefined : deps.env.GITHUB_TOKEN?.trim();
    if (token) headers.Authorization = `Bearer ${token}`;
    if (cached?.etag) headers["If-None-Match"] = cached.etag;

    let response;
    try {
      response = await providers.request("github", `${GITHUB_API}${path}`, { headers }, { tier });
    } catch (error) {
      if (error instanceof ProviderUnavailable) {
        if (error.reason !== "cooldown") throw error;
        return stale(error.rateLimited ? "GitHub rate limit reached" : "GitHub is failing; calls are paused briefly", {
          rateLimited: error.rateLimited,
          retryAfter: error.retryAfterSeconds,
        });
      }
      const reason =
        error instanceof EgressError && error.code === "response-too-large"
          ? "response too large to inspect"
          : error instanceof EgressError && error.code === "redirect-blocked"
            ? "GitHub redirected to an address this tool does not follow"
            : "GitHub could not be reached";
      return stale(reason);
    }

    // A rejected token would fail every call; anonymous access still works at GitHub's lower limit.
    if (response.status === 401 && token) {
      tokenRejected = true;
      logger.warn({ provider: "github" }, "GitHub rejected GITHUB_TOKEN (wrong or expired); continuing without it. Replace the token in Vercel.");
      return githubGet(path, tier);
    }
    if (response.status === 304 && cached) {
      cache.set(path, { ...cached, storedAt: now });
      return { payload: cached.value, cache: "hit", storedAt: now };
    }
    if (response.status === 200) {
      let json: unknown;
      try {
        json = JSON.parse(response.text);
      } catch {
        return stale("GitHub returned unreadable data");
      }
      const payload: SectionPayload = { state: "ok", status: 200, json };
      cache.set(path, { value: payload, storedAt: now, etag: response.headers.get("etag") ?? undefined, bytes: response.text.length });
      return { payload, cache: "miss", storedAt: now };
    }
    if (response.status === 404) {
      const payload: SectionPayload = { state: "not_found" };
      cache.set(path, { value: payload, storedAt: now, bytes: 64 });
      return { payload, cache: "miss", storedAt: now };
    }
    const retryAfter = rateLimitSignal("github", response, now);
    if (retryAfter !== null) return stale("GitHub rate limit reached", { rateLimited: true, retryAfter });
    return stale(`GitHub returned HTTP ${response.status}`);
  }

  /** Shared answer when the repository's overview could not be read. Returns true when it responded. */
  function overviewProblem(res: Response, overview: Fetched): boolean {
    const meta = overview.payload.state === "ok" ? (overview.payload.json as Record<string, unknown>) : null;
    // A server token can see private repositories; this tool only reports public ones.
    if (overview.payload.state === "not_found" || meta?.private === true || meta?.visibility === "private") {
      res.status(404).json({ error: "Repository not found, or it is not public." });
      return true;
    }
    if (overview.payload.state === "blocked") {
      if (overview.rateLimited) tooMany(res, overview.retryAfter ?? 60, "GitHub's rate limit was reached. Try again later.");
      else unavailable(res, overview.retryAfter, "GitHub could not be reached. Try again later.");
      return true;
    }
    return false;
  }

  router.post("/repository/analyze", async (req, res) => {
    res.setHeader("Cache-Control", "no-store");
    if (!requireJson(req, res)) return;
    const body = (req.body ?? {}) as Record<string, unknown>;
    const parsed = parseRepositoryInput(`${str(body.owner, 100)}/${str(body.repo, 120)}`);
    if (!parsed.ok) return void res.status(400).json({ error: parsed.message });
    const sections: RepoSection[] = normalizeSections(body.include);
    if (limited(clientKey(req))) return tooMany(res, 60, "Too many analyses. Please wait a minute and try again.");

    try {
      providers.assertUsable("github");
      const plan = plannedRequests(parsed.owner, parsed.repo, sections);
      const overview = await githubGet(plan[0].path);
      if (overviewProblem(res, overview)) return;

      // The provider client runs at most two GitHub calls at a time.
      const rest = await Promise.all(plan.slice(1).map(async (p) => [p.section, await githubGet(p.path)] as const));
      const all = [overview, ...rest.map(([, f]) => f)];
      const payloads: Partial<Record<RepoSection, SectionPayload>> = { overview: overview.payload };
      for (const [section, fetched] of rest) payloads[section] = fetched.payload;
      const cacheState = all.some((f) => f.cache === "stale") ? "stale" : all.every((f) => f.cache === "hit") ? "hit" : "miss";
      const fetchedAt = new Date(Math.min(...all.map((f) => f.storedAt))).toISOString();

      const response = normalizeRepository({ owner: parsed.owner, repo: parsed.repo, sections, payloads, fetchedAt, cache: cacheState });
      if (cacheState === "stale") response.warnings.push("GitHub was unavailable, so some sections come from an earlier cached response.");
      res.json(capResponseSize(response));
    } catch (error) {
      if (error instanceof ProviderUnavailable) return providerUnavailable(res, error, TOOL, deps.now());
      throw error;
    }
  });

  /**
   * Declared dependencies from root manifests: a separate, visitor-initiated
   * step after the main analysis, counted as nonessential enrichment. At most
   * 2 cached calls (overview, root listing) plus one per manifest present.
   */
  router.post("/repository/dependencies", async (req, res) => {
    res.setHeader("Cache-Control", "no-store");
    if (!requireJson(req, res)) return;
    const body = (req.body ?? {}) as Record<string, unknown>;
    const parsed = parseRepositoryInput(`${str(body.owner, 100)}/${str(body.repo, 120)}`);
    if (!parsed.ok) return void res.status(400).json({ error: parsed.message });
    if (dependencyLimited(clientKey(req))) return tooMany(res, 60, "Too many dependency requests. Please wait a minute and try again.");

    try {
      providers.assertUsable("github");
      const started = deps.now();
      const base = plannedRequests(parsed.owner, parsed.repo, ["overview"])[0].path;
      const overview = await githubGet(base, "enrichment");
      if (overviewProblem(res, overview)) return;

      const listing = await githubGet(`${base}/contents`, "enrichment");
      const fetched = [overview, listing];
      const files = new Set(
        listing.payload.state === "ok" && Array.isArray(listing.payload.json)
          ? (listing.payload.json as Array<Record<string, unknown>>).filter((f) => f.type === "file").map((f) => String(f.name))
          : [],
      );
      const manifests: Array<{ path: string; state: ManifestState; text?: string; url?: string }> = [];
      let outOfTime = false;
      for (const path of Object.keys(DEPENDENCY_MANIFESTS)) {
        if (listing.payload.state === "blocked") {
          manifests.push({ path, state: "provider_blocked" });
          continue;
        }
        if (!files.has(path)) {
          manifests.push({ path, state: "not_found" });
          continue;
        }
        if (deps.now() - started > DEPENDENCY_DEADLINE_MS) {
          outOfTime = true;
          manifests.push({ path, state: "provider_blocked" });
          continue;
        }
        const file = await githubGet(`${base}/contents/${path}`, "enrichment");
        fetched.push(file);
        if (file.payload.state !== "ok") {
          manifests.push({ path, state: file.payload.state === "not_found" ? "not_found" : "provider_blocked" });
          continue;
        }
        const json = file.payload.json as Record<string, unknown>;
        const url = typeof json.html_url === "string" && json.html_url.startsWith("https://github.com/") ? json.html_url : undefined;
        // Files over 1 MB come back without inline content.
        if (json.encoding !== "base64" || typeof json.content !== "string") {
          manifests.push({ path, state: "parse_error", url });
          continue;
        }
        try {
          manifests.push({ path, state: "observed", text: decodeBase64Utf8(json.content), url });
        } catch {
          manifests.push({ path, state: "parse_error", url });
        }
      }
      const cacheState = fetched.some((f) => f.cache === "stale") ? "stale" : fetched.every((f) => f.cache === "hit") ? "hit" : "miss";
      const fetchedAt = new Date(Math.min(...fetched.map((f) => f.storedAt))).toISOString();
      const report = buildDependencyReport({ owner: parsed.owner, repo: parsed.repo, manifests, fetchedAt, cache: cacheState });
      if (outOfTime)
        report.notes.push(`Reading stopped after ${DEPENDENCY_DEADLINE_MS / 1_000} seconds because GitHub was slow; manifests not read are marked "Blocked by provider".`);
      res.json(report);
    } catch (error) {
      if (error instanceof ProviderUnavailable) return providerUnavailable(res, error, "Dependency evidence", deps.now());
      throw error;
    }
  });

  return router;
}
