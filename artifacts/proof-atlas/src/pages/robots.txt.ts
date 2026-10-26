import type { APIRoute } from "astro";
import { SITE } from "@workspace/proof-atlas-core/data/profile";

export const GET: APIRoute = () =>
  new Response(`User-agent: *\nAllow: /\nDisallow: /certs/\nDisallow: /api/\n\nSitemap: ${SITE.url}/sitemap.xml\n`, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
