/**
 * Outbound request guard. The server never fetches a visitor-supplied URL:
 * routes build provider URLs from validated identifiers, and every request
 * (including each redirect hop) must pass this allowlist.
 *
 * Accepted limit: hostnames are checked, not the addresses they resolve to,
 * because fetch gives no hook between DNS resolution and connection. Only
 * allowlisted public provider hostnames are ever requested, so DNS rebinding
 * would need control of a provider's DNS.
 */

export interface EgressPolicy {
  id: string;
  allowedHosts: readonly string[];
  /** Regular expressions matched against the URL pathname. */
  allowedPathPatterns: readonly RegExp[];
  methodAllowlist: ReadonlyArray<"GET" | "POST">;
  timeoutMs: number;
  maxResponseBytes: number;
  maxRedirects: number;
  /** "json": successful responses must declare a JSON content type and be valid UTF-8. */
  responseType?: "json";
}

export type EgressErrorCode =
  | "blocked-url"
  | "blocked-host"
  | "blocked-path"
  | "blocked-method"
  | "redirect-blocked"
  | "too-many-redirects"
  | "timeout"
  | "response-too-large"
  | "unexpected-content-type"
  | "invalid-encoding"
  | "network";

export class EgressError extends Error {
  constructor(
    readonly code: EgressErrorCode,
    message: string,
  ) {
    super(message);
    this.name = "EgressError";
  }
}

const PRIVATE_HOST =
  /^(localhost|.*\.localhost|.*\.local|.*\.internal|metadata\.google\.internal|0\.0\.0\.0)$/i;

/** True for IPv4/IPv6 literals; providers are always reached by hostname. */
export function isIpLiteral(hostname: string): boolean {
  const h = hostname.replace(/^\[|\]$/g, "");
  return /^\d{1,3}(\.\d{1,3}){3}$/.test(h) || h.includes(":") || /^0x[0-9a-f]+$/i.test(h) || /^\d+$/.test(h);
}

export function assertAllowedUrl(rawUrl: string | URL, policy: EgressPolicy, method: string): URL {
  let url: URL;
  try {
    url = new URL(String(rawUrl));
  } catch {
    throw new EgressError("blocked-url", "Malformed outbound URL.");
  }
  if (url.protocol !== "https:") throw new EgressError("blocked-url", "Only HTTPS is allowed.");
  if (url.username || url.password) throw new EgressError("blocked-url", "Credentials in URLs are not allowed.");
  if (url.port && url.port !== "443") throw new EgressError("blocked-url", "Non-default ports are not allowed.");
  const host = url.hostname.toLowerCase();
  if (isIpLiteral(host) || PRIVATE_HOST.test(host))
    throw new EgressError("blocked-host", "IP literals and private hostnames are not allowed.");
  if (!policy.allowedHosts.includes(host))
    throw new EgressError("blocked-host", `Host ${host} is not allowed for ${policy.id}.`);
  if (!policy.allowedPathPatterns.some((p) => p.test(url.pathname)))
    throw new EgressError("blocked-path", `Path is not allowed for ${policy.id}.`);
  if (!policy.methodAllowlist.includes(method.toUpperCase() as "GET" | "POST"))
    throw new EgressError("blocked-method", `Method ${method} is not allowed for ${policy.id}.`);
  return url;
}

export interface GuardedResponse {
  status: number;
  headers: Headers;
  url: string;
  text: string;
}

export type FetchLike = (input: string, init?: RequestInit) => Promise<Response>;

async function readCapped(response: Response, maxBytes: number): Promise<string> {
  const declared = Number(response.headers.get("content-length"));
  if (Number.isFinite(declared) && declared > maxBytes)
    throw new EgressError("response-too-large", "Provider response exceeds the size limit.");
  if (!response.body) return "";
  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > maxBytes) {
      await reader.cancel().catch(() => undefined);
      throw new EgressError("response-too-large", "Provider response exceeds the size limit.");
    }
    chunks.push(value);
  }
  const merged = new Uint8Array(total);
  let offset = 0;
  for (const c of chunks) {
    merged.set(c, offset);
    offset += c.byteLength;
  }
  try {
    return new TextDecoder("utf-8", { fatal: true }).decode(merged);
  } catch {
    throw new EgressError("invalid-encoding", "Provider response is not valid UTF-8.");
  }
}

/** Headers that carry credentials; they never follow a redirect to another origin. */
const CREDENTIAL_HEADERS = ["authorization", "x-goog-api-key", "cookie", "proxy-authorization"];

function withoutCredentials(headers: RequestInit["headers"]): Headers {
  const out = new Headers(headers);
  for (const name of CREDENTIAL_HEADERS) out.delete(name);
  return out;
}

/**
 * Fetches through the policy: manual redirects (each hop re-checked), timeout,
 * and a streaming byte cap. Never follows a redirect off the allowlist.
 */
export async function guardedFetch(
  rawUrl: string,
  policy: EgressPolicy,
  init: RequestInit = {},
  fetchImpl: FetchLike = fetch,
): Promise<GuardedResponse> {
  let method = (init.method ?? "GET").toUpperCase();
  let request: RequestInit = { ...init };
  let url = assertAllowedUrl(rawUrl, policy, method);
  const signal = AbortSignal.timeout(policy.timeoutMs);
  for (let hop = 0; ; hop += 1) {
    let response: Response;
    try {
      response = await fetchImpl(url.toString(), { ...request, method, redirect: "manual", signal });
    } catch (error) {
      if (signal.aborted || (error as Error)?.name === "TimeoutError" || (error as Error)?.name === "AbortError")
        throw new EgressError("timeout", `${policy.id} did not respond within ${policy.timeoutMs} ms.`);
      throw new EgressError("network", `${policy.id} could not be reached.`);
    }
    if (response.status >= 300 && response.status < 400 && response.headers.get("location")) {
      // The redirect body is never read.
      await response.body?.cancel().catch(() => undefined);
      if (hop >= policy.maxRedirects) throw new EgressError("too-many-redirects", "Too many redirects.");
      // 303 See Other: follow with GET and no body.
      if (response.status === 303 && method !== "GET") {
        method = "GET";
        const { body: _body, ...rest } = request;
        request = rest;
      }
      let next: URL;
      try {
        next = assertAllowedUrl(new URL(response.headers.get("location")!, url), policy, method);
      } catch (error) {
        throw new EgressError("redirect-blocked", `Redirect blocked: ${(error as Error).message}`);
      }
      if (next.origin !== url.origin) request = { ...request, headers: withoutCredentials(request.headers) };
      url = next;
      continue;
    }
    if (policy.responseType === "json" && response.status >= 200 && response.status < 300 && response.status !== 204) {
      const type = response.headers.get("content-type") ?? "";
      if (!/\bjson\b/i.test(type)) {
        await response.body?.cancel().catch(() => undefined);
        throw new EgressError("unexpected-content-type", `${policy.id} returned ${type || "no content type"} instead of JSON.`);
      }
    }
    try {
      const text = await readCapped(response, policy.maxResponseBytes);
      return { status: response.status, headers: response.headers, url: url.toString(), text };
    } catch (error) {
      if (error instanceof EgressError) throw error;
      if (signal.aborted) throw new EgressError("timeout", `${policy.id} did not respond within ${policy.timeoutMs} ms.`);
      throw new EgressError("network", `${policy.id} response could not be read.`);
    }
  }
}

/** Parses Retry-After (seconds or HTTP date) into whole seconds, if present. */
export function retryAfterSeconds(headers: Headers, now = Date.now()): number | null {
  const value = headers.get("retry-after");
  if (!value) return null;
  if (/^\d+$/.test(value.trim())) return Number(value.trim());
  const date = Date.parse(value);
  return Number.isNaN(date) ? null : Math.max(0, Math.ceil((date - now) / 1000));
}
