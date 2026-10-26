import type { APIRoute } from "astro";
import { SITE } from "@workspace/proof-atlas-core/data/profile";
import { STATIC_ROUTES } from "../lib/routes";

export const GET: APIRoute = () => {
  const urls = STATIC_ROUTES.map(
    // No <lastmod>: pages have no reliable per-page modification date, and one shared date would be wrong for most.
    (path) => `  <url><loc>${new URL(path, SITE.url).toString()}</loc></url>`,
  ).join("\n");
  return new Response(`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`, {
    headers: { "Content-Type": "application/xml; charset=utf-8" },
  });
};
