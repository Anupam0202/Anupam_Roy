import { projects } from "@workspace/proof-atlas-core/data/projects";

/** Every indexable page. The sitemap and the E2E route check both use this list. */
export const STATIC_ROUTES = [
  "/",
  "/portfolio/",
  ...projects.map((p) => `/portfolio/${p.slug}/`),
  "/workbench/",
  "/workbench/repository/",
  "/workbench/documents/",
  "/workbench/citations/",
  "/lab/",
  "/lab/retrieval-fusion/",
  "/lab/binary-search/",
  "/lab/architecture-xray/",
  "/lab/dijkstra/",
  "/experience/",
  "/credentials/",
  "/about/",
  "/contact/",
  "/sources/",
  "/privacy/",
] as const;
