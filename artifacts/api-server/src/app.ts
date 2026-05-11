import express, { type Express } from "express";
import cors from "cors";
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
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api", router);

const frontendDist = frontendDistCandidates.find((candidate) => fs.existsSync(path.join(candidate, "index.html")));

if (frontendDist) {
  app.use(express.static(frontendDist));
  app.get(/^\/(?!api).*/, (_req, res) => {
    res.sendFile(path.join(frontendDist, "index.html"));
  });
}

export default app;
