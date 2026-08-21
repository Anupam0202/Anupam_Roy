import { describe, expect, it } from "vitest";

import { ALL_CERTS, FEATURED_CERT_NAMES } from "./certifications";

describe("certification proof data", () => {
  it("resolves every featured credential", () => {
    const resolved = FEATURED_CERT_NAMES.map((name) =>
      ALL_CERTS.find((cert) => cert.name === name),
    );

    expect(resolved).toHaveLength(FEATURED_CERT_NAMES.length);
    expect(resolved.every(Boolean)).toBe(true);
  });

  it("keeps featured credential names unique", () => {
    expect(new Set(FEATURED_CERT_NAMES).size).toBe(FEATURED_CERT_NAMES.length);
  });
});
