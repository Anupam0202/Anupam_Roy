#!/usr/bin/env node
/**
 * Source-level release checks for Proof Atlas. Runs before type checks and
 * tests (`pnpm run check`). Each failure names the rule it protects.
 */
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const site = path.join(root, "artifacts/proof-atlas");
const core = path.join(root, "artifacts/proof-atlas-core");
const api = path.join(root, "artifacts/api-server");
const failures = [];
const check = (ok, message) => {
  if (!ok) failures.push(message);
};
const read = (p) => readFileSync(path.join(root, p), "utf8");

function walk(dir, filter) {
  const out = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (["node_modules", "dist", ".astro", "test-results", "playwright-report"].includes(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(full, filter));
    else if (filter(full)) out.push(full);
  }
  return out;
}

/* Tooling */
const pkg = JSON.parse(read("package.json"));
check(pkg.packageManager === "pnpm@10.34.5", "packageManager must stay pnpm@10.34.5");
check(/^>=22\.22\.0 <25$/.test(pkg.engines?.node ?? ""), "engines.node must be \">=22.22.0 <25\" (Astro 7.4.1 needs Node 22.22 or later)");

/* Deployment wiring */
const vercel = JSON.parse(read("vercel.json"));
check(vercel.outputDirectory === "artifacts/proof-atlas/dist", "vercel.json must serve the Astro build");
check(read("api/index.js").includes("artifacts/api-server/dist/app.mjs"), "api/index.js must export the bundled API app");
check(!existsSync(path.join(root, "artifacts/anupam-intelligence-systems")), "the retired Vite frontend must not come back");

/* Credentials: 74 PDF-backed records (owner decision D3) */
const credentials = JSON.parse(read("artifacts/proof-atlas-core/src/data/credentials.json"));
check(Array.isArray(credentials) && credentials.length === 74, `expected 74 credential records, found ${credentials.length}`);
const pdfs = readdirSync(path.join(site, "public/certs")).filter((f) => f.endsWith(".pdf"));
const thumbs = readdirSync(path.join(site, "public/cert-thumbs"));
const smallThumbs = readdirSync(path.join(site, "public/cert-thumbs-480"));
check(pdfs.length === 74, `expected 74 certificate PDFs, found ${pdfs.length}`);
check(thumbs.length === 74, `expected 74 certificate thumbnails, found ${thumbs.length}`);
check(smallThumbs.length === 74 && smallThumbs.every((f) => thumbs.includes(f)), "every certificate thumbnail needs a 480 px variant in public/cert-thumbs-480");
for (const c of credentials) {
  check(existsSync(path.join(site, "public", c.pdf)), `missing PDF for ${c.id}: ${c.pdf}`);
  check(existsSync(path.join(site, "public", c.thumbnail)), `missing thumbnail for ${c.id}: ${c.thumbnail}`);
  check(c.linkCheck !== "link_verified", `${c.id} claims a verified link, but no link check has been run`);
}

/* Wording and truthfulness rules */
const textFiles = [...walk(path.join(site, "src"), (f) => /\.(astro|tsx?|css|md)$/.test(f)), ...walk(path.join(core, "src"), (f) => /\.(ts|json)$/.test(f) && !f.endsWith(".test.ts"))];
const FORBIDDEN = [
  [/\b74\s+verified\b/i, 'never "74 verified" credentials'],
  [/\bverified (?:certifications|credentials)\b/i, 'never "verified certifications/credentials"'],
  [/\bNexusRAG is production[- ]ready\b/i, "NexusRAG production readiness is not claimed"],
  [/fonts\.(?:googleapis|gstatic)\.com/, "fonts are self-hosted"],
  [/<script[^>]+src="https?:\/\//i, "no third-party scripts"],
];
for (const file of textFiles) {
  const text = readFileSync(file, "utf8");
  for (const [re, rule] of FORBIDDEN) check(!re.test(text), `${path.relative(root, file)}: ${rule}`);
}

/* Secrets stay on the server */
const clientFiles = walk(path.join(site, "src"), (f) => /\.(astro|tsx?|mjs)$/.test(f));
for (const file of clientFiles) {
  const text = readFileSync(file, "utf8");
  check(!/import\.meta\.env\.(?!SSR|DEV|PROD|BASE_URL|MODE|SITE)\w+/.test(text), `${path.relative(root, file)}: no build-time env values in site code`);
  check(!/\b(GEMINI_API_KEY|RESEND_API_KEY|GITHUB_TOKEN)\b/.test(text), `${path.relative(root, file)}: server secret names must not appear in site code`);
}
const envExample = read(".env.example");
check(!/^(PUBLIC_|VITE_)\w*(KEY|TOKEN|SECRET)/m.test(envExample), ".env.example: no PUBLIC_/VITE_ secrets");
check(!/=(AIza|re_|ghp_|sk-)\w+/.test(envExample), ".env.example must not contain real-looking keys");
for (const file of walk(path.join(root, "artifacts"), (f) => /\.(ts|tsx|astro|mjs|js|json)$/.test(f))) {
  const text = readFileSync(file, "utf8");
  check(!/\b(AIza[0-9A-Za-z_-]{30,}|ghp_[0-9A-Za-z]{30,}|re_[0-9A-Za-z]{20,})\b/.test(text), `${path.relative(root, file)}: looks like a committed secret`);
}

/* API surface */
const apiRoutes = walk(path.join(api, "src/routes"), (f) => f.endsWith(".ts") && !f.endsWith(".test.ts")).map((f) => readFileSync(f, "utf8")).join("\n");
for (const route of ["/status", "/repository/analyze", "/repository/dependencies", "/packages/lookup", "/citations/resolve", "/citations/search", "/ai/ask", "/contact"])
  check(apiRoutes.includes(`"${route}"`), `API route ${route} is missing`);
check(!/@google\/genai/.test(read("artifacts/api-server/package.json")), "the Gemini SDK was replaced by a guarded REST call");
check(statSync(path.join(api, "src/app.test.ts")).isFile(), "API integration tests are required");

if (failures.length) {
  console.error(`Source verification failed (${failures.length}):\n- ${failures.join("\n- ")}`);
  process.exit(1);
}
console.log(`Source verification passed (${textFiles.length} content files, ${credentials.length} credentials).`);
