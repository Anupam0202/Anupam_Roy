import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Bot, ExternalLink, Send, Square, Trash2, X } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { suggestedPrompts } from "@/data/assistant";
import { type ConsultantStatus, usePortfolioConsultant } from "@/hooks/use-portfolio-consultant";

function statusLabel(status: ConsultantStatus) {
  const labels: Record<ConsultantStatus, string> = {
    checking: "Checking grounded response mode",
    "ready-gemini": "Gemini ready with offline fallback",
    "ready-offline": "Offline portfolio data",
    streaming: "Building a grounded response",
    "offline-fallback": "Using offline portfolio mode",
    error: "Response interrupted - ready to retry",
  };
  return labels[status];
}

function PromptRail({ disabled, onSelect }: { disabled: boolean; onSelect: (prompt: string) => void }) {
  return (
    <div className="border border-white/8 bg-white/[0.025] p-3 [@media(max-height:520px)]:hidden">
      <div className="mb-2 flex items-center justify-between gap-3">
        <p className="text-[10px] font-semibold uppercase text-white/35">Suggested prompts</p>
        <p className="hidden text-[10px] text-white/30 sm:block">Choose one to start</p>
      </div>
      <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {suggestedPrompts.map((prompt) => (
          <button
            key={prompt}
            onClick={() => onSelect(prompt)}
            disabled={disabled}
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
  const { messages, status, responding, hasUserMessage, send, cancelResponse, clearConversation } =
    usePortfolioConsultant(open);
  const dialogRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const closeDialog = useCallback(() => {
    if (responding) cancelResponse();
    setOpen(false);
    window.setTimeout(() => triggerRef.current?.focus(), 0);
  }, [cancelResponse, responding]);

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

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        closeDialog();
        return;
      }
      if (event.key !== "Tab" || !dialogRef.current) return;

      const focusable = Array.from(
        dialogRef.current.querySelectorAll<HTMLElement>(
          "button:not([disabled]), input:not([disabled]), a[href]:not([tabindex='-1'])",
        ),
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
  }, [closeDialog, open]);

  const submit = (text = input) => {
    const content = text.trim();
    if (!content || responding) return;
    setInput("");
    void send(content);
  };

  const modal = (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeDialog}
            className="fixed inset-0 z-[150] cursor-default bg-black/60 backdrop-blur-sm"
            aria-hidden="true"
          />
          <motion.div
            ref={dialogRef}
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            className="fixed inset-x-2 bottom-2 top-2 z-[200] flex min-h-0 flex-col overflow-hidden border border-white/10 bg-[#07110f]/98 shadow-[0_0_80px_rgba(0,0,0,0.85)] backdrop-blur-2xl sm:bottom-8 sm:left-auto sm:right-8 sm:top-auto sm:h-[720px] sm:max-h-[calc(100dvh-4rem)] sm:w-[470px]"
            role="dialog"
            aria-modal="true"
            aria-labelledby="portfolio-concierge-title"
            aria-describedby="portfolio-concierge-status"
          >
            <div className="flex shrink-0 items-start justify-between gap-3 border-b border-white/10 p-4 sm:p-5 [@media(max-height:520px)]:p-3">
              <div className="min-w-0">
                <p className="text-[10px] font-bold uppercase text-primary sm:text-xs">Portfolio Concierge</p>
                <h2 id="portfolio-concierge-title" className="mt-1 font-display text-base font-bold text-white sm:text-lg">
                  Ask about Anupam's fit
                </h2>
                <p
                  id="portfolio-concierge-status"
                  className="mt-1 truncate text-[11px] text-muted-foreground sm:mt-2 sm:text-xs"
                  role="status"
                  aria-live="polite"
                >
                  {statusLabel(status)}
                </p>
              </div>
              <div className="flex shrink-0 gap-1">
                {hasUserMessage && (
                  <button
                    onClick={clearConversation}
                    disabled={responding}
                    className="flex h-11 w-11 items-center justify-center text-white/48 transition hover:bg-white/8 hover:text-white disabled:opacity-35"
                    aria-label="Clear conversation"
                    title="Clear conversation"
                    type="button"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
                {responding && (
                  <button
                    onClick={cancelResponse}
                    className="flex h-11 w-11 items-center justify-center text-secondary transition hover:bg-secondary/8"
                    aria-label="Cancel response"
                    title="Cancel response"
                    type="button"
                  >
                    <Square className="h-3.5 w-3.5 fill-current" />
                  </button>
                )}
                <button
                  onClick={closeDialog}
                  className="flex h-11 w-11 items-center justify-center text-white/55 transition hover:bg-white/10 hover:text-white"
                  aria-label="Close consultant"
                  type="button"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div
              className="min-h-0 flex-1 space-y-3 overflow-y-auto overscroll-contain p-3 sm:space-y-4 sm:p-4"
              data-consult-messages="true"
              aria-live="polite"
            >
              {messages.map((message, index) => (
                <div
                  key={`${message.role}-${index}`}
                  data-message-mode={message.mode}
                  className={`max-w-[94%] overflow-hidden break-words px-3 py-2.5 text-[13px] leading-relaxed sm:max-w-[92%] sm:px-4 sm:py-3 sm:text-sm ${
                    message.role === "user" ? "ml-auto bg-primary text-black" : "border border-white/5 bg-white/[0.05] text-muted-foreground"
                  }`}
                >
                  {message.role === "assistant" ? (
                    <>
                      <div className="prose prose-sm prose-invert max-w-none">
                        <ReactMarkdown>{message.content}</ReactMarkdown>
                        {message.streaming && <span className="ml-1 inline-block h-3 w-0.5 animate-pulse bg-primary" />}
                      </div>
                      {!!message.references?.length && (
                        <div className="mt-3 flex flex-wrap gap-1.5 border-t border-white/8 pt-2">
                          {message.references.map((reference) => (
                            <a
                              key={reference.href}
                              href={reference.href}
                              onClick={closeDialog}
                              className="inline-flex min-h-8 items-center gap-1.5 rounded-full border border-primary/20 px-2.5 text-[10px] font-semibold text-primary/75 transition hover:border-primary/40 hover:text-primary"
                            >
                              {reference.label}
                              <ExternalLink className="h-3 w-3" />
                            </a>
                          ))}
                        </div>
                      )}
                    </>
                  ) : (
                    message.content
                  )}
                </div>
              ))}
              {!hasUserMessage && !responding && <PromptRail disabled={responding} onSelect={submit} />}
              <div ref={messagesEndRef} />
            </div>

            <div className="shrink-0 border-t border-white/8 bg-[#07110f]/98 p-3 sm:p-4" data-consult-inputbar="true">
              <div className="flex gap-2">
                <input
                  ref={inputRef}
                  value={input}
                  onChange={(event) => setInput(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" && !event.shiftKey) {
                      event.preventDefault();
                      submit();
                    }
                  }}
                  placeholder="Ask about experience, systems, or projects..."
                  className="min-w-0 flex-1 border border-white/10 bg-white/[0.04] px-3 py-3 text-sm text-white outline-none placeholder:text-white/30 focus:border-primary/45 sm:px-4"
                  disabled={responding}
                  maxLength={1500}
                />
                <button
                  onClick={() => (responding ? cancelResponse() : submit())}
                  disabled={!responding && !input.trim()}
                  className="flex h-12 w-12 shrink-0 items-center justify-center bg-primary text-black transition hover:bg-primary/90 disabled:opacity-40"
                  aria-label={responding ? "Cancel response" : "Send message"}
                  type="button"
                >
                  {responding ? <Square className="h-3.5 w-3.5 fill-current" /> : <Send className="h-4 w-4" />}
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
        ref={triggerRef}
        onClick={() => setOpen(true)}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="fixed bottom-3 right-3 z-[100] inline-flex h-12 w-12 items-center justify-center gap-2 rounded-full border border-primary/30 bg-primary p-0 text-sm font-bold text-black shadow-[0_0_40px_rgba(45,212,191,0.3)] min-[480px]:h-auto min-[480px]:w-auto min-[480px]:min-h-12 min-[480px]:px-4 min-[480px]:py-3 sm:bottom-8 sm:right-8 sm:px-5"
        aria-label="Open AI portfolio consultant"
        type="button"
      >
        <Bot className="h-4 w-4" />
        <span className="hidden sm:inline">AI Consultant</span>
        <span className="hidden min-[480px]:inline sm:hidden">Consult</span>
      </motion.button>

      {createPortal(modal, document.body)}
    </>
  );
}
