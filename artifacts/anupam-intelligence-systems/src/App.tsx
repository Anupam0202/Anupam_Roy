import { useEffect } from "react";
import { ErrorBoundary } from "@/components/errors/error-boundary";
import { Toaster } from "@/components/ui/toaster";
import Home from "@/pages/home";

function PortfolioRecovery() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4 py-12 text-white">
      <div className="glass w-full max-w-2xl rounded-3xl p-7 sm:p-10">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">
          Portfolio recovery mode
        </p>
        <h1 className="mt-3 font-display text-4xl font-bold sm:text-5xl">
          Anupam Roy
        </h1>
        <p className="mt-3 text-lg font-medium text-white/80">
          AI/ML Analyst · Production GenAI and backend systems
        </p>
        <p className="mt-5 max-w-xl text-sm leading-relaxed text-white/65 sm:text-base">
          An interactive module could not start, but the essential profile
          remains available. I build multi-agent, retrieval, automation, and
          cloud systems that turn operational knowledge into grounded action.
        </p>
        <div className="mt-7 flex flex-wrap gap-3">
          <a
            className="inline-flex min-h-11 items-center rounded-full bg-primary px-5 text-sm font-semibold text-black"
            href="mailto:anupam020202@gmail.com"
          >
            Email Anupam
          </a>
          <a
            className="inline-flex min-h-11 items-center rounded-full border border-white/15 px-5 text-sm font-semibold text-white"
            href="https://github.com/Anupam0202/"
          >
            GitHub
          </a>
          <a
            className="inline-flex min-h-11 items-center rounded-full border border-white/15 px-5 text-sm font-semibold text-white"
            href="https://www.linkedin.com/in/anupam--roy/"
          >
            LinkedIn
          </a>
          <button
            className="min-h-11 rounded-full border border-white/15 px-5 text-sm font-semibold text-white"
            onClick={() => window.location.reload()}
            type="button"
          >
            Retry portfolio
          </button>
        </div>
      </div>
    </main>
  );
}

export default function App() {
  useEffect(() => {
    document.documentElement.classList.add("dark");
    document.documentElement.style.colorScheme = "dark";
  }, []);

  return (
    <ErrorBoundary scope="application" fallback={<PortfolioRecovery />}>
      <Home />
      <Toaster />
    </ErrorBoundary>
  );
}
