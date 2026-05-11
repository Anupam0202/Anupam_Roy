import { Component, type ReactNode } from "react";
import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import { useEffect } from "react";
import Lenis from "lenis";

const queryClient = new QueryClient();

// ── Error boundary ──────────────────────────────────────────────────────────
interface EBState { hasError: boolean; message: string }

class ErrorBoundary extends Component<{ children: ReactNode }, EBState> {
  state: EBState = { hasError: false, message: "" };

  static getDerivedStateFromError(err: unknown): EBState {
    const message = err instanceof Error ? err.message : String(err);
    return { hasError: true, message };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="glass rounded-2xl p-10 max-w-md w-full mx-4 text-center">
            <p className="text-xs uppercase tracking-widest text-primary mb-4">System Error</p>
            <h1 className="font-display text-2xl font-bold text-white mb-3">Something went wrong</h1>
            <p className="text-sm text-muted-foreground mb-6 font-mono break-words">
              {this.state.message || "An unexpected error occurred."}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="rounded-full bg-primary px-6 py-2.5 text-sm font-semibold text-black transition hover:opacity-90"
            >
              Reload System
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

// ── Router ──────────────────────────────────────────────────────────────────
function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route component={NotFound} />
    </Switch>
  );
}

// ── App ─────────────────────────────────────────────────────────────────────
function App() {
  useEffect(() => {
    document.documentElement.classList.add("dark");
    document.documentElement.style.colorScheme = "dark";

    const lenis = new Lenis({ smoothWheel: true });

    let rafId: number;
    function raf(time: number) {
      lenis.raf(time);
      rafId = requestAnimationFrame(raf);
    }
    rafId = requestAnimationFrame(raf);

    return () => {
      cancelAnimationFrame(rafId);
      lenis.destroy();
    };
  }, []);

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Router />
        </WouterRouter>
        <Toaster />
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
