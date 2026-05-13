import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Bot, Send, X } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { answerFromPortfolio, suggestedPrompts } from "@/data/assistant";

interface Message {
  role: "user" | "assistant";
  content: string;
  streaming?: boolean;
  mode?: "gemini" | "offline";
}

async function streamOffline(text: string, onChunk: (value: string) => void) {
  const tokens = text.split(" ");
  for (let i = 0; i < tokens.length; i++) {
    onChunk(`${i === 0 ? "" : " "}${tokens[i]}`);
    await new Promise((resolve) => setTimeout(resolve, 8));
  }
}

export default function ConsultSystem() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<"checking" | "gemini" | "offline">("checking");
  const [conversationId, setConversationId] = useState<number | null>(null);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      mode: "offline",
      content:
        "Portfolio concierge ready. I can summarize Anupam's enterprise GenAI work, NexusRAG architecture, certifications, projects, achievements, skills, and hiring fit. If Gemini is configured, I will use it; otherwise I answer from structured offline portfolio data.",
    },
  ]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = "hidden";
    inputRef.current?.focus();

    fetch("/api/gemini/status")
      .then((response) => response.json())
      .then((payload) => setMode(payload.mode === "gemini" ? "gemini" : "offline"))
      .catch(() => setMode("offline"));

    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  async function ensureConversation() {
    if (conversationId) return conversationId;
    try {
      const response = await fetch("/api/gemini/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: "Portfolio Consultation" }),
      });
      if (!response.ok) return null;
      const payload = await response.json();
      setConversationId(payload.id);
      return payload.id as number;
    } catch {
      return null;
    }
  }

  async function tryGemini(text: string) {
    const id = await ensureConversation();
    if (!id) return false;

    const response = await fetch(`/api/gemini/conversations/${id}/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: text }),
    });
    if (!response.ok || !response.body) return false;

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let full = "";
    let buffer = "";
    let streamError = false;

    const consumeEvent = (event: string) => {
      const lines = event.split("\n");
      for (const line of lines) {
        if (!line.startsWith("data: ")) continue;
        try {
          const payload = JSON.parse(line.slice(6));
          if (payload.error) {
            streamError = true;
            continue;
          }
          if (payload.done) continue;
          if (payload.content) {
            full += payload.content;
            setMessages((prev) => {
              const next = [...prev];
              const last = next[next.length - 1];
              if (last?.streaming) next[next.length - 1] = { ...last, content: full, mode: "gemini" };
              return next;
            });
          }
        } catch {
          streamError = true;
        }
      }
    };

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const events = buffer.split("\n\n");
      buffer = events.pop() ?? "";
      events.filter(Boolean).forEach(consumeEvent);
    }

    buffer += decoder.decode();
    if (buffer.trim()) consumeEvent(buffer);

    return !streamError && full.trim().length > 0;
  }

  async function respondOffline(text: string, prependNotice = false) {
    const answer = `${prependNotice ? "_Using offline portfolio mode._\n\n" : ""}${answerFromPortfolio(text)}`;
    let full = "";
    await streamOffline(answer, (chunk) => {
      full += chunk;
      setMessages((prev) => {
        const next = [...prev];
        const last = next[next.length - 1];
        if (last?.streaming) next[next.length - 1] = { ...last, content: full, mode: "offline" };
        return next;
      });
    });
  }

  async function send(text = input) {
    const content = text.trim();
    if (!content || loading) return;

    setInput("");
    setLoading(true);
    setMessages((prev) => [
      ...prev,
      { role: "user", content },
      { role: "assistant", content: "", streaming: true, mode: mode === "gemini" ? "gemini" : "offline" },
    ]);

    let usedGemini = false;
    if (mode === "gemini") {
      try {
        usedGemini = await tryGemini(content);
      } catch {
        usedGemini = false;
      }
    }

    if (!usedGemini) {
      setMode("offline");
      await respondOffline(content, true);
    }

    setMessages((prev) => {
      const next = [...prev];
      const last = next[next.length - 1];
      if (last?.streaming) next[next.length - 1] = { ...last, streaming: false };
      return next;
    });
    setLoading(false);
  }

  const modal = (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setOpen(false)}
            className="fixed inset-0 z-[150] bg-black/55 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            className="fixed inset-x-3 bottom-3 z-[200] flex h-[min(88dvh,720px)] max-h-[calc(100dvh-1.5rem)] flex-col overflow-hidden rounded-3xl border border-white/10 bg-[#07110f]/98 shadow-[0_0_80px_rgba(0,0,0,0.85)] backdrop-blur-2xl sm:bottom-8 sm:left-auto sm:right-8 sm:h-[720px] sm:max-h-[calc(100dvh-4rem)] sm:w-[470px]"
            role="dialog"
            aria-modal="true"
            aria-label="AI portfolio consultant"
          >
            <div className="flex shrink-0 items-start justify-between border-b border-white/10 p-5 [@media(max-height:520px)]:p-3">
              <div>
                <p className="text-xs font-bold uppercase text-primary">Portfolio Concierge</p>
                <h2 className="mt-1 font-display text-lg font-bold text-white">Ask about Anupam's fit</h2>
                <p className="mt-2 text-xs text-muted-foreground">
                  Mode: {mode === "checking" ? "checking..." : mode === "gemini" ? "Gemini + offline fallback" : "offline portfolio data"}
                </p>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="rounded-full p-2 text-white/55 hover:bg-white/10 hover:text-white"
                aria-label="Close consultant"
                type="button"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-4 [@media(max-height:520px)]:p-3">
              {messages.map((message, index) => (
                <div key={index} className={`max-w-[92%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${message.role === "user" ? "ml-auto bg-primary text-black" : "bg-white/[0.05] text-muted-foreground"}`}>
                  {message.role === "assistant" ? (
                    <div className="prose prose-sm prose-invert max-w-none">
                      <ReactMarkdown>{message.content}</ReactMarkdown>
                      {message.streaming && <span className="ml-1 inline-block h-3 w-0.5 animate-pulse bg-primary" />}
                    </div>
                  ) : (
                    message.content
                  )}
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            <div className="shrink-0 border-t border-white/8 p-4 [@media(max-height:520px)]:p-3">
              <div className="[@media(max-height:520px)]:hidden">
                <p className="mb-2 text-xs font-semibold uppercase text-white/35">Suggested prompts</p>
                <div className="mb-3 flex flex-wrap gap-1.5">
                  {suggestedPrompts.map((prompt) => (
                    <button
                      key={prompt}
                      onClick={() => send(prompt)}
                      disabled={loading}
                      className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5 text-[11px] text-white/60 hover:border-primary/30 hover:text-white disabled:opacity-40"
                      type="button"
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex gap-2">
                <input
                  ref={inputRef}
                  value={input}
                  onChange={(event) => setInput(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" && !event.shiftKey) {
                      event.preventDefault();
                      send();
                    }
                  }}
                  placeholder="Ask about experience, systems, projects, certifications..."
                  className="min-w-0 flex-1 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none placeholder:text-white/30 focus:border-primary/45"
                  disabled={loading}
                />
                <button
                  onClick={() => send()}
                  disabled={loading || !input.trim()}
                  className="rounded-xl bg-primary px-4 py-3 text-black disabled:opacity-40"
                  aria-label="Send message"
                  type="button"
                >
                  <Send className="h-4 w-4" />
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );

  return (
    <>
      <motion.button
        onClick={() => setOpen(true)}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
        className="fixed bottom-4 right-4 z-[100] inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary px-4 py-3 text-sm font-bold text-black shadow-[0_0_40px_rgba(45,212,191,0.3)] sm:bottom-8 sm:right-8 sm:px-5"
        aria-label="Open AI portfolio consultant"
      >
        <Bot className="h-4 w-4" />
        <span className="hidden sm:inline">AI Consultant</span>
        <span className="sm:hidden">Consult</span>
      </motion.button>

      {createPortal(modal, document.body)}
    </>
  );
}
