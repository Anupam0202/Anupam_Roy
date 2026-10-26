import { Router, type IRouter } from "express";
import {
  ABSTAIN_MESSAGE,
  RESPONSE_SCHEMA,
  SYSTEM_INSTRUCTION,
  buildCorpus,
  buildUserPrompt,
  corpusVersion,
  normalizeQuestion,
  retrieveEvidence,
  validateAssistantOutput,
  type CorpusEntry,
} from "@workspace/proof-atlas-core/ai/atlas";
import type { Deps } from "../lib/deps";
import { clientKey, requireJson, tooMany } from "../lib/http";
import { logger } from "../lib/logger";
import { ProviderUnavailable, aiConfigured, type ProviderClient } from "../lib/providers";
import { createRateLimiter } from "../lib/rate-limit";

/**
 * Default model when GEMINI_MODEL is unset or invalid. Google's Gemini API
 * changelog (2026-09-18) recommends Gemini 3.8 Flash for new projects and
 * serves the 2.5 models only to earlier users.
 */
export const DEFAULT_MODEL = "gemini-3.8-flash";
const MODEL_ID = /^[a-z0-9.-]{3,60}$/;

/** The model this server will call: GEMINI_MODEL when it is a valid id, otherwise the default. */
export function resolveGeminiModel(env: Deps["env"]): string {
  const configured = env.GEMINI_MODEL?.trim() ?? "";
  return MODEL_ID.test(configured) ? configured : DEFAULT_MODEL;
}

/**
 * The model in use on this server instance. Starts as resolveGeminiModel(env);
 * if Google reports that model as not found (for example after it was retired),
 * the instance switches to DEFAULT_MODEL and /api/status says so.
 */
export interface GeminiModelChoice {
  current(): string;
  /** The configured model this instance stopped using, if any. */
  fallbackFrom(): string | undefined;
  markUnavailable(model: string): void;
}

export function createGeminiModelChoice(env: Deps["env"]): GeminiModelChoice {
  let unavailable: string | undefined;
  const configured = resolveGeminiModel(env);
  return {
    current: () => (unavailable === configured ? DEFAULT_MODEL : configured),
    fallbackFrom: () => unavailable,
    markUnavailable(model) {
      if (model !== DEFAULT_MODEL) unavailable = model;
    },
  };
}

/** Google's answer when a model id does not exist or cannot generate content. */
export const isModelUnavailable = (status: number, body: string) =>
  status === 404 || (status === 400 && /\bmodels?\b/i.test(body) && /\bnot (found|supported)\b/i.test(body));

/**
 * Thinking settings by model family, as Google documents them. 2.5 Flash
 * models accept a zero thinking budget; Gemini 3 models take a thinking level
 * instead (LOW is the lowest every 3.x model accepts). Others get nothing.
 * A request never carries both.
 */
export function thinkingConfigFor(model: string): Record<string, unknown> | undefined {
  if (/^gemini-2\.5-flash/.test(model)) return { thinkingBudget: 0 };
  if (/^gemini-[3-9](\.\d+)?-/.test(model)) return { thinkingLevel: "low" };
  return undefined;
}

export function generationConfigFor(model: string): Record<string, unknown> {
  const config: Record<string, unknown> = {
    maxOutputTokens: 2_048,
    responseMimeType: "application/json",
    responseSchema: RESPONSE_SCHEMA,
  };
  // Gemini 3 models deprecate temperature in favour of thinking levels.
  if (!/^gemini-[3-9]/.test(model)) config.temperature = 0.1;
  const thinking = thinkingConfigFor(model);
  if (thinking) config.thinkingConfig = thinking;
  return config;
}

const BLOCKING_FINISH = new Set(["SAFETY", "RECITATION", "BLOCKLIST", "PROHIBITED_CONTENT", "SPII", "IMAGE_SAFETY"]);

interface GeminiResponse {
  promptFeedback?: { blockReason?: string };
  candidates?: Array<{ finishReason?: string; content?: { parts?: Array<{ text?: unknown; thought?: boolean }> } }>;
  usageMetadata?: { promptTokenCount?: number; candidatesTokenCount?: number; thoughtsTokenCount?: number; totalTokenCount?: number };
}

const refs = (entries: readonly CorpusEntry[]) => entries.map(({ id, claimId, title, provenance }) => ({ id, claimId, title, provenance }));

export function createAiRouter(deps: Deps, providers: ProviderClient, models: GeminiModelChoice = createGeminiModelChoice(deps.env)): IRouter {
  const router = Router();
  const limited = createRateLimiter({ limit: 8, windowMs: 60_000 });
  // Built once; retrieval reuses its BM25 index for every question.
  const corpus = buildCorpus();
  const version = corpusVersion(corpus);
  const configured = deps.env.GEMINI_MODEL?.trim();
  if (configured && !MODEL_ID.test(configured)) logger.warn({ default: DEFAULT_MODEL }, "GEMINI_MODEL is not a valid model id; using the default");

  router.post("/ai/ask", async (req, res) => {
    res.setHeader("Cache-Control", "no-store");
    if (!requireJson(req, res)) return;
    const question = normalizeQuestion((req.body as Record<string, unknown> | undefined)?.question);
    if (!question) return void res.status(400).json({ error: "Ask a question of at least three characters." });
    if (limited(clientKey(req))) return tooMany(res, 60, "Too many questions. Please wait a minute.");

    const evidence = retrieveEvidence(question, corpus);
    const fallback = (reason: string) => res.json({ mode: "deterministic", reason, corpusVersion: version, evidence: refs(evidence.slice(0, 4)) });
    if (!aiConfigured(deps.env)) return void fallback("disabled");
    // Nothing relevant was retrieved, so there is nothing the model may cite; no model call is made.
    if (!evidence.length)
      return void res.json({
        mode: "deterministic",
        reason: "no-evidence",
        corpusVersion: version,
        result: { answer: ABSTAIN_MESSAGE, citationIds: [], state: "abstained" },
        evidence: [],
      });

    let model = models.current();
    const generate = (id: string) =>
      providers.request(
        "gemini",
        `https://generativelanguage.googleapis.com/v1beta/models/${id}:generateContent`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json", "x-goog-api-key": deps.env.GEMINI_API_KEY!.trim() },
          body: JSON.stringify({
            systemInstruction: { parts: [{ text: SYSTEM_INSTRUCTION }] },
            contents: [{ role: "user", parts: [{ text: buildUserPrompt(question, evidence) }] }],
            generationConfig: generationConfigFor(id),
          }),
        },
        { tier: "optional" },
      );
    try {
      let response = await generate(model);
      // A configured model Google no longer serves: retry once with the default and keep using it.
      if (model !== DEFAULT_MODEL && isModelUnavailable(response.status, response.text)) {
        req.log.warn({ provider: "gemini", model, status: response.status, fallback: DEFAULT_MODEL }, "GEMINI_MODEL is not available; switching to the default model");
        models.markUnavailable(model);
        model = DEFAULT_MODEL;
        response = await generate(model);
      }
      if (response.status !== 200) {
        req.log.warn({ provider: "gemini", model, status: response.status }, "Assistant provider returned an error");
        return void fallback(response.status === 429 ? "busy" : "provider-error");
      }
      const json = JSON.parse(response.text) as GeminiResponse;
      const candidate = json.candidates?.[0];
      const usage = json.usageMetadata ?? {};
      req.log.info(
        {
          provider: "gemini",
          model,
          finishReason: candidate?.finishReason,
          blockReason: json.promptFeedback?.blockReason,
          tokens: { prompt: usage.promptTokenCount, output: usage.candidatesTokenCount, thoughts: usage.thoughtsTokenCount, total: usage.totalTokenCount },
        },
        "Assistant answered",
      );
      if (json.promptFeedback?.blockReason || BLOCKING_FINISH.has(candidate?.finishReason ?? "")) return void fallback("blocked");
      if (!candidate || (candidate.finishReason && candidate.finishReason !== "STOP")) return void fallback("incomplete");
      const text = (candidate.content?.parts ?? [])
        .filter((p) => p.thought !== true)
        .map((p) => (typeof p.text === "string" ? p.text : ""))
        .join("");
      const result = validateAssistantOutput(text, evidence);
      res.json({ mode: "ai", result, corpusVersion: version, evidence: refs(evidence) });
    } catch (error) {
      if (error instanceof ProviderUnavailable)
        return void fallback(error.reason === "budget" ? "budget" : error.reason === "cooldown" ? "busy" : "provider-error");
      req.log.warn({ provider: "gemini", model, errorName: (error as Error).name }, "Assistant request failed");
      fallback("provider-error");
    }
  });

  return router;
}
