import { Router, type IRouter } from "express";
import { releaseSha } from "@workspace/proof-atlas-core/site/release";
import type { Deps } from "../lib/deps";
import { aiConfigured, contactConfigured, type ProviderClient } from "../lib/providers";
import { createGeminiModelChoice, type GeminiModelChoice } from "./ai";

export function createHealthRouter(deps: Deps, providers: ProviderClient, models: GeminiModelChoice = createGeminiModelChoice(deps.env)): IRouter {
  const router = Router();

  router.get("/healthz", (_req, res) => {
    res.setHeader("Cache-Control", "no-store");
    res.json({ status: "ok" });
  });

  /**
   * Public, secret-free view of what this server instance can do right now.
   * Budgets, cooldowns and rate limits are kept in memory per instance.
   */
  router.get("/status", (_req, res) => {
    res.setHeader("Cache-Control", "no-store");
    const { providers: list, policyIssues, disabledByConfig, budgets, cooldowns } = providers.status();
    const enabled = (id: string) => list.some((p) => p.id === id && p.enabled);
    res.json({
      status: "ok",
      release: releaseSha(deps.env),
      checkedAt: new Date(deps.now()).toISOString(),
      assistant: { enabled: aiConfigured(deps.env) && enabled("gemini"), model: models.current(), fallbackFrom: models.fallbackFrom() },
      contact: { configured: contactConfigured(deps.env) && enabled("resend") },
      providers: list,
      policyIssues,
      disabledByConfig,
      budgets,
      cooldowns,
      limitsScope: "per-instance",
    });
  });

  return router;
}
