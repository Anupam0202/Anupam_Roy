import { Resend } from "resend";
import { Router, type IRouter, type Request, type Response } from "express";

const router: IRouter = Router();
const submissions = new Map<string, number[]>();

interface ContactBody {
  name?: string;
  email?: string;
  subject?: string;
  message?: string;
  company?: string;
}

const CONTACT_LIMIT = 3;
const CONTACT_WINDOW_MS = 10 * 60_000;
const DEFAULT_FROM_EMAIL = "Anupam Roy Portfolio <onboarding@resend.dev>";

type ResendEmailResult = Awaited<ReturnType<Resend["emails"]["send"]>>;
type ResendEmailError = NonNullable<ResendEmailResult["error"]>;

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function normalizeField(value: unknown, maxLength: number) {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function isRateLimited(ip: string) {
  const now = Date.now();
  const recent = (submissions.get(ip) ?? []).filter((time) => now - time < CONTACT_WINDOW_MS);
  if (recent.length >= CONTACT_LIMIT) {
    submissions.set(ip, recent);
    return true;
  }
  recent.push(now);
  submissions.set(ip, recent);
  return false;
}

function validateContact(body: ContactBody) {
  const name = normalizeField(body.name, 120);
  const email = normalizeField(body.email, 180).toLowerCase();
  const subject = normalizeField(body.subject, 160);
  const message = normalizeField(body.message, 5000);

  if (!name || !email || !subject || !message) {
    return { error: "Name, email, subject, and message are required." };
  }
  if (!isValidEmail(email)) {
    return { error: "Please provide a valid sender email." };
  }
  if (message.length < 20) {
    return { error: "Please include at least 20 characters in the message." };
  }

  return { name, email, subject, message };
}

function isSenderDomainError(error: ResendEmailError) {
  const message = String(error.message ?? "").toLowerCase();
  return error.statusCode === 403 && (message.includes("domain is not verified") || message.includes("verify your domain"));
}

function getSandboxRecipient(error: ResendEmailError) {
  const message = String(error.message ?? "");
  if (error.statusCode !== 403 || !message.toLowerCase().includes("only send testing emails")) return null;
  return message.match(/own email address \(([^)]+)\)/i)?.[1]?.trim() ?? null;
}

router.post("/contact", async (req: Request, res: Response) => {
  const body = req.body as ContactBody;
  const ip = req.ip ?? req.socket.remoteAddress ?? "unknown";

  if (body.company) {
    return void res.status(200).json({ ok: true });
  }

  const parsed = validateContact(body);
  if ("error" in parsed) {
    return void res.status(400).json({ error: parsed.error });
  }

  if (isRateLimited(ip)) {
    return void res.status(429).json({ error: "Too many contact attempts. Please wait a few minutes and try again." });
  }

  const apiKey = process.env.RESEND_API_KEY;
  const to = process.env.CONTACT_TO_EMAIL ?? "anupam020202@gmail.com";
  const from = process.env.CONTACT_FROM_EMAIL?.trim() || DEFAULT_FROM_EMAIL;
  const fallbackFrom = process.env.CONTACT_FALLBACK_FROM_EMAIL?.trim() || DEFAULT_FROM_EMAIL;
  const sandboxTo = process.env.RESEND_SANDBOX_TO_EMAIL?.trim();

  if (!apiKey) {
    req.log.warn({ route: "contact" }, "RESEND_API_KEY is missing");
    return void res.status(503).json({ error: "Contact email service is not configured on the server." });
  }

  const timestamp = new Date().toISOString();
  const safeName = escapeHtml(parsed.name);
  const safeEmail = escapeHtml(parsed.email);
  const safeSubject = escapeHtml(parsed.subject);
  const safeMessage = escapeHtml(parsed.message).replace(/\n/g, "<br />");
  const resend = new Resend(apiKey);

  const sendMessage = (sender: string, recipient: string) =>
    resend.emails.send({
      from: sender,
      to: recipient,
      replyTo: parsed.email,
      subject: recipient === to ? `[Portfolio] ${parsed.subject}` : `[Portfolio sandbox -> ${to}] ${parsed.subject}`,
      text: [
        `Sender name: ${parsed.name}`,
        `Sender email: ${parsed.email}`,
        `Subject: ${parsed.subject}`,
        `Configured inbox: ${to}`,
        `Delivered inbox: ${recipient}`,
        `Timestamp: ${timestamp}`,
        "Source: portfolio contact form",
        "",
        parsed.message,
      ].join("\n"),
      html: `
        <div style="font-family:Arial,sans-serif;line-height:1.6;color:#111827">
          <h2>Portfolio contact form</h2>
          <p><strong>Name:</strong> ${safeName}</p>
          <p><strong>Email:</strong> ${safeEmail}</p>
          <p><strong>Subject:</strong> ${safeSubject}</p>
          <p><strong>Configured inbox:</strong> ${escapeHtml(to)}</p>
          <p><strong>Delivered inbox:</strong> ${escapeHtml(recipient)}</p>
          <p><strong>Timestamp:</strong> ${timestamp}</p>
          <p><strong>Source:</strong> portfolio contact form</p>
          <hr style="border:none;border-top:1px solid #e5e7eb;margin:20px 0" />
          <p>${safeMessage}</p>
        </div>
      `,
    });

  try {
    let deliveredTo = to;
    let { data, error } = await sendMessage(from, deliveredTo);

    if (error && from !== fallbackFrom && isSenderDomainError(error)) {
      req.log.warn({ configuredFrom: from, fallbackFrom, reason: error.message }, "Resend sender domain rejected; retrying fallback sender");
      ({ data, error } = await sendMessage(fallbackFrom, deliveredTo));
    }

    const fallbackRecipient = error ? sandboxTo || getSandboxRecipient(error) : null;
    if (error && fallbackRecipient && fallbackRecipient !== deliveredTo) {
      req.log.warn({ configuredTo: deliveredTo, fallbackTo: fallbackRecipient, reason: error.message }, "Resend sandbox recipient restriction; retrying allowed recipient");
      deliveredTo = fallbackRecipient;
      ({ data, error } = await sendMessage(fallbackFrom, deliveredTo));
    }

    if (error) {
      req.log.error({ error }, "Resend contact request failed");
      return void res.status(502).json({ error: "Email delivery is temporarily unavailable. Please email Anupam directly." });
    }

    res.json({ ok: true, id: data?.id, delivery: deliveredTo === to ? "primary" : "sandbox_fallback" });
  } catch (error) {
    req.log.error({ error }, "Contact email request failed");
    res.status(502).json({ error: "Contact email could not be sent. Please try again later." });
  }
});

export default router;
