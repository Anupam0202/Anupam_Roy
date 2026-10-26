import { createHash } from "node:crypto";
import { defineConfig } from "astro/config";
import react from "@astrojs/react";
import { THEME_INIT_SCRIPT } from "./src/lib/theme-script.ts";
import site from "../proof-atlas-core/src/data/site.json" with { type: "json" };

const themeHash = `sha256-${createHash("sha256").update(THEME_INIT_SCRIPT).digest("base64")}`;

export default defineConfig({
  site: site.url,
  output: "static",
  trailingSlash: "always",
  build: { format: "directory", inlineStylesheets: "never" },
  integrations: [react()],
  devToolbar: { enabled: false },
  markdown: { syntaxHighlight: false },
  security: {
    // Astro writes a per-page CSP <meta> with hashes for every script and
    // style it emits (including island loaders). frame-ancestors cannot be set
    // in a meta tag, so vercel.json sends it as a header.
    csp: {
      algorithm: "SHA-256",
      directives: [
        "default-src 'self'",
        "img-src 'self'",
        "font-src 'self'",
        "connect-src 'self'",
        "worker-src 'self'",
        "manifest-src 'self'",
        "object-src 'none'",
        "base-uri 'self'",
        "form-action 'self'",
      ],
      scriptDirective: { hashes: [themeHash] },
    },
  },
  vite: {
    server: {
      proxy: { "/api": process.env.API_PROXY_TARGET ?? "http://localhost:3001" },
    },
    build: { assetsInlineLimit: 0 },
  },
});
