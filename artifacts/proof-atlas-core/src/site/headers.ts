/**
 * HTTP security headers for every page. vercel.json must send the same values:
 * tests/unit/config.test.ts checks that they match, and scripts/serve-local.mjs
 * reads them from vercel.json.
 *
 * script-src and style-src are not here: Astro writes them into a per-page
 * CSP <meta> tag with hashes for the scripts and styles it emits. Directives a
 * meta tag cannot carry (frame-ancestors) must be sent as a header.
 */
export const PAGE_CSP = "frame-ancestors 'none'; object-src 'none'; base-uri 'self'; form-action 'self'";

export const API_CSP = "default-src 'none'; frame-ancestors 'none'";

export const SECURITY_HEADERS: ReadonlyArray<{ key: string; value: string }> = [
  { key: "Content-Security-Policy", value: PAGE_CSP },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
  { key: "Cross-Origin-Resource-Policy", value: "same-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=()" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
];
