import type { Request, Response } from "express";
import { SITE } from "@workspace/proof-atlas-core/data/profile";
import { ProviderUnavailable, secondsUntilUtcMidnight } from "./providers";

/** One User-Agent for every provider, with a contact page. Crossref may add a mailto. */
export function providerUserAgent(mailto?: string): string {
  const contact = mailto && /^[^\s@]{1,64}@[^\s@]{1,190}$/.test(mailto) ? `; mailto:${mailto}` : "";
  return `proof-atlas/3 (+${SITE.url}/contact/${contact})`;
}

/** First 64 bits of an IPv6 address, so one subnet counts as one visitor. */
export function ipv6Prefix64(ip: string): string {
  const [head, tail = ""] = ip.toLowerCase().split("::");
  const left = head ? head.split(":") : [];
  const right = tail ? tail.split(":") : [];
  const fill = ip.includes("::") ? Array(Math.max(0, 8 - left.length - right.length)).fill("0") : [];
  const groups = [...left, ...fill, ...right].map((g) => g.replace(/^0+(?=.)/, ""));
  return `${groups.slice(0, 4).join(":")}::/64`;
}

/** Rate-limit key: IPv4 address, or the /64 prefix of an IPv6 address. */
export function clientKey(req: Request): string {
  const raw = (req.ip ?? req.socket.remoteAddress ?? "unknown").replace(/^::ffff:(?=\d+\.\d+\.\d+\.\d+$)/i, "");
  return raw.includes(":") ? ipv6Prefix64(raw) : raw;
}

/** Sends 415 and returns false unless the request body is JSON. */
export function requireJson(req: Request, res: Response): boolean {
  if (req.is("application/json")) return true;
  res.status(415).json({ error: "Content-Type must be application/json." });
  return false;
}

const retryAfter = (res: Response, seconds: number) => res.setHeader("Retry-After", String(Math.max(1, Math.ceil(seconds))));

export function tooMany(res: Response, retryAfterSeconds: number, message: string) {
  retryAfter(res, retryAfterSeconds);
  res.status(429).json({ error: message });
}

/** 503 with a Retry-After hint. */
export function unavailable(res: Response, retryAfterSeconds: number | undefined, message: string) {
  if (retryAfterSeconds) retryAfter(res, retryAfterSeconds);
  res.status(503).json({ error: message });
}

/**
 * Answers for a provider that may not be called right now. Budget and rate
 * limits are 429 with Retry-After (budgets reset at UTC midnight); a provider
 * paused after failures is 503 with Retry-After; a disabled one is 503.
 */
export function providerUnavailable(res: Response, error: ProviderUnavailable, tool: string, now: number) {
  if (error.reason === "budget")
    return tooMany(
      res,
      error.retryAfterSeconds ?? secondsUntilUtcMidnight(now),
      error.budgetLevel === "exhausted" || !error.budgetLevel
        ? `${tool} has reached today's request budget. Try again after midnight UTC.`
        : `${tool} is paused until midnight UTC to save today's remaining request budget.`,
    );
  if (error.reason === "cooldown" && error.rateLimited)
    return tooMany(res, error.retryAfterSeconds ?? 60, `${tool} is being rate-limited by its provider. Try again in a minute or two.`);
  if (error.reason === "cooldown") return unavailable(res, error.retryAfterSeconds, `${tool} is paused briefly after provider errors. Try again shortly.`);
  return unavailable(res, undefined, `${tool} is currently unavailable.`);
}

export const str = (value: unknown, max: number) => (typeof value === "string" ? value.trim().slice(0, max) : "");
