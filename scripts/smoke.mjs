#!/usr/bin/env node
/**
 * Read-only smoke check of a running deployment (production, a preview, or
 * the local parity server).
 *
 *   node scripts/smoke.mjs <baseUrl> [--expect-release <sha7>]
 *   pnpm run verify:production
 *
 * Checks every sitemap route, every vercel.json redirect, the 404 page,
 * robots.txt and sitemap.xml, the security and cache headers, and
 * /api/status. Then makes one real request to each API feature (repository
 * analysis and dependencies, npm and PyPI lookups, citation resolve and
 * search, Ask the Atlas); a provider that is down or rate-limited is a
 * warning, any other error fails the run. It never sends a contact message.
 */
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { redirectFor } from "./vercel-routing.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const config = JSON.parse(readFileSync(path.join(root, "vercel.json"), "utf8"));

const args = process.argv.slice(2);
const base = args.find((a) => !a.startsWith("--"));
const releaseFlag = args.indexOf("--expect-release");
const expectRelease = releaseFlag >= 0 ? args[releaseFlag + 1] : undefined;
if (!base || !/^https?:\/\//.test(base) || (releaseFlag >= 0 && !/^[0-9a-f]{7,40}$/.test(expectRelease ?? ""))) {
  console.error("Usage: node scripts/smoke.mjs <baseUrl> [--expect-release <sha7>]");
  process.exit(2);
}
const origin = new URL(base).origin;
const url = (p) => new URL(p, origin).href;
// Same-origin requests only, with a timeout, and redirects reported rather than followed.
const get = (p, init = {}) => fetch(url(p), { redirect: "manual", signal: AbortSignal.timeout(20_000), ...init });

const failures = [];
const warnings = [];
let checks = 0;
const check = (ok, message) => {
  checks += 1;
  if (!ok) failures.push(message);
};

const SECURITY_HEADERS = config.headers.find((h) => h.source === "/(.*)").headers;
const headerRule = (source) => Object.fromEntries(config.headers.find((h) => h.source === source).headers.map((h) => [h.key.toLowerCase(), h.value]));

/* Routes from the deployment's own sitemap */
const sitemap = await get("/sitemap.xml");
check(sitemap.status === 200, `/sitemap.xml returned ${sitemap.status}`);
const routes = [...(await sitemap.text()).matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => new URL(m[1]).pathname);
check(routes.length > 0, "sitemap.xml lists no routes");
for (const route of routes) {
  const res = await get(route);
  check(res.status === 200, `${route}: HTTP ${res.status}`);
  const html = await res.text();
  check((html.match(/<h1[\s>]/g) ?? []).length === 1, `${route}: expected exactly one <h1>`);
  const csp = /<meta http-equiv="content-security-policy" content="([^"]+)"/i.exec(html)?.[1] ?? "";
  check(/'sha256-[A-Za-z0-9+/=]+'/.test(csp), `${route}: CSP meta tag with sha256- hashes missing`);
  for (const h of SECURITY_HEADERS) check(res.headers.get(h.key) === h.value, `${route}: ${h.key} is ${JSON.stringify(res.headers.get(h.key))}, expected ${JSON.stringify(h.value)}`);
}

/* Redirects: one concrete path per vercel.json rule, expecting the rule Vercel applies first */
const SAMPLE = { ":slug": "plantpal" };
const redirectPaths = config.redirects.map((r) =>
  r.source.startsWith("/((?!api") ? "/lab" : r.source.replace(/:[a-z]+/g, (m) => SAMPLE[m] ?? "sample"),
);
for (const p of [...new Set(redirectPaths)]) {
  const expected = redirectFor(config.redirects, p);
  const res = await get(p);
  const location = res.headers.get("location");
  check(res.status === 308, `${p}: expected 308, got ${res.status}`);
  if (location && expected) {
    const got = new URL(location, origin);
    const want = new URL(expected.destination, origin);
    check(got.pathname + got.hash === want.pathname + want.hash, `${p}: Location ${location}, expected ${expected.destination}`);
  } else check(false, `${p}: no Location header`);
}

/* 404 handling */
check((await get("/no-such-page/")).status === 404, "/no-such-page/ should return 404");
const slashless = await get("/no-such-page");
check(slashless.status === 308, `/no-such-page should return 308, got ${slashless.status}`);
const next = slashless.headers.get("location");
check(Boolean(next) && (await get(new URL(next ?? "/", origin).pathname)).status === 404, "/no-such-page should redirect to a 404");

/* Static files and cache headers */
const robots = await get("/robots.txt");
check(robots.status === 200, `/robots.txt returned ${robots.status}`);
const home = await (await get("/")).text();
const asset = /\/_astro\/[^"']+\.(?:css|js)/.exec(home)?.[0];
check(Boolean(asset), "no /_astro/ asset referenced from the home page");
if (asset) {
  const res = await get(asset);
  check(res.status === 200, `${asset}: HTTP ${res.status}`);
  check(res.headers.get("cache-control") === headerRule("/_astro/(.*)")["cache-control"], `${asset}: Cache-Control is ${res.headers.get("cache-control")}`);
}
const cert = /\/certs\/[a-z0-9-]+\.pdf/.exec(await (await get("/credentials/")).text())?.[0];
check(Boolean(cert), "no /certs/ PDF linked from /credentials/");
if (cert) {
  const res = await get(cert, { method: "HEAD" });
  const rule = headerRule("/certs/(.*)");
  check(res.status === 200, `${cert}: HTTP ${res.status}`);
  check(res.headers.get("cache-control") === rule["cache-control"], `${cert}: Cache-Control is ${res.headers.get("cache-control")}`);
  check(res.headers.get("x-robots-tag") === rule["x-robots-tag"], `${cert}: X-Robots-Tag is ${res.headers.get("x-robots-tag")}`);
}

/* API status, waiting for the expected release when asked */
const STATUS_FIELDS = ["status", "release", "assistant", "contact", "providers", "policyIssues", "disabledByConfig", "budgets", "cooldowns", "limitsScope"];
let status;
const deadline = Date.now() + (expectRelease ? 5 * 60_000 : 0);
for (;;) {
  const res = await get("/api/status", { headers: { Accept: "application/json" } });
  status = res.ok ? await res.json().catch(() => null) : null;
  if (!expectRelease || String(status?.release ?? "").startsWith(expectRelease.slice(0, 7)) || Date.now() > deadline) break;
  console.log(`Waiting for release ${expectRelease} (serving ${status?.release ?? "unknown"})…`);
  await new Promise((r) => setTimeout(r, 15_000));
}
check(status !== null, "/api/status did not return JSON");
if (status) {
  for (const f of STATUS_FIELDS) check(f in status, `/api/status: field ${f} missing`);
  check(Array.isArray(status.policyIssues) && status.policyIssues.length === 0, `/api/status: policy issues ${JSON.stringify(status.policyIssues)}`);
  if (expectRelease) check(String(status.release).startsWith(expectRelease.slice(0, 7)), `/api/status: release ${status.release}, expected ${expectRelease.slice(0, 7)}`);
  console.log(`Contact form: ${status.contact?.configured ? "configured" : "not configured"}`);
  if (!status.contact?.configured) warnings.push("The contact form is not configured: set RESEND_API_KEY and CONTACT_TO_EMAIL for Production");
}

/*
 * Feature checks: one real request to every API-backed feature, as a visitor would make it.
 * A provider that is down, rate-limited or over its daily budget (429, 502, 503) is a warning;
 * any other failure is a fault in this site and fails the run.
 */
const post = (p, payload) => get(p, { method: "POST", headers: { "Content-Type": "application/json", Accept: "application/json" }, body: JSON.stringify(payload) });
const PROVIDER_TROUBLE = new Set([429, 502, 503]);
const features = [];
async function feature(name, path, payload, inspect = () => "") {
  try {
    const res = await post(path, payload);
    const body = await res.json().catch(() => null);
    if (res.status === 200 && body && !body.error) {
      const note = inspect(body);
      features.push(`${name}: ok${note ? ` (${note})` : ""}`);
    } else if (PROVIDER_TROUBLE.has(res.status)) {
      features.push(`${name}: provider unavailable (HTTP ${res.status})`);
      warnings.push(`${name}: HTTP ${res.status} ${body?.error ?? ""}`.trim());
    } else {
      features.push(`${name}: FAILED (HTTP ${res.status})`);
      check(false, `${name}: HTTP ${res.status} ${body?.error ?? "no JSON body"}`);
    }
  } catch (error) {
    features.push(`${name}: not reachable`);
    warnings.push(`${name} could not be checked: ${error.message}`);
  }
}
const blockedSections = (coverage = {}) => Object.entries(coverage).filter(([, state]) => state === "provider_blocked").map(([section]) => section);

await feature("Repository Evidence Graph", "/api/repository/analyze", { owner: "Anupam0202", repo: "Anupam_Roy" }, (b) => {
  const blocked = blockedSections(b.coverage);
  if (blocked.length) warnings.push(`GitHub did not return ${blocked.join(", ")} (rate limit?); a GITHUB_TOKEN raises the limit`);
  return blocked.length ? `blocked: ${blocked.join(", ")}` : "no section blocked";
});
await feature("Declared dependencies", "/api/repository/dependencies", { owner: "Anupam0202", repo: "Anupam_Roy" }, (b) => {
  const blocked = (b.manifests ?? []).filter((m) => m.state === "provider_blocked").map((m) => m.path);
  if (blocked.length) warnings.push(`GitHub did not return ${blocked.join(", ")} (rate limit?)`);
  return `${(b.manifests ?? []).filter((m) => m.state === "observed").length} manifests read${blocked.length ? `, blocked: ${blocked.join(", ")}` : ""}`;
});
await feature("npm package lookup", "/api/packages/lookup", { ecosystem: "npm", name: "astro" }, (b) => (b.package?.latestVersion ? `astro ${b.package.latestVersion}` : ""));
await feature("PyPI package lookup", "/api/packages/lookup", { ecosystem: "pypi", name: "requests" }, (b) => (b.package?.latestVersion ? `requests ${b.package.latestVersion}` : ""));
await feature("Citation resolve", "/api/citations/resolve", { doi: "10.1038/nature14539", compare: true }, (b) => (b.record?.title ? "Crossref record" + (b.partial ? ", DataCite unavailable" : "") : ""));
await feature("Citation search", "/api/citations/search", { query: "retrieval augmented generation" }, (b) => `${Array.isArray(b.results) ? b.results.length : 0} results`);

/* Ask the Atlas: AI when configured, otherwise ledger evidence. Both are valid answers; AI off is a warning. */
try {
  const res = await post("/api/ai/ask", { question: "What is NexusRAG?" });
  const body = await res.json();
  const cited = body.result?.citationIds?.length ?? 0;
  features.push(`Ask the Atlas: ${body.mode}${body.reason ? ` (${body.reason})` : ""}${body.result ? `, ${body.result.state}, ${cited} citation${cited === 1 ? "" : "s"}` : ""}`);
  check(res.status === 200, `Ask the Atlas: HTTP ${res.status}`);
  if (body.mode === "deterministic" && status?.assistant?.enabled) warnings.push(`Ask the Atlas answered without AI (reason: ${body.reason ?? "unknown"})`);
  // Status is per instance, so this is best effort: it names the model that instance used.
  const assistant = (await (await get("/api/status", { headers: { Accept: "application/json" } })).json()).assistant ?? {};
  console.log(`Ask the Atlas model: ${assistant.model ?? "unknown"}`);
  if (assistant.fallbackFrom) warnings.push(`GEMINI_MODEL ${assistant.fallbackFrom} is not available; Ask the Atlas switched to ${assistant.model}. Update GEMINI_MODEL.`);
} catch (error) {
  features.push("Ask the Atlas: not reachable");
  warnings.push(`Ask the Atlas could not be checked: ${error.message}`);
}
features.push(`Contact form: ${status?.contact?.configured ? "configured" : "not configured"} (no message sent)`);
console.log(`Feature checks:\n- ${features.join("\n- ")}`);

for (const w of warnings) console.warn(`warning: ${w}`);
if (failures.length) {
  console.error(`Smoke check failed for ${origin} (${failures.length} of ${checks}):\n- ${failures.join("\n- ")}`);
  process.exit(1);
}
console.log(`Smoke check passed for ${origin}: ${checks} checks, ${routes.length} routes${status?.release ? `, release ${status.release}` : ""}.`);
