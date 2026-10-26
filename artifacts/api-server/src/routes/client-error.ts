import { Router, type IRouter } from "express";
import type { Deps } from "../lib/deps";
import { clientKey, requireJson, tooMany } from "../lib/http";
import { secondsUntilUtcMidnight } from "../lib/providers";
import { createRateLimiter } from "../lib/rate-limit";

/** Reports accepted per UTC day on one server instance. */
export const CLIENT_ERROR_DAILY_CAP = 500;

const text = (value: unknown, max: number) => (typeof value === "string" ? value.trim().slice(0, max) : "");
/** Visitor text can carry addresses; they are never logged. */
export const redact = (value: string) => value.replace(/[^\s@<>()"']{1,64}@[^\s@<>()"']{1,190}/g, "[email]");
/** Paths are logged without query strings or fragments. */
const pathOnly = (value: string) => value.split(/[?#]/, 1)[0];

export function createClientErrorRouter(deps: Deps): IRouter {
  const router = Router();
  const limited = createRateLimiter({ limit: 20, windowMs: 60_000 });
  let day = "";
  let accepted = 0;

  router.post("/client-error", (req, res) => {
    res.setHeader("Cache-Control", "no-store");
    if (!requireJson(req, res)) return;
    if (limited(clientKey(req))) return tooMany(res, 60, "Client error report limit reached.");
    const now = deps.now();
    const today = new Date(now).toISOString().slice(0, 10);
    if (today !== day) {
      day = today;
      accepted = 0;
    }
    if (accepted >= CLIENT_ERROR_DAILY_CAP) return tooMany(res, secondsUntilUtcMidnight(now), "Client error reporting is paused until midnight UTC.");

    const body = (req.body ?? {}) as Record<string, unknown>;
    const report = {
      scope: text(body.scope, 120),
      message: redact(text(body.message, 600)),
      componentStack: redact(text(body.componentStack, 4_000)),
      release: text(body.release, 120),
      path: pathOnly(text(body.path, 500)),
      userAgent: text(req.get("user-agent"), 500),
    };
    if (!report.scope || !report.message) return void res.status(400).json({ error: "Error scope and message are required." });
    accepted += 1;
    req.log.warn({ clientError: report }, "Portfolio client error reported");
    res.status(204).end();
  });

  return router;
}
