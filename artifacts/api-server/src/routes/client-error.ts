import { Router, type IRouter, type Request, type Response } from "express";
import { createRateLimiter } from "../lib/rate-limit";
const router: IRouter = Router();
const limited = createRateLimiter({ limit: 20, windowMs: 60_000 });
const text = (value: unknown, max: number) =>
  typeof value === "string" ? value.trim().slice(0, max) : "";
router.post("/client-error", (req: Request, res: Response) => {
  res.setHeader("Cache-Control", "no-store");
  if (!req.is("application/json"))
    return void res
      .status(415)
      .json({ error: "Content-Type must be application/json." });
  const key = req.ip ?? req.socket.remoteAddress ?? "unknown";
  if (limited(key)) {
    res.setHeader("Retry-After", "60");
    return void res
      .status(429)
      .json({ error: "Client error report limit reached." });
  }
  const body = (req.body ?? {}) as Record<string, unknown>;
  const report = {
    scope: text(body.scope, 120),
    message: text(body.message, 600),
    componentStack: text(body.componentStack, 4_000),
    release: text(body.release, 120),
    path: text(body.path, 500),
    userAgent: text(req.get("user-agent"), 500),
  };
  if (!report.scope || !report.message)
    return void res
      .status(400)
      .json({ error: "Error scope and message are required." });
  req.log.warn({ clientError: report }, "Portfolio client error reported");
  res.status(204).end();
});
export default router;
