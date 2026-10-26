import { Router, type IRouter } from "express";
import {
  compareRecords,
  normalizeCrossref,
  normalizeDatacite,
  normalizeDoi,
  type CitationRecord,
} from "@workspace/proof-atlas-core/citations/index";
import { sanitizeText } from "@workspace/proof-atlas-core/documents/text";
import { PROVIDER_POLICIES } from "@workspace/proof-atlas-core/providers/policies";
import { LruCache } from "../lib/cache";
import type { Deps } from "../lib/deps";
import { clientKey, providerUnavailable, providerUserAgent, requireJson, tooMany, unavailable } from "../lib/http";
import { EgressError, ProviderUnavailable, rateLimitSignal, type CallTier, type ProviderClient } from "../lib/providers";
import { createRateLimiter } from "../lib/rate-limit";

type Lookup =
  | { state: "found"; record: CitationRecord }
  | { state: "not_found" }
  | { state: "error"; status?: number; retryAfter?: number; paused?: ProviderUnavailable };
type CacheState = "hit" | "miss" | "stale";

/** Fields requested from Crossref search; abstracts are never requested. */
const SEARCH_FIELDS = "DOI,title,author,issued,container-title,publisher,type,volume,issue,page,indexed";
const TOOL = "The citation tool";

const doiPath = (doi: string) => doi.split("/").map(encodeURIComponent).join("/");
const ttlMs = (provider: "crossref" | "datacite", kind: "doi" | "search") =>
  (PROVIDER_POLICIES[provider].resourceTtlSeconds?.[kind] ?? PROVIDER_POLICIES[provider].cacheTtlSeconds) * 1_000;

export function createCitationsRouter(deps: Deps, providers: ProviderClient): IRouter {
  const router = Router();
  const limited = createRateLimiter({ limit: 40, windowMs: 60_000 });
  const records = new LruCache<Lookup>(1_000);
  const searches = new LruCache<CitationRecord[]>(200);
  const userAgent = () => providerUserAgent(deps.env.CROSSREF_MAILTO?.trim());

  async function lookup(provider: "crossref" | "datacite", doi: string, tier: CallTier): Promise<{ result: Lookup; cache: CacheState }> {
    const key = `${provider}:${doi}`;
    const now = deps.now();
    const cached = records.get(key);
    if (cached && cached.value.state !== "error" && now - cached.storedAt < ttlMs(provider, "doi")) return { result: cached.value, cache: "hit" };

    const url =
      provider === "crossref" ? `https://api.crossref.org/works/${doiPath(doi)}` : `https://api.datacite.org/dois/${doiPath(doi)}`;
    let result: Lookup;
    try {
      const response = await providers.request(
        provider,
        url,
        { headers: { Accept: provider === "crossref" ? "application/json" : "application/vnd.api+json", "User-Agent": userAgent() } },
        { tier },
      );
      const fetchedAt = new Date(now).toISOString();
      if (response.status === 404) result = { state: "not_found" };
      else if (response.status !== 200)
        result = { state: "error", status: response.status, retryAfter: rateLimitSignal(provider, response, now) ?? undefined };
      else {
        const json = JSON.parse(response.text) as { message?: unknown; data?: unknown };
        const record = provider === "crossref" ? normalizeCrossref(json.message, fetchedAt) : normalizeDatacite(json.data, fetchedAt);
        result = record.doi ? { state: "found", record } : { state: "error" };
      }
    } catch (error) {
      if (error instanceof ProviderUnavailable && error.reason !== "cooldown" && tier === "core") throw error;
      if (error instanceof EgressError && error.code.startsWith("blocked-")) throw error;
      result = { state: "error", paused: error instanceof ProviderUnavailable ? error : undefined };
    }
    if (result.state === "error" && cached && cached.value.state !== "error") return { result: cached.value, cache: "stale" };
    if (result.state !== "error") records.set(key, { value: result, storedAt: now });
    return { result, cache: "miss" };
  }

  router.post("/citations/resolve", async (req, res) => {
    res.setHeader("Cache-Control", "no-store");
    if (!requireJson(req, res)) return;
    const body = (req.body ?? {}) as Record<string, unknown>;
    const doi = typeof body.doi === "string" ? normalizeDoi(body.doi.slice(0, 300)) : null;
    if (!doi) return void res.status(400).json({ error: "Enter a DOI such as 10.1038/nature14539." });
    if (limited(clientKey(req))) return tooMany(res, 60, "Too many citation requests. Please wait a minute.");
    const compare = body.compare === true;

    try {
      const warnings: string[] = [];
      const crossref = await lookup("crossref", doi, "core");
      if (crossref.result.state === "found") {
        const out: Record<string, unknown> = { record: crossref.result.record, warnings, source: { cache: crossref.cache } };
        if (compare) {
          // Registry comparison is nonessential enrichment: it may be skipped to save the DataCite budget.
          const datacite = await lookup("datacite", doi, "enrichment");
          if (datacite.result.state === "found") {
            out.alternate = datacite.result.record;
            out.comparison = compareRecords(crossref.result.record, datacite.result.record);
          } else if (datacite.result.state === "not_found")
            warnings.push("DataCite has no record for this DOI. That is normal for most journal articles, which are registered with Crossref.");
          else if (datacite.result.paused?.reason === "budget")
            warnings.push("The DataCite comparison is paused for today to save the request budget; the Crossref record is complete.");
          else warnings.push("DataCite could not be reached, so no comparison was made.");
          out.partial = datacite.result.state === "error";
        }
        if (crossref.cache === "stale") warnings.push("Crossref was unavailable; this record comes from an earlier cached response.");
        return void res.json(out);
      }

      // Not in Crossref: DataCite registers datasets, software and many reports.
      const datacite = await lookup("datacite", doi, "core");
      if (datacite.result.state === "found") {
        if (crossref.result.state === "error") warnings.push("Crossref could not be reached; the record below comes from DataCite.");
        else warnings.push("Crossref has no record for this DOI; the record below comes from DataCite.");
        if (compare) warnings.push("No comparison is possible because only one registry has this DOI.");
        return void res.json({ record: datacite.result.record, warnings, source: { cache: datacite.cache } });
      }
      if (crossref.result.state === "not_found" && datacite.result.state === "not_found")
        return void res.status(404).json({ error: "Neither Crossref nor DataCite has a record for this DOI." });
      const errors = [crossref.result, datacite.result].flatMap((r) => (r.state === "error" ? [r] : []));
      const rateLimitedFor = errors.map((r) => r.retryAfter ?? (r.paused?.rateLimited ? r.paused.retryAfterSeconds : undefined)).find((w) => w !== undefined);
      if (rateLimitedFor !== undefined) return tooMany(res, rateLimitedFor, "The citation registries asked us to slow down. Try again in a minute or two.");
      const pausedFor = errors.map((r) => r.paused?.retryAfterSeconds).find((w) => w !== undefined);
      if (pausedFor !== undefined) return unavailable(res, pausedFor, "The citation registries are paused briefly after errors. Try again shortly.");
      return void res.status(502).json({ error: "The citation registries could not be reached. Try again later." });
    } catch (error) {
      if (error instanceof ProviderUnavailable) return providerUnavailable(res, error, TOOL, deps.now());
      if (error instanceof EgressError) return void res.status(400).json({ error: "That DOI cannot be looked up. Check it for stray characters." });
      throw error;
    }
  });

  router.post("/citations/search", async (req, res) => {
    res.setHeader("Cache-Control", "no-store");
    if (!requireJson(req, res)) return;
    const body = (req.body ?? {}) as Record<string, unknown>;
    const query = typeof body.query === "string" ? sanitizeText(body.query, 200).replace(/\s+/g, " ").trim() : "";
    if (query.length < 3) return void res.status(400).json({ error: "Enter at least three characters to search." });
    if (limited(clientKey(req))) return tooMany(res, 60, "Too many citation requests. Please wait a minute.");

    const key = query.toLowerCase();
    const now = deps.now();
    const cached = searches.get(key);
    const fromCache = (cache: CacheState) =>
      res.json({ results: cached!.value, source: { fetchedAt: new Date(cached!.storedAt).toISOString(), cache } });
    if (cached && now - cached.storedAt < ttlMs("crossref", "search")) return void fromCache("hit");

    try {
      const params = new URLSearchParams({ "query.bibliographic": query, rows: "10", select: SEARCH_FIELDS });
      const response = await providers.request("crossref", `https://api.crossref.org/works?${params}`, {
        headers: { Accept: "application/json", "User-Agent": userAgent() },
      });
      if (response.status !== 200) {
        if (cached) return void fromCache("stale");
        const wait = rateLimitSignal("crossref", response, now);
        if (wait !== null) return tooMany(res, wait, "Crossref asked us to slow down. Try again in a minute or two.");
        return void res.status(502).json({ error: "Crossref search is unavailable right now. Try again later." });
      }
      const fetchedAt = new Date(now).toISOString();
      const items = (JSON.parse(response.text) as { message?: { items?: unknown[] } }).message?.items ?? [];
      const results = items.slice(0, 10).map((item) => normalizeCrossref(item, fetchedAt)).filter((r) => r.doi);
      searches.set(key, { value: results, storedAt: now });
      res.json({ results, source: { fetchedAt, cache: "miss" } });
    } catch (error) {
      if (cached) return void fromCache("stale");
      if (error instanceof ProviderUnavailable) return providerUnavailable(res, error, "Crossref search", deps.now());
      res.status(502).json({ error: "Crossref search is unavailable right now. Try again later." });
    }
  });

  return router;
}
