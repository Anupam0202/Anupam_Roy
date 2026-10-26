import pino from "pino";

// JSON logs everywhere; for readable local logs the dev script pipes them through pino-pretty.
export const logger = pino({
  level: process.env.LOG_LEVEL ?? (process.env.VITEST ? "silent" : "info"),
  redact: [
    "req.headers.authorization",
    "req.headers.cookie",
    "res.headers['set-cookie']",
  ],
});
