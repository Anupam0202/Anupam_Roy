import { Router, type IRouter } from "express";
import type { Deps } from "../lib/deps";
import { clientKey, providerUnavailable, providerUserAgent, requireJson, tooMany, unavailable } from "../lib/http";
import { ProviderUnavailable, contactConfigured, type ProviderClient } from "../lib/providers";
import { createRateLimiter } from "../lib/rate-limit";

const RESEND_EMAILS = "https://api.resend.com/emails";
/** Resend's shared testing sender; it only delivers to the Resend account owner. */
export const DEFAULT_FROM_EMAIL = "Anupam Roy Portfolio <onboarding@resend.dev>";

interface ContactBody {
  name?: unknown;
  email?: unknown;
  subject?: unknown;
  message?: unknown;
  company?: unknown;
}

interface Parsed {
  name: string;
  email: string;
  subject: string;
  message: string;
}

/** Trims, removes control characters (keeping newlines where allowed) and clamps length. */
function field(value: unknown, maxLength: number, multiline = false): string {
  if (typeof value !== "string") return "";
  // Matching control characters is the point of this pattern.
  // eslint-disable-next-line no-control-regex
  const controls = multiline ? /[\u0000-\u0009\u000B-\u001F\u007F]/g : /[\u0000-\u001F\u007F]+/g;
  return value.replace(/\r\n?/g, "\n").replace(controls, multiline ? "" : " ").trim().slice(0, maxLength);
}

function escapeHtml(value: string) {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
}

export function validateContact(body: ContactBody): Parsed | { error: string } {
  const name = field(body.name, 120);
  const email = field(body.email, 180).toLowerCase();
  // Single line: CR and LF can never reach the email headers.
  const subject = field(body.subject, 160);
  const message = field(body.message, 5_000, true);
  if (!name || !email || !subject || !message) return { error: "Name, email, subject and message are required." };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { error: "Please provide a valid email address." };
  if (message.length < 20) return { error: "Please write at least 20 characters in the message." };
  return { name, email, subject, message };
}

type SendError = { status: number; name: string; message: string };

/** The part of an address after "@", lower-cased; enough to tell inboxes apart in logs without exposing them. */
export function addressDomain(address: string): string {
  const email = /<([^>]+)>/.exec(address)?.[1] ?? address;
  return email.slice(email.lastIndexOf("@") + 1).trim().toLowerCase() || "unknown";
}

const isSenderDomainError = (e: SendError) => e.status === 403 && /domain is not verified|verify your domain/i.test(e.message);
const isTestingOnlyError = (e: SendError) => e.status === 403 && /only send testing emails/i.test(e.message);

export function createContactRouter(deps: Deps, providers: ProviderClient): IRouter {
  const router = Router();
  const limited = createRateLimiter({ limit: 3, windowMs: 10 * 60_000 });

  router.post("/contact", async (req, res) => {
    res.setHeader("Cache-Control", "no-store");
    if (!requireJson(req, res)) return;
    const body = (req.body ?? {}) as ContactBody;
    // Honeypot: bots fill the hidden "company" field; pretend success.
    if (field(body.company, 120)) return void res.status(200).json({ ok: true });

    const parsed = validateContact(body);
    if ("error" in parsed) return void res.status(400).json({ error: parsed.error });

    // Counted after validation so fixing a typo does not use up an attempt.
    if (limited(clientKey(req))) return tooMany(res, 600, "Too many messages from this connection. Please wait a few minutes and try again.");

    if (!contactConfigured(deps.env)) {
      req.log.warn({ route: "contact" }, "Contact delivery is not configured (RESEND_API_KEY or CONTACT_TO_EMAIL missing)");
      return unavailable(res, undefined, "The contact form is not available right now. Please email Anupam directly.");
    }

    const env = deps.env;
    const key = env.RESEND_API_KEY!.trim();
    const to = env.CONTACT_TO_EMAIL!.trim();
    const from = env.CONTACT_FROM_EMAIL?.trim() || DEFAULT_FROM_EMAIL;
    const fallbackFrom = env.CONTACT_FALLBACK_FROM_EMAIL?.trim() || DEFAULT_FROM_EMAIL;
    const sandboxTo = env.RESEND_SANDBOX_TO_EMAIL?.trim();
    const timestamp = new Date(deps.now()).toISOString();

    const send = async (sender: string, recipient: string): Promise<{ id?: string } | SendError> => {
      const response = await providers.request("resend", RESEND_EMAILS, {
        method: "POST",
        headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json", "User-Agent": providerUserAgent() },
        body: JSON.stringify({
          from: sender,
          to: [recipient],
          reply_to: parsed.email,
          subject: `[Portfolio] ${parsed.subject}`,
          text: [
            `Sender name: ${parsed.name}`,
            `Sender email: ${parsed.email}`,
            `Subject: ${parsed.subject}`,
            `Timestamp: ${timestamp}`,
            "Source: portfolio contact form",
            "",
            parsed.message,
          ].join("\n"),
          html: `<div style="font-family:Arial,sans-serif;line-height:1.6;color:#111827"><h2>Portfolio contact form</h2><p><strong>Name:</strong> ${escapeHtml(parsed.name)}</p><p><strong>Email:</strong> ${escapeHtml(parsed.email)}</p><p><strong>Subject:</strong> ${escapeHtml(parsed.subject)}</p><p><strong>Timestamp:</strong> ${timestamp}</p><hr style="border:none;border-top:1px solid #e5e7eb;margin:20px 0" /><p>${escapeHtml(parsed.message).replace(/\n/g, "<br />")}</p></div>`,
        }),
      });
      let json: Record<string, unknown> = {};
      try {
        json = JSON.parse(response.text) as Record<string, unknown>;
      } catch {
        /* empty or non-JSON body */
      }
      if (response.status >= 200 && response.status < 300) return { id: typeof json.id === "string" ? json.id : undefined };
      return { status: response.status, name: String(json.name ?? "error"), message: String(json.message ?? "") };
    };

    try {
      // At most two attempts. On a sender-domain or testing-only refusal, the second
      // goes from the fallback sender, to the sandbox recipient when one is configured
      // (Resend's testing sender only delivers to the account owner).
      // Each attempt is logged with domains and variable names only, never full addresses,
      // so the runtime logs show which path a message took and where it went.
      const attempt = async (path: "primary" | "fallback-sender" | "sandbox", sender: string, recipientVar: "CONTACT_TO_EMAIL" | "RESEND_SANDBOX_TO_EMAIL") => {
        const recipient = recipientVar === "RESEND_SANDBOX_TO_EMAIL" && sandboxTo ? sandboxTo : to;
        const outcome = await send(sender, recipient);
        req.log.info(
          {
            provider: "resend",
            path,
            senderDomain: addressDomain(sender),
            recipientVar,
            recipientDomain: addressDomain(recipient),
            ...("status" in outcome ? { status: outcome.status, error: outcome.name } : { status: 200, id: outcome.id }),
          },
          "Contact delivery attempt",
        );
        return outcome;
      };
      let result = await attempt("primary", from, "CONTACT_TO_EMAIL");
      if ("status" in result) {
        if (isSenderDomainError(result) && fallbackFrom !== from) result = await attempt("fallback-sender", fallbackFrom, sandboxTo ? "RESEND_SANDBOX_TO_EMAIL" : "CONTACT_TO_EMAIL");
        else if (isTestingOnlyError(result) && sandboxTo && sandboxTo !== to) result = await attempt("sandbox", fallbackFrom, "RESEND_SANDBOX_TO_EMAIL");
      }
      if ("status" in result) {
        req.log.error({ provider: "resend", status: result.status, name: result.name }, "Contact delivery failed");
        if (result.status === 429) return tooMany(res, 60, "The email service is busy. Please try again in a minute or email Anupam directly.");
        return void res.status(502).json({ error: "The message could not be delivered. Please email Anupam directly." });
      }
      res.json({ ok: true, id: result.id });
    } catch (error) {
      if (error instanceof ProviderUnavailable) return providerUnavailable(res, error, "The contact form", deps.now());
      req.log.error({ err: error }, "Contact delivery request failed");
      res.status(502).json({ error: "The message could not be delivered. Please email Anupam directly." });
    }
  });

  return router;
}
