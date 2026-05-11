import { useState, type FormEvent } from "react";
import { CheckCircle, Mail, MessageSquare, Send, ShieldCheck, User } from "lucide-react";
import { profile } from "@/data/profile";
import { toast } from "@/hooks/use-toast";

type FormState = "idle" | "submitting" | "success";

interface ContactPayload {
  name: string;
  email: string;
  subject: string;
  message: string;
  company: string;
}

const initialForm: ContactPayload = {
  name: "",
  email: "",
  subject: "",
  message: "",
  company: "",
};

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function wasRecentlySubmitted() {
  try {
    const last = Number(window.localStorage.getItem("portfolio-contact-last-submit") ?? 0);
    return Date.now() - last < 60_000;
  } catch {
    return false;
  }
}

export default function ContactForm() {
  const [form, setForm] = useState<ContactPayload>(initialForm);
  const [state, setState] = useState<FormState>("idle");
  const [errors, setErrors] = useState<Partial<Record<keyof ContactPayload, string>>>({});

  function update(field: keyof ContactPayload, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
    if (errors[field]) setErrors((current) => ({ ...current, [field]: undefined }));
  }

  function validate() {
    const next: Partial<Record<keyof ContactPayload, string>> = {};
    const name = form.name.trim();
    const email = form.email.trim();
    const subject = form.subject.trim();
    const message = form.message.trim();

    if (!name) next.name = "Name is required.";
    if (!email) next.email = "Email is required.";
    else if (!isValidEmail(email)) next.email = "Enter a valid email address.";
    if (!subject) next.subject = "Subject is required.";
    if (!message) next.message = "Message is required.";
    else if (message.length < 20) next.message = "Please add at least 20 characters.";

    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!validate()) return;

    if (wasRecentlySubmitted()) {
      toast({
        title: "Please wait a moment",
        description: "The contact form is rate-limited to reduce spam.",
        variant: "destructive",
      });
      return;
    }

    setState("submitting");
    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.error ?? "Message could not be sent.");

      try {
        window.localStorage.setItem("portfolio-contact-last-submit", String(Date.now()));
      } catch {
        // Non-critical: server-side rate limiting still protects the endpoint.
      }
      setForm(initialForm);
      setState("success");
      toast({
        title: "Message sent",
        description: "Your message was sent to Anupam's inbox.",
      });
      window.setTimeout(() => setState("idle"), 3000);
    } catch (error) {
      setState("idle");
      toast({
        title: "Message not sent",
        description: error instanceof Error ? error.message : "The contact service is unavailable right now.",
        variant: "destructive",
      });
    }
  }

  return (
    <section id="contact" className="py-20 md:py-28">
      <div className="mx-auto w-[92%] max-w-4xl">
        <div className="rounded-3xl border border-white/8 bg-white/[0.03] p-5 shadow-[0_0_70px_rgba(0,0,0,0.28)] md:p-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-primary">Contact</p>
              <h2 className="mt-3 font-display text-4xl font-bold text-white md:text-6xl">Start the conversation.</h2>
              <p className="mt-5 max-w-2xl text-base leading-relaxed text-muted-foreground">
                Send a focused message for AI/ML roles, GenAI architecture, RAG systems, backend engineering, or cloud AI opportunities.
              </p>
            </div>
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/[0.08] px-4 py-2 text-xs font-semibold text-primary">
              <ShieldCheck className="h-4 w-4" />
              Secure server-side delivery
            </div>
          </div>

          <form onSubmit={handleSubmit} className="mt-8 grid gap-4" noValidate>
            <input
              className="hidden"
              tabIndex={-1}
              autoComplete="off"
              value={form.company}
              onChange={(event) => update("company", event.target.value)}
              aria-hidden="true"
              name="company"
            />

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Name" error={errors.name} icon={<User className="h-4 w-4" />}>
                <input
                  name="name"
                  value={form.name}
                  onChange={(event) => update("name", event.target.value)}
                  placeholder="Your name"
                  className="contact-input contact-input-with-icon"
                  autoComplete="name"
                  maxLength={120}
                  aria-invalid={Boolean(errors.name)}
                />
              </Field>

              <Field label="Email" error={errors.email} icon={<Mail className="h-4 w-4" />}>
                <input
                  name="email"
                  value={form.email}
                  onChange={(event) => update("email", event.target.value)}
                  placeholder="you@company.com"
                  className="contact-input contact-input-with-icon"
                  autoComplete="email"
                  inputMode="email"
                  maxLength={180}
                  aria-invalid={Boolean(errors.email)}
                />
              </Field>
            </div>

            <Field label="Subject" error={errors.subject}>
              <input
                name="subject"
                value={form.subject}
                onChange={(event) => update("subject", event.target.value)}
                placeholder="AI/ML role, architecture discussion, or collaboration"
                className="contact-input"
                maxLength={160}
                aria-invalid={Boolean(errors.subject)}
              />
            </Field>

            <Field label="Message" error={errors.message} icon={<MessageSquare className="h-4 w-4" />}>
              <textarea
                name="message"
                value={form.message}
                onChange={(event) => update("message", event.target.value)}
                placeholder="Share the role, system, or problem you want to discuss..."
                rows={6}
                className="contact-input contact-input-with-icon resize-none"
                maxLength={5000}
                aria-invalid={Boolean(errors.message)}
              />
            </Field>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs text-white/38">Delivered to {profile.email} through the backend contact API.</p>
              <button
                type="submit"
                disabled={state === "submitting"}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-primary px-7 py-4 text-sm font-bold text-black transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-55"
              >
                {state === "submitting" ? (
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-black/25 border-t-black" />
                ) : state === "success" ? (
                  <CheckCircle className="h-4 w-4" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
                {state === "submitting" ? "Sending..." : state === "success" ? "Sent" : "Send Message"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </section>
  );
}

function Field({ label, error, icon, children }: { label: string; error?: string; icon?: React.ReactNode; children: React.ReactNode }) {
  const errorId = error ? `${label.toLowerCase().replace(/\s+/g, "-")}-error` : undefined;

  return (
    <label className="block">
      <span className="mb-2 block text-xs font-semibold uppercase text-white/45">{label}</span>
      <div className="relative">
        {icon && <span className="pointer-events-none absolute left-4 top-[0.95rem] z-10 text-white/30">{icon}</span>}
        {children}
      </div>
      {error && (
        <span id={errorId} className="mt-1.5 block text-xs text-red-300">
          {error}
        </span>
      )}
    </label>
  );
}
