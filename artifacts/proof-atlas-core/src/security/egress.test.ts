import { describe, expect, it } from "vitest";
import { EgressError, assertAllowedUrl, guardedFetch, isIpLiteral, retryAfterSeconds, type EgressPolicy } from "./egress";

const policy: EgressPolicy = {
  id: "github",
  allowedHosts: ["api.github.com"],
  allowedPathPatterns: [/^\/repos\/[^/]+\/[^/]+(\/(readme|releases|languages|contents\/?))?$/],
  methodAllowlist: ["GET"],
  timeoutMs: 200,
  maxResponseBytes: 64,
  maxRedirects: 2,
};

const code = (fn: () => unknown) => {
  try {
    fn();
  } catch (e) {
    return (e as EgressError).code;
  }
  return "ok";
};

describe("assertAllowedUrl (SSRF fixtures)", () => {
  it("allows exactly the provider host, path and method", () => {
    expect(code(() => assertAllowedUrl("https://api.github.com/repos/a/b", policy, "GET"))).toBe("ok");
  });

  it("normalizes case and the default port", () => {
    expect(code(() => assertAllowedUrl("https://API.GitHub.COM/repos/a/b", policy, "GET"))).toBe("ok");
    expect(code(() => assertAllowedUrl("https://api.github.com:443/repos/a/b", policy, "GET"))).toBe("ok");
  });

  it.each([
    ["http://api.github.com/repos/a/b", "blocked-url"],
    ["https://user:pw@api.github.com/repos/a/b", "blocked-url"],
    ["https://api.github.com:8443/repos/a/b", "blocked-url"],
    ["https://127.0.0.1/repos/a/b", "blocked-host"],
    ["https://[::1]/repos/a/b", "blocked-host"],
    ["https://169.254.169.254/latest/meta-data", "blocked-host"],
    ["https://2130706433/repos/a/b", "blocked-host"],
    ["https://0x7f000001/repos/a/b", "blocked-host"],
    ["https://localhost/repos/a/b", "blocked-host"],
    ["https://metadata.google.internal/computeMetadata/v1/", "blocked-host"],
    ["https://api.github.com.evil.example/repos/a/b", "blocked-host"],
    ["https://evil.example/repos/a/b", "blocked-host"],
    ["https://api.github.com/user", "blocked-path"],
    ["https://api.github.com/repos/a/b/../../user", "blocked-path"],
    ["https://api.github.com/repos/a/b/%2e%2e/%2E%2E/user", "blocked-path"],
    ["https://[::ffff:127.0.0.1]/repos/a/b", "blocked-host"],
    ["https://api.github.com./repos/a/b", "blocked-host"],
    ["https://user@api.github.com/repos/a/b", "blocked-url"],
    ["not a url", "blocked-url"],
  ])("rejects %s", (url, expected) => {
    expect(code(() => assertAllowedUrl(url, policy, "GET"))).toBe(expected);
  });

  it("rejects disallowed methods", () => {
    expect(code(() => assertAllowedUrl("https://api.github.com/repos/a/b", policy, "POST"))).toBe("blocked-method");
  });

  it("detects IP literals", () => {
    expect(isIpLiteral("10.0.0.1")).toBe(true);
    expect(isIpLiteral("[fd00::1]")).toBe(true);
    expect(isIpLiteral("api.github.com")).toBe(false);
  });
});

const respond = (body: string, init: ResponseInit = {}) => new Response(body, init);

describe("guardedFetch", () => {
  it("returns the body for an allowed request", async () => {
    const out = await guardedFetch("https://api.github.com/repos/a/b", policy, {}, async () => respond('{"ok":true}'));
    expect(out).toMatchObject({ status: 200, text: '{"ok":true}' });
  });

  it("follows an allowed redirect and re-checks it", async () => {
    const seen: string[] = [];
    const out = await guardedFetch("https://api.github.com/repos/a/b", policy, {}, async (url) => {
      seen.push(url);
      return seen.length === 1
        ? respond("", { status: 301, headers: { location: "/repos/new/b" } })
        : respond("{}");
    });
    expect(seen).toEqual(["https://api.github.com/repos/a/b", "https://api.github.com/repos/new/b"]);
    expect(out.url).toBe("https://api.github.com/repos/new/b");
  });

  it("refuses redirects that leave the allowlist", async () => {
    await expect(
      guardedFetch("https://api.github.com/repos/a/b", policy, {}, async () =>
        respond("", { status: 302, headers: { location: "https://169.254.169.254/latest/meta-data" } }),
      ),
    ).rejects.toMatchObject({ code: "redirect-blocked" });
  });

  it("caps redirect chains", async () => {
    await expect(
      guardedFetch("https://api.github.com/repos/a/b", policy, {}, async () =>
        respond("", { status: 301, headers: { location: "/repos/a/b" } }),
      ),
    ).rejects.toMatchObject({ code: "too-many-redirects" });
  });

  it("enforces the byte cap from headers and while streaming", async () => {
    await expect(
      guardedFetch("https://api.github.com/repos/a/b", policy, {}, async () =>
        respond("x", { headers: { "content-length": "999" } }),
      ),
    ).rejects.toMatchObject({ code: "response-too-large" });
    await expect(
      guardedFetch("https://api.github.com/repos/a/b", policy, {}, async () => respond("x".repeat(65))),
    ).rejects.toMatchObject({ code: "response-too-large" });
  });

  it("times out slow providers", async () => {
    await expect(
      guardedFetch("https://api.github.com/repos/a/b", policy, {}, (_url, init) =>
        new Promise((_resolve, reject) => {
          init?.signal?.addEventListener("abort", () => reject(new DOMException("timeout", "TimeoutError")));
        }),
      ),
    ).rejects.toMatchObject({ code: "timeout" });
  });

  it("maps network failures", async () => {
    await expect(
      guardedFetch("https://api.github.com/repos/a/b", policy, {}, async () => {
        throw new TypeError("fetch failed");
      }),
    ).rejects.toMatchObject({ code: "network" });
  });
});

describe("retryAfterSeconds", () => {
  it("parses seconds and HTTP dates", () => {
    expect(retryAfterSeconds(new Headers({ "retry-after": "120" }))).toBe(120);
    const now = Date.parse("2026-10-25T00:00:00Z");
    expect(retryAfterSeconds(new Headers({ "retry-after": "Sun, 25 Oct 2026 00:01:00 GMT" }), now)).toBe(60);
    expect(retryAfterSeconds(new Headers())).toBeNull();
  });
});

describe("guardedFetch hardening", () => {
  const jsonPolicy: EgressPolicy = { ...policy, maxResponseBytes: 1_000, responseType: "json" };

  it("cancels redirect bodies and drops credentials when the origin changes", async () => {
    let cancelled = false;
    const seen: Headers[] = [];
    const multi: EgressPolicy = { ...jsonPolicy, allowedHosts: ["api.github.com", "codeload.github.com"] };
    const body = new ReadableStream({ cancel: () => void (cancelled = true) });
    const out = await guardedFetch(
      "https://api.github.com/repos/a/b",
      multi,
      { headers: { Authorization: "Bearer t", "x-goog-api-key": "k", Accept: "application/json" } },
      async (url, init) => {
        seen.push(new Headers(init?.headers));
        return url.startsWith("https://api.github.com")
          ? new Response(body, { status: 302, headers: { location: "https://codeload.github.com/repos/a/b" } })
          : new Response("{}", { headers: { "content-type": "application/json" } });
      },
    );
    expect(out.status).toBe(200);
    expect(cancelled).toBe(true);
    expect(seen[0].get("authorization")).toBe("Bearer t");
    expect(seen[1].get("authorization")).toBeNull();
    expect(seen[1].get("x-goog-api-key")).toBeNull();
    expect(seen[1].get("accept")).toBe("application/json");
  });

  it("keeps credentials on a same-origin redirect (a renamed repository)", async () => {
    const seen: Headers[] = [];
    const renamed: EgressPolicy = { ...jsonPolicy, allowedPathPatterns: [...policy.allowedPathPatterns, /^\/repositories\/\d+$/] };
    await guardedFetch("https://api.github.com/repos/a/b", renamed, { headers: { Authorization: "Bearer t" } }, async (url, init) => {
      seen.push(new Headers(init?.headers));
      return url.endsWith("/repos/a/b")
        ? new Response(null, { status: 301, headers: { location: "/repositories/42" } })
        : new Response("{}", { headers: { "content-type": "application/json" } });
    });
    expect(seen.map((h) => h.get("authorization"))).toEqual(["Bearer t", "Bearer t"]);
  });

  it("follows a 303 with GET and no body", async () => {
    const post: EgressPolicy = { ...jsonPolicy, methodAllowlist: ["GET", "POST"] };
    const methods: Array<[string, unknown]> = [];
    await guardedFetch("https://api.github.com/repos/a/b", post, { method: "POST", body: "{}" }, async (url, init) => {
      methods.push([init?.method ?? "", init?.body]);
      return url.endsWith("/repos/a/b") && methods.length === 1
        ? new Response(null, { status: 303, headers: { location: "/repos/a/c" } })
        : new Response("{}", { headers: { "content-type": "application/json" } });
    });
    expect(methods).toEqual([
      ["POST", "{}"],
      ["GET", undefined],
    ]);
  });

  it("requires JSON in valid UTF-8 from JSON providers", async () => {
    const html = guardedFetch("https://api.github.com/repos/a/b", jsonPolicy, {}, async () => new Response("<html>", { headers: { "content-type": "text/html" } }));
    await expect(html).rejects.toMatchObject({ code: "unexpected-content-type" });
    const badBytes = guardedFetch(
      "https://api.github.com/repos/a/b",
      jsonPolicy,
      {},
      async () => new Response(new Uint8Array([0x7b, 0xff, 0x7d]), { headers: { "content-type": "application/json" } }),
    );
    await expect(badBytes).rejects.toMatchObject({ code: "invalid-encoding" });
    // Error pages are passed through for the caller to classify.
    const error = await guardedFetch("https://api.github.com/repos/a/b", jsonPolicy, {}, async () => new Response("<html>", { status: 502, headers: { "content-type": "text/html" } }));
    expect(error.status).toBe(502);
  });
});
