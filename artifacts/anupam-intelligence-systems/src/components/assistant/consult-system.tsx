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
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    onChunk(text);
    return;
  }

  const tokens = text.split(" ");
  for (let index = 0; index < tokens.length; index += 1) {
    onChunk(`${index === 0 ? "" : " "}${tokens[index]}`);
    await new Promise((resolve) => window.setTimeout(resolve, 8));
  }
}

function PromptRail({ loading, onSelect }: { loading: boolean; onSelect: (prompt: string) => void }) {
  return (
    <div className="rounded-2xl border border-white/8 bg-white/[0.025] p-3 [@media(max-height:520px)]:hidden">
      <div className="mb-2 flex items-center justify-between gap-3">
        <p className="text-[10px] font-semibold uppercase text-white/35">Suggested prompts</p>
        <p className="hidden text-[10px] text-white/30 sm:block">Tap one to start</p>
      </div>
      <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {suggestedPrompts.map((prompt) => (
          <button
            key={prompt}
            onClick={() => onSelect(prompt)}
            disabled={loading}
            className="max-w-[72vw] shrink-0 rounded-full border border-white/10 bg-white/[0.035] px-3 py-2 text-left text-[11px] leading-snug text-white/65 transition hover:border-primary/35 hover:text-white disabled:opacity-40 sm:max-w-[260px]"
            type="button"
          >
            {prompt}
          </button>
        ))}
      </div>
    </div>
  );
}

export default function ConsultSystem() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<"checking" | "gemini" | "offline">("checking");
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      mode: "offline",
      content:
        "Portfolio concierge ready. Ask about Anupam's hiring fit, enterprise GenAI work, NexusRAG, certifications, projects, skills, or achievements.",
    },
  ]);
  const dialogRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const hasUserMessage = messages.some((message) => message.role === "user");

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth",
    });
  }, [messages]);

  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    inputRef.current?.focus();

    fetch("/api/gemini/status", { headers: { Accept: "application/json" } })
      .then((response) => response.json())
      .then((payload) => setMode(payload.mode === "gemini" ? "gemini" : "offline"))
      .catch(() => setMode("offline"));

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        return;
      }
      if (event.key !== "Tab" || !dialogRef.current) return;

      const focusable = Array.from(
        dialogRef.current.querySelectorAll<HTMLElement>("button:not([disabled]), input:not([disabled]), a[href]"),
      );
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  async function tryGemini(text: string) {
    const history = messages
      .filter((message) => !message.streaming)
      .slice(-8)
      .map(({ role, content }) => ({ role, content }));

    const response = await fetch("/api/gemini/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "text/event-stream" },
      body: JSON.stringify({ content: text, history }),
    });
    if (!response.ok || !response.body) return false;

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let full = "";
    let buffer = "";
    let streamError = false;

    const consumeEvent = (event: string) => {
      for (const line of event.split("\n")) {
        if (!line.startsWith("data: ")) continue;
        try {
          const payload = JSON.parse(line.slice(6));
          if (payload.error) {
            streamError = true;
            continue;
          }
          if (payload.content) {
            full += payload.content;
            setMessages((previous) => {
              const next = [...previous];
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
      setMessages((previous) => {
        const next = [...previous];
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
    setMessages((previous) => [
      ...previous,
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
      await respondOffline(content, mode === "gemini");
    }

    setMessages((previous) => {
      const next = [...previous];
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
            className="fixed inset-0 z-[150] cursor-default bg-black/55 backdrop-blur-sm"
            aria-hidden="true"
          />
          <motion.div
            ref={dialogRef}
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            className="fixed inset-x-2 bottom-2 top-2 z-[200] flex flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#07110f]/98 shadow-[0_0_80px_rgba(0,0,0,0.85)] backdrop-blur-2xl sm:bottom-8 sm:left-auto sm:right-8 sm:top-auto sm:h-[720px] sm:max-h-[calc(100dvh-4rem)] sm:w-[470px] sm:rounded-3xl"
            role="dialog"
            aria-modal="true"
            aria-labelledby="portfolio-concierge-title"
          >
            <div className="flex shrink-0 items-start justify-between border-b border-white/10 p-4 sm:p-5 [@media(max-height:520px)]:p-3">
              <div>
                <p className="text-xs font-bold uppercase text-primary">Portfolio Concierge</p>
                <h2 id="portfolio-concierge-title" className="mt-1 font-display text-base font-bold text-white sm:text-lg">
                  Ask about Anupam's fit
                </h2>
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

            <div
              className="min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain p-4 [@media(max-height:520px)]:p-3"
              data-consult-messages="true"
              aria-live="polite"
            >
              {messages.map((message, index) => (
                <div
                  key={`${message.role}-${index}`}
                  className={`max-w-[92%] overflow-hidden break-words rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                    message.role === "user" ? "ml-auto bg-primary text-black" : "bg-white/[0.05] text-muted-foreground"
                  }`}
                >
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
              {!hasUserMessage && !loading && <PromptRail loading={loading} onSelect={send} />}
              <div ref={messagesEndRef} />
            </div>

            <div className="shrink-0 border-t border-white/8 bg-[#07110f]/95 p-3 sm:p-4" data-consult-inputbar="true">
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
                  placeholder="Ask about experience, systems, or projects..."
                  className="min-w-0 flex-1 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none placeholder:text-white/30 focus:border-primary/45"
                  disabled={loading}
                  maxLength={1500}
                />
                <button
                  onClick={() => send()}
                  disabled={loading || !input.trim()}
                  className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary text-black disabled:opacity-40"
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
        transition={{ delay: 0.5 }}
        className="fixed bottom-4 right-4 z-[100] inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary px-4 py-3 text-sm font-bold text-black shadow-[0_0_40px_rgba(45,212,191,0.3)] sm:bottom-8 sm:right-8 sm:px-5"
        aria-label="Open AI portfolio consultant"
        type="button"
      >
        <Bot className="h-4 w-4" />
        <span className="hidden sm:inline">AI Consultant</span>
        <span className="sm:hidden">Consult</span>
      </motion.button>

      {createPortal(modal, document.body)}
    </>
  );
}
