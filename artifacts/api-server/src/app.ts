import express, { type Express, type NextFunction, type Request, type Response } from "express";
import helmet from "helmet";
import pinoHttp from "pino-http";
import { API_CSP } from "@workspace/proof-atlas-core/site/headers";
import { defaultDeps, type Deps } from "./lib/deps";
import { logger } from "./lib/logger";
import { createApiRouter } from "./routes";

type HttpError = Error & { status?: number; statusCode?: number; type?: string };

/** The JSON API. Pages are static files served by Vercel (or the local preview server). */
export function createApp(deps: Deps = defaultDeps()): Express {
  const app = express();
  // Behind Vercel the client address comes from the platform's X-Forwarded-For; elsewhere
  // only a local proxy is trusted, so visitors cannot spoof their address.
  const trustProxy = /^(1|true|yes)$/i.test(deps.env.TRUST_PROXY?.trim() ?? "");
  app.set("trust proxy", deps.env.VERCEL || trustProxy ? 1 : "loopback");
  app.disable("x-powered-by");
  app.use(
    helmet({
      // Set once below from the shared API_CSP.
      contentSecurityPolicy: false,
      crossOriginResourcePolicy: { policy: "same-origin" },
      referrerPolicy: { policy: "strict-origin-when-cross-origin" },
    }),
  );
  app.use((_req, res, next) => {
    res.setHeader("Content-Security-Policy", API_CSP);
    next();
  });
  app.use(
    pinoHttp({
      logger,
      serializers: {
        // Never log query strings or bodies: they can contain visitor text.
        req(req) {
          return { id: req.id, method: req.method, url: req.url?.split("?")[0] };
        },
        res(res) {
          return { statusCode: res.statusCode };
        },
      },
    }),
  );
  app.use((req, res, next) => {
    if (req.id) res.setHeader("X-Request-Id", String(req.id));
    next();
  });
  app.use(express.json({ limit: "24kb", strict: true }));
  app.use("/api", createApiRouter(deps));
  app.use((_req, res) => {
    res.status(404).json({ error: "API route not found." });
  });

  app.use(errorHandler);
  return app;
}

/**
 * Last-resort error handler: JSON errors with a request id, the full error
 * (message and stack) in the log for 5xx, and Express's own handling when the
 * response has already started.
 */
export function errorHandler(error: unknown, req: Request, res: Response, next: NextFunction) {
  // Express closes a response that has already started.
  if (res.headersSent) return next(error);
  const candidate = error as Partial<HttpError>;
  const declared = candidate.status ?? candidate.statusCode;
  const status = typeof declared === "number" && declared >= 400 && declared < 600 ? declared : 500;
  if (status < 500) req.log.warn({ status, type: candidate.type }, "Request rejected");
  else req.log.error({ err: error }, "Unhandled request failure");
  const message =
    candidate.type === "entity.parse.failed"
      ? "The request body is not valid JSON."
      : candidate.type === "entity.too.large"
        ? "The request body is too large."
        : status < 500
          ? "The request could not be processed."
          : "An unexpected server error occurred.";
  res.status(status).json({ error: message, requestId: req.id ? String(req.id) : undefined });
}

export default createApp();
