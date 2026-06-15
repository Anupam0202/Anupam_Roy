import { Component, type ReactNode, useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import Home from "@/pages/home";

interface ErrorBoundaryState {
  hasError: boolean;
}

class ErrorBoundary extends Component<{ children: ReactNode }, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-background">
          <div className="glass mx-4 w-full max-w-md rounded-2xl p-10 text-center">
            <p className="mb-4 text-xs uppercase tracking-widest text-primary">System Error</p>
            <h1 className="mb-3 font-display text-2xl font-bold text-white">Something went wrong</h1>
            <p className="mb-6 break-words font-mono text-sm text-muted-foreground">
              The portfolio could not finish loading. Reload to start a fresh session.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="rounded-full bg-primary px-6 py-2.5 text-sm font-semibold text-black transition hover:opacity-90"
              type="button"
            >
              Reload Portfolio
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default function App() {
  useEffect(() => {
    document.documentElement.classList.add("dark");
    document.documentElement.style.colorScheme = "dark";
  }, []);

  return (
    <ErrorBoundary>
      <Home />
      <Toaster />
    </ErrorBoundary>
  );
}
