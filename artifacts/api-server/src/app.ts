import express, {
  type Express,
  type NextFunction,
  type Request,
  type Response,
} from "express";
import helmet from "helmet";
import pinoHttp from "pino-http";
import fs from "node:fs";
import path from "node:path";
import router from "./routes";
import { logger } from "./lib/logger";
const app: Express = express();
const candidates = [
  path.resolve(process.cwd(), "../anupam-intelligence-systems/dist/public"),
  path.resolve(
    process.cwd(),
    "artifacts/anupam-intelligence-systems/dist/public",
  ),
];
app.set("trust proxy", 1);
app.disable("x-powered-by");
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        baseUri: ["'self'"],
        formAction: ["'self'"],
        frameAncestors: ["'none'"],
        objectSrc: ["'none'"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", "data:", "blob:"],
        fontSrc: ["'self'", "data:"],
        connectSrc: ["'self'"],
        frameSrc: ["'self'"],
        workerSrc: ["'self'", "blob:"],
        upgradeInsecureRequests: [],
      },
    },
    crossOriginEmbedderPolicy: false,
    crossOriginOpenerPolicy: { policy: "same-origin" },
    crossOriginResourcePolicy: { policy: "same-origin" },
    referrerPolicy: { policy: "strict-origin-when-cross-origin" },
  }),
);
app.use(
  pinoHttp({
    logger,
    serializers: {
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
app.use("/api", router);
app.use("/api", (_req, res) => {
  res.status(404).json({ error: "API route not found." });
});
const dist = candidates.find((candidate) =>
  fs.existsSync(path.join(candidate, "index.html")),
);
if (dist) {
  app.use(
    express.static(dist, {
      etag: true,
      index: false,
      maxAge: "1h",
      setHeaders(res, filePath) {
        const normalized = filePath.split(path.sep).join("/");
        if (normalized.endsWith(".html"))
          res.setHeader("Cache-Control", "no-cache");
        if (normalized.includes("/assets/"))
          res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
        if (normalized.includes("/certs/")) {
          res.setHeader("Cache-Control", "private, max-age=3600");
          res.setHeader("X-Robots-Tag", "noindex, noarchive");
        }
      },
    }),
  );
  app.get("/", (_req, res) => {
    res.setHeader("Cache-Control", "no-cache");
    res.sendFile(path.join(dist, "index.html"));
  });
}
type HttpError = Error & { status?: number; statusCode?: number };
app.use((error: unknown, req: Request, res: Response, _next: NextFunction) => {
  if (res.headersSent) return;
  const candidate = error as Partial<HttpError>;
  const declared = candidate.status ?? candidate.statusCode;
  const status =
    typeof declared === "number" && declared >= 400 && declared < 600
      ? declared
      : 500;
  if (status < 500) req.log.warn({ error, status }, "Request rejected");
  else req.log.error({ error, status }, "Unhandled request failure");
  res.status(status).json({
    error:
      status < 500
        ? "The request could not be processed."
        : "An unexpected server error occurred.",
    requestId: req.id ? String(req.id) : undefined,
  });
});
export default app;
