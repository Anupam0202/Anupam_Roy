import fs from "node:fs";
import path from "node:path";
import { Router, type IRouter } from "express";

const router: IRouter = Router();

function firstExistingPath(candidates: string[]) {
  return candidates.find((candidate) => fs.existsSync(candidate));
}

function countFiles(directory: string | undefined, extension: string) {
  if (!directory) return 0;
  return fs.readdirSync(directory).filter((file) => file.toLowerCase().endsWith(extension)).length;
}

router.get("/portfolio/status", (_req, res) => {
  const publicRoot = firstExistingPath([
    path.resolve(process.cwd(), "../anupam-intelligence-systems/public"),
    path.resolve(process.cwd(), "artifacts/anupam-intelligence-systems/public"),
  ]);
  const certsDir = publicRoot ? path.join(publicRoot, "certs") : undefined;
  const thumbsDir = publicRoot ? path.join(publicRoot, "cert-thumbs") : undefined;
  const certPdfCount = countFiles(certsDir, ".pdf");
  const thumbCount = countFiles(thumbsDir, ".webp");
  const geminiConfigured = Boolean(process.env.GEMINI_API_KEY ?? process.env.AI_INTEGRATIONS_GEMINI_API_KEY);
  const resendConfigured = Boolean(process.env.RESEND_API_KEY);
  const databaseConfigured = Boolean(process.env.DATABASE_URL);

  res.json({
    status: "operational",
    timestamp: new Date().toISOString(),
    services: [
      {
        id: "api",
        label: "Runtime Gateway",
        status: "online",
        detail: "Express API is serving health, contact, portfolio telemetry, and AI consultant routes.",
      },
      {
        id: "gemini",
        label: "AI Assistant Mode",
        status: geminiConfigured ? "online" : "not_configured",
        detail: geminiConfigured
          ? "Server-side Gemini key detected. The consultant can stream model responses with offline fallback."
          : "No Gemini key detected. The consultant is intentionally using no-key offline portfolio intelligence.",
      },
      {
        id: "contact",
        label: "Message Delivery",
        status: resendConfigured ? "online" : "not_configured",
        detail: resendConfigured
          ? "Resend is configured for contact-form delivery."
          : "RESEND_API_KEY is missing. Validation still works, but delivery is disabled until configured.",
      },
      {
        id: "assets",
        label: "Mastery Assets",
        status: certPdfCount >= 74 ? "online" : "degraded",
        detail: `${certPdfCount} certificate PDFs and ${thumbCount} preview thumbnails are available in the public asset vault.`,
      },
      {
        id: "database",
        label: "Conversation Store",
        status: databaseConfigured ? "online" : "not_configured",
        detail: databaseConfigured
          ? "DATABASE_URL detected for persistent conversation storage."
          : "No database URL detected. AI conversations use the in-memory runtime store locally.",
      },
    ],
    metrics: [
      { label: "Verified PDFs", value: String(certPdfCount) },
      { label: "Preview thumbs", value: String(thumbCount) },
      { label: "Assistant mode", value: geminiConfigured ? "Gemini hybrid" : "Offline intelligence" },
      { label: "Email route", value: resendConfigured ? "Ready" : "Needs key" },
      { label: "Storage", value: databaseConfigured ? "Database-ready" : "Memory runtime" },
    ],
  });
});

export default router;
