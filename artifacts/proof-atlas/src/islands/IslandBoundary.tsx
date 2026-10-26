import { Component, type ErrorInfo, type ReactNode } from "react";

interface Props {
  name: string;
  children: ReactNode;
}

/** Keeps one broken island from taking down the page, and reports it once. */
export class IslandBoundary extends Component<Props, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    try {
      const body = JSON.stringify({
        scope: `island:${this.props.name}`,
        message: String(error?.message ?? error).slice(0, 500),
        componentStack: String(info.componentStack ?? "").slice(0, 3000),
        release: document.querySelector<HTMLMetaElement>('meta[name="release"]')?.content ?? "local",
        path: location.pathname,
      });
      const sent = navigator.sendBeacon?.("/api/client-error", new Blob([body], { type: "application/json" }));
      if (!sent)
        void fetch("/api/client-error", { method: "POST", headers: { "Content-Type": "application/json" }, body, keepalive: true }).catch(
          () => undefined,
        );
    } catch {
      /* reporting must never throw */
    }
  }

  render() {
    if (this.state.failed)
      return (
        <div className="notice" role="alert">
          This tool stopped working. Reload the page to try again; the rest of the page still works.
        </div>
      );
    return this.props.children;
  }
}
