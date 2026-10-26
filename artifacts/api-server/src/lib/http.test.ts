import { describe, expect, it } from "vitest";
import { ipv6Prefix64, providerUserAgent } from "./http";

describe("ipv6Prefix64", () => {
  it("groups addresses by their first 64 bits", () => {
    expect(ipv6Prefix64("2001:db8:85a3:0000:1111:2222:3333:4444")).toBe("2001:db8:85a3:0::/64");
    expect(ipv6Prefix64("2001:db8:85a3::1")).toBe("2001:db8:85a3:0::/64");
    expect(ipv6Prefix64("2001:DB8:85A3:0:ffff::9")).toBe("2001:db8:85a3:0::/64");
    expect(ipv6Prefix64("::1")).toBe("0:0:0:0::/64");
  });
});

describe("providerUserAgent", () => {
  it("names the site's contact page and adds a valid mailto only", () => {
    expect(providerUserAgent()).toBe("proof-atlas/3 (+https://anupam-roy.vercel.app/contact/)");
    expect(providerUserAgent("ops@example.com")).toBe("proof-atlas/3 (+https://anupam-roy.vercel.app/contact/; mailto:ops@example.com)");
    expect(providerUserAgent("not an address")).toBe("proof-atlas/3 (+https://anupam-roy.vercel.app/contact/)");
  });
});
