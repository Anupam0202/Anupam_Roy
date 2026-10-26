import { describe, expect, it } from "vitest";
import { assertAllowedUrl } from "../security/egress";
import { PROVIDER_POLICIES, egressPolicy, validateProviderPolicies, type ProviderPolicy } from "./policies";

describe("provider policies", () => {
  it("are valid as shipped (checked against the review date)", () => {
    expect(validateProviderPolicies(PROVIDER_POLICIES, new Date("2026-10-25T12:00:00Z"))).toEqual([]);
  });

  it("keep non-commercial providers disabled", () => {
    expect(PROVIDER_POLICIES["open-meteo"]).toMatchObject({ enabled: false, commercialUse: "restricted" });
    expect(PROVIDER_POLICIES.openalex.enabled).toBe(false);
  });

  it("refuse an enabled provider with unknown rights, no caps or stale review", () => {
    const bad: ProviderPolicy = {
      ...PROVIDER_POLICIES.github,
      commercialUse: "unknown",
      allowedHosts: [],
      timeoutMs: 0,
      maxResponseBytes: 0,
    };
    const messages = validateProviderPolicies({ github: bad }, new Date("2026-10-25")).map((i) => i.message);
    expect(messages).toEqual(
      expect.arrayContaining([
        'commercial use is "unknown"',
        "no allowed hosts",
        "timeout missing or above 30 s",
        "response size cap missing or above 4 MiB",
      ]),
    );
    expect(validateProviderPolicies(PROVIDER_POLICIES, new Date("2027-06-01")).length).toBeGreaterThan(0);
  });

  it("allow exactly the provider paths the API builds", () => {
    expect(() => assertAllowedUrl("https://api.github.com/repos/a/b/readme", egressPolicy("github"), "GET")).not.toThrow();
    expect(() => assertAllowedUrl("https://api.github.com/repos/a/b/contents", egressPolicy("github"), "GET")).not.toThrow();
    expect(() => assertAllowedUrl("https://api.github.com/repos/a/b/contents/secret.txt", egressPolicy("github"), "GET")).toThrow();
    for (const m of ["package.json", "pyproject.toml", "requirements.txt"])
      expect(() => assertAllowedUrl(`https://api.github.com/repos/a/b/contents/${m}`, egressPolicy("github"), "GET")).not.toThrow();
    expect(() => assertAllowedUrl("https://api.github.com/repos/a/b/contents/src/package.json", egressPolicy("github"), "GET")).toThrow();
    expect(() => assertAllowedUrl("https://registry.npmjs.org/astro/latest", egressPolicy("npm"), "GET")).not.toThrow();
    expect(() => assertAllowedUrl("https://registry.npmjs.org/@types%2fnode/latest", egressPolicy("npm"), "GET")).not.toThrow();
    expect(() => assertAllowedUrl("https://registry.npmjs.org/astro", egressPolicy("npm"), "GET")).toThrow();
    expect(() => assertAllowedUrl("https://registry.npmjs.org/-/v1/search", egressPolicy("npm"), "GET")).toThrow();
    expect(() => assertAllowedUrl("https://pypi.org/pypi/fastapi/json", egressPolicy("pypi"), "GET")).not.toThrow();
    expect(() => assertAllowedUrl("https://pypi.org/simple/fastapi/", egressPolicy("pypi"), "GET")).toThrow();
    expect(() => assertAllowedUrl("https://api.crossref.org/works/10.1000/xyz", egressPolicy("crossref"), "GET")).not.toThrow();
    expect(() => assertAllowedUrl("https://api.crossref.org/members", egressPolicy("crossref"), "GET")).toThrow();
    expect(() => assertAllowedUrl("https://api.datacite.org/dois/10.1000/xyz", egressPolicy("datacite"), "GET")).not.toThrow();
    expect(() =>
      assertAllowedUrl("https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent", egressPolicy("gemini"), "POST"),
    ).not.toThrow();
  });
});

describe("registry additions", () => {
  it("allows GitHub's rename redirects and npm legacy names, and validates the Resend policy", () => {
    const github = egressPolicy("github");
    expect(() => assertAllowedUrl("https://api.github.com/repositories/42/readme", github, "GET")).not.toThrow();
    expect(() => assertAllowedUrl("https://api.github.com/repositories/abc", github, "GET")).toThrow();
    expect(() => assertAllowedUrl("https://registry.npmjs.org/JSONStream/latest", egressPolicy("npm"), "GET")).not.toThrow();
    expect(() => assertAllowedUrl("https://api.resend.com/emails", egressPolicy("resend"), "POST")).not.toThrow();
    expect(() => assertAllowedUrl("https://api.resend.com/emails", egressPolicy("resend"), "GET")).toThrow();
    expect(validateProviderPolicies(PROVIDER_POLICIES, new Date("2026-10-26")).filter((i) => i.provider === "resend")).toEqual([]);
    expect(PROVIDER_POLICIES.crossref.resourceTtlSeconds).toEqual({ doi: 604_800, search: 3_600 });
    expect(egressPolicy("pypi").responseType).toBe("json");
  });
});
