import { Component, type ErrorInfo, type ReactNode } from "react";
interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  scope: string;
}
interface State {
  hasError: boolean;
}
interface Report {
  scope: string;
  message: string;
  componentStack: string;
  release: string;
  path: string;
}
function report(detail: Report) {
  const body = JSON.stringify(detail);
  try {
    if (
      navigator.sendBeacon?.(
        "/api/client-error",
        new Blob([body], { type: "application/json" }),
      )
    )
      return;
  } catch {
    /* fetch fallback */
  }
  void fetch("/api/client-error", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
    keepalive: true,
  }).catch(() => undefined);
}
export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };
  static getDerivedStateFromError(): State {
    return { hasError: true };
  }
  componentDidCatch(error: Error, info: ErrorInfo) {
    const detail: Report = {
      scope: this.props.scope,
      message: error.message,
      componentStack: info.componentStack ?? "",
      release: import.meta.env.VITE_APP_RELEASE ?? "unknown",
      path: location.pathname,
    };
    console.error("[portfolio-error]", detail);
    dispatchEvent(new CustomEvent("portfolio:error", { detail }));
    report(detail);
  }
  render() {
    return this.state.hasError
      ? (this.props.fallback ?? null)
      : this.props.children;
  }
}
export function SectionBoundary({
  children,
  label,
}: {
  children: ReactNode;
  label: string;
}) {
  const slug = label.toLowerCase().replace(/\s+/g, "-");
  return (
    <ErrorBoundary
      scope={`section:${slug}`}
      fallback={
        <section
          className="mx-auto w-[92%] max-w-7xl py-12"
          aria-labelledby={`failed-${slug}`}
        >
          <div className="rounded-3xl border border-amber-300/20 bg-amber-300/[0.05] p-8">
            <p className="text-sm font-semibold uppercase text-amber-200">
              Section unavailable
            </p>
            <h2
              id={`failed-${slug}`}
              className="mt-2 font-display text-2xl font-bold text-white"
            >
              {label} could not load
            </h2>
            <p className="mt-3 text-sm text-white/70">
              The rest of the portfolio is still available. Reload once to retry
              this section.
            </p>
            <button
              type="button"
              onClick={() => location.reload()}
              className="mt-5 min-h-11 rounded-full border border-amber-200/30 px-5 text-sm text-amber-100"
            >
              Retry section
            </button>
          </div>
        </section>
      }
    >
      {children}
    </ErrorBoundary>
  );
}
