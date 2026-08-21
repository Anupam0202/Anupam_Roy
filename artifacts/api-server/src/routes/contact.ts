import { Resend } from "resend";
import { Router, type IRouter, type Request, type Response } from "express";
import { createRateLimiter } from "../lib/rate-limit";

const router: IRouter = Router();
const isContactRateLimited = createRateLimiter({
  limit: 3,
  windowMs: 10 * 60_000,
});
const DEFAULT_FROM_EMAIL = "Anupam Roy Portfolio <onboarding@resend.dev>";

interface ContactBody {
  name?: unknown;
  email?: unknown;
  subject?: unknown;
  message?: unknown;
  company?: unknown;
}

type ResendEmailResult = Awaited<ReturnType<Resend["emails"]["send"]>>;
type ResendEmailError = NonNullable<ResendEmailResult["error"]>;

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

function validateContact(body: ContactBody) {
  const name = normalizeField(body.name, 120);
  const email = normalizeField(body.email, 180).toLowerCase();
  const subject = normalizeField(body.subject, 160);
  const message = normalizeField(body.message, 5_000);

  if (!name || !email || !subject || !message) {
    return { error: "Name, email, subject, and message are required." };
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { error: "Please provide a valid sender email." };
  }
  if (message.length < 20) {
    return { error: "Please include at least 20 characters in the message." };
  }

  return { name, email, subject, message };
}

function isSenderDomainError(error: ResendEmailError) {
  const message = String(error.message ?? "").toLowerCase();
  return (
    error.statusCode === 403 &&
    (message.includes("domain is not verified") ||
      message.includes("verify your domain"))
  );
}

function getSandboxRecipient(error: ResendEmailError) {
  const message = String(error.message ?? "");
  if (
    error.statusCode !== 403 ||
    !message.toLowerCase().includes("only send testing emails")
  )
    return null;
  return message.match(/own email address \(([^)]+)\)/i)?.[1]?.trim() ?? null;
}

router.post("/contact", async (req: Request, res: Response) => {
  res.setHeader("Cache-Control", "no-store");
  if (!req.is("application/json")) {
    return void res
      .status(415)
      .json({ error: "Content-Type must be application/json." });
  }

  const body = (req.body ?? {}) as ContactBody;
  if (normalizeField(body.company, 120))
    return void res.status(200).json({ ok: true });

  const ip = req.ip ?? req.socket.remoteAddress ?? "unknown";
  if (isContactRateLimited(ip)) {
    res.setHeader("Retry-After", "600");
    return void res.status(429).json({
      error:
        "Too many contact attempts. Please wait a few minutes and try again.",
    });
  }

  const parsed = validateContact(body);
  if ("error" in parsed)
    return void res.status(400).json({ error: parsed.error });

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    req.log.warn({ route: "contact" }, "RESEND_API_KEY is missing");
    return void res.status(503).json({
      error: "Contact email service is not configured on the server.",
    });
  }

  const to = process.env.CONTACT_TO_EMAIL?.trim() || "anupam020202@gmail.com";
  const from = process.env.CONTACT_FROM_EMAIL?.trim() || DEFAULT_FROM_EMAIL;
  const fallbackFrom =
    process.env.CONTACT_FALLBACK_FROM_EMAIL?.trim() || DEFAULT_FROM_EMAIL;
  const sandboxTo = process.env.RESEND_SANDBOX_TO_EMAIL?.trim();
  const timestamp = new Date().toISOString();
  const resend = new Resend(apiKey);

  const sendMessage = (sender: string, recipient: string) =>
    resend.emails.send({
      from: sender,
      to: recipient,
      replyTo: parsed.email,
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
      html: `
        <div style="font-family:Arial,sans-serif;line-height:1.6;color:#111827">
          <h2>Portfolio contact form</h2>
          <p><strong>Name:</strong> ${escapeHtml(parsed.name)}</p>
          <p><strong>Email:</strong> ${escapeHtml(parsed.email)}</p>
          <p><strong>Subject:</strong> ${escapeHtml(parsed.subject)}</p>
          <p><strong>Timestamp:</strong> ${timestamp}</p>
          <p><strong>Source:</strong> portfolio contact form</p>
          <hr style="border:none;border-top:1px solid #e5e7eb;margin:20px 0" />
          <p>${escapeHtml(parsed.message).replace(/\n/g, "<br />")}</p>
        </div>
      `,
    });

  try {
    let deliveredTo = to;
    let { data, error } = await sendMessage(from, deliveredTo);

    if (error && from !== fallbackFrom && isSenderDomainError(error)) {
      ({ data, error } = await sendMessage(fallbackFrom, deliveredTo));
    }

    const fallbackRecipient = error
      ? sandboxTo || getSandboxRecipient(error)
      : null;
    if (error && fallbackRecipient && fallbackRecipient !== deliveredTo) {
      deliveredTo = fallbackRecipient;
      ({ data, error } = await sendMessage(fallbackFrom, deliveredTo));
    }

    if (error) {
      req.log.error(
        { statusCode: error.statusCode, name: error.name },
        "Resend contact request failed",
      );
      return void res.status(502).json({
        error:
          "Email delivery is temporarily unavailable. Please email Anupam directly.",
      });
    }

    res.json({ ok: true, id: data?.id });
  } catch (error) {
    req.log.error({ error }, "Contact email request failed");
    res.status(502).json({
      error: "Contact email could not be sent. Please email Anupam directly.",
    });
  }
});

export default router;
