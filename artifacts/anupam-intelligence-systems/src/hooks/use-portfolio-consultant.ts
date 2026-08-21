import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type Dispatch,
  type SetStateAction,
} from "react";
import { answerFromPortfolio } from "@/data/assistant";
import {
  createConsultantStreamParser,
  type ConsultantStreamMode,
} from "@/lib/consultant-stream";

export type ConsultantStatus =
  | "checking"
  | "ready-gemini"
  | "ready-offline"
  | "streaming"
  | "offline-fallback"
  | "error";

export interface ConsultantReference {
  label: string;
  href: string;
}

export interface ConsultantMessage {
  role: "user" | "assistant";
  content: string;
  streaming?: boolean;
  mode?: ConsultantStreamMode;
  references?: ConsultantReference[];
}

const INITIAL_MESSAGE: ConsultantMessage = {
  role: "assistant",
  mode: "offline",
  content:
    "Portfolio concierge ready. Ask about Anupam's hiring fit, enterprise GenAI work, NexusRAG, certifications, projects, skills, achievements, or contact details.",
};

const REQUEST_TIMEOUT_MS = 25_000;

function referencesFor(query: string): ConsultantReference[] {
  const normalized = query.toLowerCase();
  const references: ConsultantReference[] = [];
  const add = (label: string, href: string) => {
    if (!references.some((reference) => reference.href === href))
      references.push({ label, href });
  };

  if (/hire|fit|experience|enterprise|incident|release|test/.test(normalized))
    add("Experience", "#experience");
  if (/system|architecture|agent|retrieval|rag|nexus/.test(normalized))
    add("Systems", "#systems");
  if (/project|nexus|plantpal|rag/.test(normalized))
    add("Projects", "#projects");
  if (/cert|cloud|aws|azure|gcp|google|microsoft|snowflake/.test(normalized))
    add("Mastery", "#certifications");
  if (/achievement|credly|badge/.test(normalized))
    add("Achievements", "#achievements");
  if (/contact|email|reach|hire|fit/.test(normalized))
    add("Contact", "#contact");
  return references.slice(0, 3);
}

function updateStreamingMessage(
  setter: Dispatch<SetStateAction<ConsultantMessage[]>>,
  update: Partial<ConsultantMessage>,
) {
  setter((previous) => {
    const next = [...previous];
    const last = next[next.length - 1];
    if (last?.streaming) next[next.length - 1] = { ...last, ...update };
    return next;
  });
}

async function streamOfflineAnswer(
  text: string,
  signal: AbortSignal,
  onContent: (content: string) => void,
) {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    onContent(text);
    return;
  }

  let full = "";
  for (const token of text.split(" ")) {
    if (signal.aborted)
      throw new DOMException("Response cancelled", "AbortError");
    full += `${full ? " " : ""}${token}`;
    onContent(full);
    await new Promise((resolve) => window.setTimeout(resolve, 8));
  }
}

export function usePortfolioConsultant(open: boolean) {
  const [messages, setMessages] = useState<ConsultantMessage[]>([
    INITIAL_MESSAGE,
  ]);
  const [status, setStatus] = useState<ConsultantStatus>("checking");
  const [responding, setResponding] = useState(false);
  const geminiAvailableRef = useRef(false);
  const controllerRef = useRef<AbortController | null>(null);
  const userCancelledRef = useRef(false);

  useEffect(() => {
    if (!open) return;
    const controller = new AbortController();
    let active = true;
    setStatus("checking");
    const timeout = window.setTimeout(() => {
      controller.abort();
      if (!active) return;
      geminiAvailableRef.current = false;
      setStatus("ready-offline");
    }, 5_000);

    fetch("/api/gemini/status", {
      headers: { Accept: "application/json" },
      signal: controller.signal,
    })
      .then((response) =>
        response.ok
          ? response.json()
          : Promise.reject(new Error("Status unavailable")),
      )
      .then((payload) => {
        if (!active) return;
        window.clearTimeout(timeout);
        geminiAvailableRef.current = payload.mode === "gemini";
        setStatus(payload.mode === "gemini" ? "ready-gemini" : "ready-offline");
      })
      .catch(() => {
        if (!active) return;
        window.clearTimeout(timeout);
        geminiAvailableRef.current = false;
        setStatus("ready-offline");
      });

    return () => {
      active = false;
      window.clearTimeout(timeout);
      controller.abort();
    };
  }, [open]);

  useEffect(
    () => () => {
      controllerRef.current?.abort();
    },
    [],
  );

  const cancelResponse = useCallback(() => {
    if (!controllerRef.current) return;
    userCancelledRef.current = true;
    controllerRef.current.abort();
  }, []);

  const clearConversation = useCallback(() => {
    if (responding) return;
    setMessages([INITIAL_MESSAGE]);
    setStatus(geminiAvailableRef.current ? "ready-gemini" : "ready-offline");
  }, [responding]);

  async function streamGemini(
    text: string,
    history: ConsultantMessage[],
    signal: AbortSignal,
  ) {
    const response = await fetch("/api/gemini/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "text/event-stream",
      },
      body: JSON.stringify({
        content: text,
        history: history
          .filter((message) => !message.streaming)
          .slice(-8)
          .map(({ role, content }) => ({ role, content })),
      }),
      signal,
    });
    if (!response.ok || !response.body) throw new Error("Gemini unavailable");

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    const parser = createConsultantStreamParser();
    let full = "";
    let completed = false;

    const consume = (events: ReturnType<typeof parser.push>) => {
      for (const event of events) {
        if (event.type === "content") {
          full += event.content;
          updateStreamingMessage(setMessages, {
            content: full,
            mode: "gemini",
          });
        } else if (event.type === "error") {
          throw new Error(event.error);
        } else if (event.type === "malformed") {
          throw new Error("Gemini returned a malformed stream");
        } else if (event.type === "done") {
          completed = true;
        }
      }
    };

    try {
      while (true) {
        const result = await reader.read();
        if (result.done) break;
        consume(parser.push(decoder.decode(result.value, { stream: true })));
      }
      consume(parser.push(decoder.decode()));
      consume(parser.finish());
    } finally {
      reader.releaseLock();
    }

    if (!full.trim() || !completed)
      throw new Error("Gemini response was incomplete");
    return full;
  }

  async function send(text: string) {
    const content = text.trim().slice(0, 1_500);
    if (!content || responding) return;

    const history = messages;
    const references = referencesFor(content);
    const controller = new AbortController();
    controllerRef.current = controller;
    userCancelledRef.current = false;
    setResponding(true);
    setStatus("streaming");
    setMessages((previous) => [
      ...previous,
      { role: "user", content },
      {
        role: "assistant",
        content: "",
        streaming: true,
        mode: geminiAvailableRef.current ? "gemini" : "offline",
      },
    ]);

    const timeout = window.setTimeout(
      () => controller.abort("timeout"),
      REQUEST_TIMEOUT_MS,
    );

    try {
      if (geminiAvailableRef.current) {
        const answer = await streamGemini(content, history, controller.signal);
        updateStreamingMessage(setMessages, {
          content: answer,
          streaming: false,
          mode: "gemini",
          references,
        });
        setStatus("ready-gemini");
      } else {
        const answer = answerFromPortfolio(content);
        await streamOfflineAnswer(answer, controller.signal, (value) =>
          updateStreamingMessage(setMessages, {
            content: value,
            mode: "offline",
          }),
        );
        updateStreamingMessage(setMessages, {
          content: answer,
          streaming: false,
          mode: "offline",
          references,
        });
        setStatus("ready-offline");
      }
    } catch (error) {
      if (userCancelledRef.current) {
        updateStreamingMessage(setMessages, {
          content:
            "Response cancelled. The conversation is ready for another question.",
          streaming: false,
          mode: "offline",
        });
        setStatus(
          geminiAvailableRef.current ? "ready-gemini" : "ready-offline",
        );
      } else {
        geminiAvailableRef.current = false;
        setStatus("offline-fallback");
        const answer = `_Using offline portfolio mode._\n\n${answerFromPortfolio(content)}`;
        updateStreamingMessage(setMessages, { content: "", mode: "offline" });
        try {
          const fallbackController = new AbortController();
          controllerRef.current = fallbackController;
          await streamOfflineAnswer(
            answer,
            fallbackController.signal,
            (value) =>
              updateStreamingMessage(setMessages, {
                content: value,
                mode: "offline",
              }),
          );
          updateStreamingMessage(setMessages, {
            content: answer,
            streaming: false,
            mode: "offline",
            references,
          });
        } catch {
          updateStreamingMessage(setMessages, {
            content: "The response was interrupted. Please try again.",
            streaming: false,
            mode: "offline",
          });
          setStatus("error");
        }
      }
    } finally {
      window.clearTimeout(timeout);
      controllerRef.current = null;
      userCancelledRef.current = false;
      setResponding(false);
      updateStreamingMessage(setMessages, { streaming: false });
    }
  }

  return {
    messages,
    status,
    responding,
    hasUserMessage: messages.some((message) => message.role === "user"),
    send,
    cancelResponse,
    clearConversation,
  };
}
