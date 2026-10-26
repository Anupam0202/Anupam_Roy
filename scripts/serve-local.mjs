#!/usr/bin/env node
/**
 * Local stand-in for the Vercel deployment: serves the built site with the
 * redirects and headers from vercel.json, mounts the same API function, and
 * answers unknown paths with the real 404 page and status. End-to-end tests
 * run against this server.
 *
 *   pnpm run build && pnpm start      # http://127.0.0.1:4173
 */
import { createReadStream, existsSync, readFileSync, statSync } from "node:fs";
import { createServer } from "node:http";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { match, redirectFor } from "./vercel-routing.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const config = JSON.parse(readFileSync(path.join(root, "vercel.json"), "utf8"));
const siteDir = path.join(root, config.outputDirectory);
const apiBundle = path.join(root, "artifacts/api-server/dist/app.mjs");

for (const required of [path.join(siteDir, "index.html"), apiBundle]) {
  if (!existsSync(required)) {
    console.error(`Missing ${path.relative(root, required)}. Run "pnpm run build" first.`);
    process.exit(1);
  }
}

const redirects = (config.redirects ?? []).map((r) => ({ ...r }));
const headerRules = config.headers ?? [];

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".json": "application/json",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".webp": "image/webp",
  ".woff2": "font/woff2",
  ".woff": "font/woff",
  ".pdf": "application/pdf",
  ".txt": "text/plain; charset=utf-8",
  ".xml": "application/xml; charset=utf-8",
};

function applyHeaders(res, pathname) {
  for (const rule of headerRules) if (match(rule.source, pathname)) for (const h of rule.headers) res.setHeader(h.key, h.value);
}

function resolveFile(pathname) {
  let decoded;
  try {
    decoded = decodeURIComponent(pathname);
  } catch {
    return null;
  }
  const candidate = path.normalize(path.join(siteDir, decoded));
  if (!candidate.startsWith(siteDir)) return null;
  const file = decoded.endsWith("/") ? path.join(candidate, "index.html") : candidate;
  return existsSync(file) && statSync(file).isFile() ? file : null;
}

function sendFile(res, file, status = 200) {
  res.statusCode = status;
  res.setHeader("Content-Type", MIME[path.extname(file)] ?? "application/octet-stream");
  createReadStream(file).pipe(res);
}

const { default: api } = await import(pathToFileURL(apiBundle).href);

const server = createServer((req, res) => {
  const url = new URL(req.url ?? "/", "http://localhost");
  const pathname = url.pathname;

  const redirect = redirectFor(redirects, pathname);
  if (redirect) {
    applyHeaders(res, pathname);
    res.statusCode = redirect.permanent ? 308 : 307;
    // Vercel carries the query string over, except into a destination with a fragment.
    res.setHeader("Location", redirect.destination + (url.search && !redirect.destination.includes("#") ? url.search : ""));
    return void res.end();
  }

  if (pathname === "/api" || pathname.startsWith("/api/")) return void api(req, res);

  applyHeaders(res, pathname);
  if (req.method !== "GET" && req.method !== "HEAD") {
    res.statusCode = 405;
    return void res.end();
  }
  const file = resolveFile(pathname);
  if (file) return sendFile(res, file);
  sendFile(res, path.join(siteDir, "404.html"), 404);
});

const port = Number(process.env.PORT ?? 4173);
server.listen(port, process.env.HOST ?? "127.0.0.1", () => {
  console.log(`Proof Atlas (Vercel-parity) on http://${process.env.HOST ?? "127.0.0.1"}:${port}`);
});
