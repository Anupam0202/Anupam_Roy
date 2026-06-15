import express, { type Express, type NextFunction, type Request, type Response } from "express";
import helmet from "helmet";
import pinoHttp from "pino-http";
import fs from "node:fs";
import path from "node:path";
import router from "./routes";
import { logger } from "./lib/logger";

const app: Express = express();
const frontendDistCandidates = [
  path.resolve(process.cwd(), "../anupam-intelligence-systems/dist/public"),
  path.resolve(process.cwd(), "artifacts/anupam-intelligence-systems/dist/public"),
];

app.set("trust proxy", 1);
app.disable("x-powered-by");
app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
  }),
);
app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return { statusCode: res.statusCode };
      },
    },
  }),
);
app.use(express.json({ limit: "24kb", strict: true }));

app.use("/api", router);
app.use("/api", (_req, res) => {
  res.status(404).json({ error: "API route not found." });
});

const frontendDist = frontendDistCandidates.find((candidate) => fs.existsSync(path.join(candidate, "index.html")));

if (frontendDist) {
  app.use(express.static(frontendDist, { maxAge: "1h", etag: true }));
  app.get(/^\/(?!api).*/, (_req, res) => {
    res.sendFile(path.join(frontendDist, "index.html"));
  });
}

app.use((error: unknown, req: Request, res: Response, _next: NextFunction) => {
  req.log.warn({ error }, "Request rejected");
  if (res.headersSent) return;
  res.status(400).json({ error: "The request could not be processed." });
});

export default app;
