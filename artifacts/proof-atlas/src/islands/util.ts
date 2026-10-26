import { useSyncExternalStore } from "react";

const noSubscription = () => () => {};

/**
 * A value only the browser knows (the URL, screen width, session storage).
 * The server render and hydration use `serverValue`, so markup matches; the
 * browser's value follows in the next render. `read` must return a primitive.
 */
export function useClientValue<T extends string | number | boolean>(read: () => T, serverValue: T): T {
  return useSyncExternalStore(noSubscription, read, () => serverValue);
}

/** False during the server render and hydration, true afterwards. */
export const useHydrated = () => useClientValue(() => true, false);

/** Triggers a client-side download of generated text. Nothing is uploaded. */
export function downloadText(filename: string, content: string, type = "text/plain") {
  const blob = new Blob([content], { type: `${type};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1_000);
}

export async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

export function formatDateTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short", timeZone: "UTC" }) + " UTC";
}

/** Plain-language wait, from a Retry-After value in seconds. */
export function waitText(seconds: number | undefined): string {
  if (!seconds || seconds <= 0) return "Try again shortly.";
  if (seconds < 60) return "Try again in under a minute.";
  if (seconds < 3_600) {
    const minutes = Math.ceil(seconds / 60);
    return `Try again in about ${minutes} minute${minutes === 1 ? "" : "s"}.`;
  }
  const hours = Math.round(seconds / 3_600);
  return `Try again in about ${hours} hour${hours === 1 ? "" : "s"}.`;
}

export interface ApiError {
  kind: "invalid" | "not-found" | "rate-limited" | "unavailable" | "error";
  message: string;
  retryAfter?: number;
}

/** POSTs JSON and maps HTTP failures to user-facing states. */
export async function postJson<T>(url: string, body: unknown, timeoutMs = 20_000): Promise<{ ok: true; data: T } | { ok: false; error: ApiError }> {
  let res: Response;
  try {
    res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(timeoutMs),
    });
  } catch {
    return { ok: false, error: { kind: "unavailable", message: "The service could not be reached. Check your connection and try again." } };
  }
  let payload: unknown;
  try {
    payload = await res.json();
  } catch {
    payload = null;
  }
  if (res.ok) return { ok: true, data: payload as T };
  const message =
    (payload as { error?: string } | null)?.error ??
    (res.status >= 500 ? "Something went wrong on the server. Please try again in a moment." : "The request could not be completed. Please try again.");
  const retryAfter = Number(res.headers.get("retry-after")) || undefined;
  if (res.status === 400 || res.status === 415) return { ok: false, error: { kind: "invalid", message } };
  if (res.status === 404) return { ok: false, error: { kind: "not-found", message } };
  if (res.status === 429) return { ok: false, error: { kind: "rate-limited", message, retryAfter } };
  if (res.status === 502 || res.status === 503 || res.status === 504) return { ok: false, error: { kind: "unavailable", message, retryAfter } };
  return { ok: false, error: { kind: "error", message } };
}
