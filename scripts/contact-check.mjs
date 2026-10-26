#!/usr/bin/env node
/**
 * Contact form check against a running deployment.
 *
 *   node scripts/contact-check.mjs <baseUrl>          # read-only: is delivery configured?
 *   node scripts/contact-check.mjs <baseUrl> --send   # also sends ONE labelled test message
 *
 * The Smoke workflow runs it with --send only when started by hand with
 * "contact_test" ticked. The message goes through the real form endpoint, so it
 * exercises the same Resend call a visitor's message does.
 */
const args = process.argv.slice(2);
const base = args.find((a) => !a.startsWith("--"));
const send = args.includes("--send");
if (!base || !/^https?:\/\//.test(base)) {
  console.error("Usage: node scripts/contact-check.mjs <baseUrl> [--send]");
  process.exit(2);
}
const origin = new URL(base).origin;
const request = (path, init = {}) => fetch(new URL(path, origin), { redirect: "manual", signal: AbortSignal.timeout(30_000), ...init });

const statusResponse = await request("/api/status", { headers: { Accept: "application/json" } });
const status = statusResponse.ok ? await statusResponse.json().catch(() => null) : null;
if (!status) {
  console.error(`/api/status returned HTTP ${statusResponse.status}`);
  process.exit(1);
}
const configured = Boolean(status.contact?.configured);
console.log(`Contact delivery configured: ${configured ? "yes" : "no"} (release ${status.release ?? "unknown"})`);
if (!configured) {
  console.error("Set RESEND_API_KEY and CONTACT_TO_EMAIL for Production in Vercel, then redeploy.");
  process.exit(1);
}
if (!send) process.exit(0);

const stamp = new Date().toISOString().replace(/\.\d+Z$/, "Z");
const response = await request("/api/contact", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    name: "Contact form check",
    email: "contact-check@example.com",
    subject: `Contact form check ${stamp}`,
    message: "This is an automated check of the portfolio contact form, started by hand from the Smoke workflow. No reply is needed.",
    company: "",
  }),
});
const body = await response.json().catch(() => ({}));
// The response carries only { ok, id } or { error }; nothing secret.
console.log(`POST /api/contact: HTTP ${response.status} ${JSON.stringify(body)}`);
if (!response.ok || body.ok !== true) process.exit(1);
console.log(`Sent. Look for "[Portfolio] Contact form check ${stamp}" in the CONTACT_TO_EMAIL inbox.`);
