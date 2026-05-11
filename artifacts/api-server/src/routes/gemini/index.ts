import { GoogleGenAI, Modality } from "@google/genai";
import { Router, type IRouter, type Request, type Response } from "express";
import type { Conversation as DbConversationRow, Message as DbMessageRow } from "@workspace/db";

const router: IRouter = Router();

type DbPackage = typeof import("@workspace/db");
type DrizzlePackage = typeof import("drizzle-orm");

interface DbAccess {
  db: DbPackage["db"];
  conversationsTable: DbPackage["conversations"];
  messagesTable: DbPackage["messages"];
  eq: DrizzlePackage["eq"];
  asc: DrizzlePackage["asc"];
}

interface MemoryMessage {
  id: number;
  conversationId: number;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
}

interface MemoryConversation {
  id: number;
  title: string;
  createdAt: string;
  messages: MemoryMessage[];
}

const memoryConversations = new Map<number, MemoryConversation>();
let nextConversationId = 1;
let nextMessageId = 1;
const rateLimits = new Map<string, number[]>();
let dbAccessPromise: Promise<DbAccess | null> | null = null;

const SYSTEM_PROMPT = `You are the portfolio concierge for Anupam Roy.

Use only the supplied portfolio facts. Do not invent employers, degrees, projects, metrics, or certifications.

Positioning:
- Name: Anupam Roy
- Current role: AI/ML Analyst at Accenture
- Focus: production GenAI, RAG pipelines, multi-agent systems, cloud AI, and backend engineering
- Primary narrative: builds real enterprise AI systems, not toy demos

Enterprise experience:
- Accenture AI/ML Analyst, Dec 2023 to Present
- Built a production enterprise operational AI platform for support, incident, release, testing, and compliance workflows
- Client and internal system names must remain private; use only generic enterprise workflow language
- Production-grade multi-agent GenAI platform using LangGraph
- Agents: incident, problem, release, and service-request workflows
- RAG over enterprise ticketing, documentation, source-control, observability logs, databases, structured data, and unstructured docs
- Root cause analysis correlating logs and historical incidents
- Test generation for functional tests, Selenium, UFT, Karate
- Release intelligence for notes, deployment plans, rollback strategies
- ITSM ticket creation from chat
- SQL/system analysis from functional docs
- Anomaly detection and SOX compliance reporting
- Chat UI with MongoDB-backed context-aware conversations
- Impact: about 20% turnaround-time reduction and about 50% SME-dependency reduction

Earlier experience:
- Accenture Associate Software Engineer, Aug 2022 to Nov 2023
- Spring Boot, Core Java, AWS Lambda, CI/CD, JUnit, SonarQube, SourceClear, Agile/DevOps

Projects:
- NexusRAG: flagship RAG system with FastAPI, Next.js, Gemini, OCR, BM25 + FAISS + RRF, reranking, semantic cache, multi-query expansion, WebSocket streaming, citations, runtime API keys, security controls
- PlantPal: green urban planning assistant with weather, air, soil, biodiversity, Gemini planner, plant doctor, carbon dashboard, pollinator pathway
- RAG, Contextual-RAG-Chatbot, Handwritten-Chemical_Compound-Detection, and frontend experiments

Certifications:
- 74 verified certifications with PDFs and issuer links
- 180+ Credly badges
- AWS, Google Cloud, Microsoft, Snowflake, Databricks, Anthropic, MongoDB

Contact:
- Email: anupam020202@gmail.com
- GitHub: https://github.com/Anupam0202/
- LinkedIn: https://www.linkedin.com/in/anupam--roy/

Answer as a concise recruiter-facing portfolio concierge. If asked for a section, mention the relevant portfolio section name.`;

function getGeminiClient() {
  const apiKey = process.env.GEMINI_API_KEY ?? process.env.AI_INTEGRATIONS_GEMINI_API_KEY;
  if (!apiKey) return null;

  return new GoogleGenAI({
    apiKey,
    httpOptions: process.env.AI_INTEGRATIONS_GEMINI_BASE_URL
      ? { baseUrl: process.env.AI_INTEGRATIONS_GEMINI_BASE_URL }
      : undefined,
  });
}

function isRateLimited(ip: string) {
  const now = Date.now();
  const windowMs = 60_000;
  const limit = 12;
  const current = (rateLimits.get(ip) ?? []).filter((time) => now - time < windowMs);
  if (current.length >= limit) {
    rateLimits.set(ip, current);
    return true;
  }
  current.push(now);
  rateLimits.set(ip, current);
  return false;
}

function createMemoryMessage(conversationId: number, role: MemoryMessage["role"], content: string): MemoryMessage {
  return {
    id: nextMessageId++,
    conversationId,
    role,
    content,
    createdAt: new Date().toISOString(),
  };
}

async function getDbAccess(req?: Request) {
  if (!process.env.DATABASE_URL) return null;
  if (!dbAccessPromise) {
    dbAccessPromise = Promise.all([import("@workspace/db"), import("drizzle-orm")])
      .then(([dbModule, drizzle]) => ({
        db: dbModule.db,
        conversationsTable: dbModule.conversations,
        messagesTable: dbModule.messages,
        eq: drizzle.eq,
        asc: drizzle.asc,
      }))
      .catch((error: unknown) => {
        req?.log.warn({ error }, "Database storage unavailable; falling back to memory");
        return null;
      });
  }
  return dbAccessPromise;
}

function serializeConversation(row: DbConversationRow) {
  return {
    id: row.id,
    title: row.title,
    createdAt: row.createdAt instanceof Date ? row.createdAt.toISOString() : String(row.createdAt),
  };
}

function serializeMessage(row: DbMessageRow): MemoryMessage {
  return {
    id: row.id,
    conversationId: row.conversationId,
    role: row.role === "assistant" ? "assistant" : "user",
    content: row.content,
    createdAt: row.createdAt instanceof Date ? row.createdAt.toISOString() : String(row.createdAt),
  };
}

async function listDbConversations(req: Request) {
  const access = await getDbAccess(req);
  if (!access) return null;
  try {
    const rows = await access.db
      .select()
      .from(access.conversationsTable)
      .orderBy(access.asc(access.conversationsTable.createdAt));
    return rows.map(serializeConversation);
  } catch (error) {
    req.log.warn({ error }, "Failed to list database conversations; falling back to memory");
    return null;
  }
}

async function createDbConversation(req: Request, title: string) {
  const access = await getDbAccess(req);
  if (!access) return null;
  try {
    const [conversation] = await access.db.insert(access.conversationsTable).values({ title }).returning();
    return conversation ? serializeConversation(conversation) : null;
  } catch (error) {
    req.log.warn({ error }, "Failed to create database conversation; falling back to memory");
    return null;
  }
}

async function getDbConversation(req: Request, id: number) {
  const access = await getDbAccess(req);
  if (!access) return null;
  try {
    const [conversation] = await access.db
      .select()
      .from(access.conversationsTable)
      .where(access.eq(access.conversationsTable.id, id))
      .limit(1);
    if (!conversation) return null;
    const messages = await listDbMessages(req, id);
    return { ...serializeConversation(conversation), messages: messages ?? [] };
  } catch (error) {
    req.log.warn({ error }, "Failed to read database conversation; falling back to memory");
    return null;
  }
}

async function deleteDbConversation(req: Request, id: number) {
  const access = await getDbAccess(req);
  if (!access) return false;
  try {
    await access.db.delete(access.conversationsTable).where(access.eq(access.conversationsTable.id, id));
    return true;
  } catch (error) {
    req.log.warn({ error }, "Failed to delete database conversation; falling back to memory");
    return false;
  }
}

async function listDbMessages(req: Request, conversationId: number) {
  const access = await getDbAccess(req);
  if (!access) return null;
  try {
    const rows = await access.db
      .select()
      .from(access.messagesTable)
      .where(access.eq(access.messagesTable.conversationId, conversationId))
      .orderBy(access.asc(access.messagesTable.createdAt));
    return rows.map(serializeMessage);
  } catch (error) {
    req.log.warn({ error }, "Failed to list database messages; falling back to memory");
    return null;
  }
}

async function insertDbMessage(req: Request, conversationId: number, role: MemoryMessage["role"], content: string) {
  const access = await getDbAccess(req);
  if (!access) return null;
  try {
    const [message] = await access.db
      .insert(access.messagesTable)
      .values({ conversationId, role, content })
      .returning();
    return message ? serializeMessage(message) : null;
  } catch (error) {
    req.log.warn({ error }, "Failed to insert database message; falling back to memory");
    return null;
  }
}

router.get("/gemini/status", (_req: Request, res: Response) => {
  res.json({ mode: getGeminiClient() ? "gemini" : "offline" });
});

router.get("/gemini/conversations", async (req: Request, res: Response) => {
  const dbConversations = await listDbConversations(req);
  if (dbConversations) return void res.json(dbConversations);
  res.json([...memoryConversations.values()].map(({ messages: _messages, ...conversation }) => conversation));
});

router.post("/gemini/conversations", async (req: Request, res: Response) => {
  const title = typeof req.body?.title === "string" && req.body.title.trim() ? req.body.title.trim() : "Portfolio Consultation";
  const dbConversation = await createDbConversation(req, title);
  if (dbConversation) return void res.status(201).json(dbConversation);

  const conversation: MemoryConversation = {
    id: nextConversationId++,
    title,
    createdAt: new Date().toISOString(),
    messages: [],
  };
  memoryConversations.set(conversation.id, conversation);
  res.status(201).json(conversation);
});

router.get("/gemini/conversations/:id", async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const dbConversation = await getDbConversation(req, id);
  if (dbConversation) return void res.json(dbConversation);

  const conversation = memoryConversations.get(id);
  if (!conversation) return void res.status(404).json({ error: "Conversation not found" });
  res.json(conversation);
});

router.delete("/gemini/conversations/:id", async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  await deleteDbConversation(req, id);
  memoryConversations.delete(id);
  res.status(204).send();
});

router.get("/gemini/conversations/:id/messages", async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const dbMessages = await listDbMessages(req, id);
  if (dbMessages) return void res.json(dbMessages);

  const conversation = memoryConversations.get(id);
  if (!conversation) return void res.status(404).json({ error: "Conversation not found" });
  res.json(conversation.messages);
});

router.post("/gemini/conversations/:id/messages", async (req: Request, res: Response) => {
  const ip = req.ip ?? req.socket.remoteAddress ?? "unknown";
  if (isRateLimited(ip)) {
    return void res.status(429).json({ error: "Assistant rate limit reached. Offline mode can continue in the browser." });
  }

  const conversationId = Number(req.params.id);
  const dbConversation = await getDbConversation(req, conversationId);
  const conversation = dbConversation ?? memoryConversations.get(conversationId);
  if (!conversation) return void res.status(404).json({ error: "Conversation not found" });

  const content = typeof req.body?.content === "string" ? req.body.content.trim() : "";
  if (!content) return void res.status(400).json({ error: "Message content is required." });

  const client = getGeminiClient();
  if (!client) return void res.status(503).json({ error: "Gemini API key is not configured. Use offline portfolio mode." });

  const dbUserMessage = dbConversation ? await insertDbMessage(req, conversation.id, "user", content) : null;
  const userMessage = dbUserMessage ?? createMemoryMessage(conversation.id, "user", content);
  if (!dbConversation) conversation.messages.push(userMessage);
  const contextMessages = dbConversation ? [...conversation.messages, userMessage] : conversation.messages;

  const contents = [
    { role: "user" as const, parts: [{ text: SYSTEM_PROMPT }] },
    {
      role: "model" as const,
      parts: [{ text: "Understood. I will answer only from Anupam Roy's portfolio facts." }],
    },
    ...contextMessages.slice(-12).map((message) => ({
      role: message.role === "assistant" ? ("model" as const) : ("user" as const),
      parts: [{ text: message.content }],
    })),
  ];

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  try {
    let fullResponse = "";
    const stream = await client.models.generateContentStream({
      model: process.env.GEMINI_MODEL ?? "gemini-2.5-flash",
      contents,
      config: { maxOutputTokens: 2048, temperature: 0.25 },
    });

    for await (const chunk of stream) {
      const text = chunk.text;
      if (!text) continue;
      fullResponse += text;
      res.write(`data: ${JSON.stringify({ content: text, mode: "gemini" })}\n\n`);
    }

    if (dbConversation) {
      await insertDbMessage(req, conversation.id, "assistant", fullResponse);
    } else {
      conversation.messages.push(createMemoryMessage(conversation.id, "assistant", fullResponse));
    }
    res.write(`data: ${JSON.stringify({ done: true, mode: "gemini" })}\n\n`);
    res.end();
  } catch (error) {
    req.log.error({ error }, "Gemini generation failed");
    if (!res.headersSent) {
      res.status(502).json({ error: "Gemini generation failed. Use offline portfolio mode." });
    } else {
      res.write(`data: ${JSON.stringify({ error: "Gemini generation failed. Using offline portfolio mode is recommended." })}\n\n`);
      res.end();
    }
  }
});

router.post("/gemini/generate-image", async (req: Request, res: Response) => {
  const ip = req.ip ?? req.socket.remoteAddress ?? "unknown";
  if (isRateLimited(ip)) {
    return void res.status(429).json({ error: "Image generation rate limit reached. Please wait a minute and try again." });
  }

  const prompt = typeof req.body?.prompt === "string" ? req.body.prompt.trim() : "";
  if (!prompt) return void res.status(400).json({ error: "Prompt is required." });

  const client = getGeminiClient();
  if (!client) {
    return void res.status(503).json({ error: "Gemini API key is not configured. Image generation is disabled." });
  }

  try {
    const response = await client.models.generateContent({
      model: process.env.GEMINI_IMAGE_MODEL ?? "gemini-2.5-flash-image",
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      config: {
        responseModalities: [Modality.TEXT, Modality.IMAGE],
      },
    });

    const imagePart = response.candidates?.[0]?.content?.parts?.find(
      (part: { inlineData?: { data?: string; mimeType?: string } }) => part.inlineData?.data,
    );

    if (!imagePart?.inlineData?.data) {
      return void res.status(502).json({ error: "Gemini did not return image data." });
    }

    res.json({
      b64_json: imagePart.inlineData.data,
      mimeType: imagePart.inlineData.mimeType || "image/png",
    });
  } catch (error) {
    req.log.error({ error }, "Gemini image generation failed");
    res.status(502).json({ error: "Gemini image generation failed. Check API key, quota, and model availability." });
  }
});

export default router;
