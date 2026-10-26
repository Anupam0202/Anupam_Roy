import { SITE, profile } from "@workspace/proof-atlas-core/data/profile";
import { reviewedTreeUrl, type Project } from "@workspace/proof-atlas-core/data/projects";

/** schema.org SoftwareSourceCode for a case study, pointing at the commit that was reviewed. */
export function softwareSourceCodeLd(p: Project) {
  return {
    "@context": "https://schema.org",
    "@type": "SoftwareSourceCode",
    name: p.name,
    description: p.oneLiner,
    codeRepository: p.repository.url,
    url: new URL(`/portfolio/${p.slug}/`, SITE.url).toString(),
    keywords: p.tech.join(", "),
    author: { "@type": "Person", name: profile.name, url: SITE.url },
    ...(p.repository.license ? { license: `https://spdx.org/licenses/${p.repository.license}.html` } : {}),
    sameAs: reviewedTreeUrl(p),
  };
}

/** A meta description between 70 and 160 characters for a project page. */
export function caseDescription(p: Project): string {
  const base = `${p.name}: ${p.oneLiner}`;
  const full = base.length >= 70 ? base : `${base} A case study linked to the commit that was reviewed.`;
  return full.length <= 160 ? full : `${full.slice(0, 157).replace(/\s+\S*$/, "")}…`;
}
