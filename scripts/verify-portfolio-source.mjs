import assert from "node:assert/strict";
import { access, readFile, readdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const frontend = path.join(root, "artifacts", "anupam-intelligence-systems");
const sourceRoot = path.join(frontend, "src");
const readRoot = (relative) => readFile(path.join(root, relative), "utf8");
const exists = async (candidate) =>
  access(candidate)
    .then(() => true)
    .catch(() => false);

async function walk(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...(await walk(absolute)));
    else files.push(absolute);
  }
  return files;
}

const [
  indexHtml,
  home,
  hero,
  entrySignal,
  achievementsData,
  executive,
  boundary,
  styles,
  fallbackStyles,
  boot,
  certifications,
  vercelRaw,
  packageRaw,
  robots,
  notFound,
] = await Promise.all([
  readRoot("artifacts/anupam-intelligence-systems/index.html"),
  readRoot("artifacts/anupam-intelligence-systems/src/pages/home.tsx"),
  readRoot(
    "artifacts/anupam-intelligence-systems/src/components/hero/hero-section.tsx",
  ),
  readRoot(
    "artifacts/anupam-intelligence-systems/src/components/hero/portfolio-entry-signal.tsx",
  ),
  readRoot("artifacts/anupam-intelligence-systems/src/data/achievements.ts"),
  readRoot(
    "artifacts/anupam-intelligence-systems/src/components/sections/executive-view.tsx",
  ),
  readRoot(
    "artifacts/anupam-intelligence-systems/src/components/errors/error-boundary.tsx",
  ),
  readRoot("artifacts/anupam-intelligence-systems/src/index.css"),
  readRoot("artifacts/anupam-intelligence-systems/public/fallback.css"),
  readRoot("artifacts/anupam-intelligence-systems/public/boot.js"),
  readRoot("artifacts/anupam-intelligence-systems/src/data/certifications.ts"),
  readRoot("vercel.json"),
  readRoot("package.json"),
  readRoot("artifacts/anupam-intelligence-systems/public/robots.txt"),
  readRoot("artifacts/anupam-intelligence-systems/public/404.html"),
]);

const vercel = JSON.parse(vercelRaw);
const pkg = JSON.parse(packageRaw);
assert.equal(pkg.packageManager, "pnpm@10.34.5");
assert.match(pkg.engines.node, />=22\.12\.0/);
assert.match(indexHtml, /class="boot-fallback"/);
assert.match(indexHtml, /<script src="\/boot\.js"><\/script>/);
assert.match(indexHtml, /mailto:anupam020202@gmail\.com/);
assert.doesNotMatch(indexHtml, /fonts\.(?:googleapis|gstatic)/);
assert.match(fallbackStyles, /\.js:not\(\.boot-failed\) \.boot-fallback/);
assert.match(boot, /boot-failed/);
assert.match(home, /ResilientSection/);
assert.match(home, /data-portfolio-shell/);
assert.match(home, /PortfolioEntrySignal/);
assert.match(home, /shouldAutoOpenEntrySignal/);
assert.match(boundary, /componentDidCatch/);
assert.match(boundary, /\/api\/client-error/);
assert.equal((hero.match(/<h1\b/g) ?? []).length, 1);
assert.equal((entrySignal.match(/<h1\b/g) ?? []).length, 0);
assert.match(entrySignal, /useReducedMotion/);
assert.match(entrySignal, /aria-modal="true"/);
assert.match(achievementsData, /CodeChef 5-Star tier/);
assert.match(achievementsData, /value: "5★"/);
assert.match(achievementsData, /value: "2109"/);
assert.match(achievementsData, /codechef\.com\/users\/anupam_roy/);
assert.doesNotMatch(achievementsData, /CodeChef 2-Star|2★/);
assert.equal((executive.match(/<h1\b/g) ?? []).length, 0);
assert.doesNotMatch(styles, /\[class\*=["']tracking-/);
assert.match(styles, /prefers-reduced-motion/);
assert.match(robots, /Disallow: \/certs\//);
assert.match(notFound, /noindex,nofollow/);
assert.equal(
  vercel.rewrites.length,
  1,
  "Only the API rewrite is allowed; unknown routes must return a real 404.",
);
assert.match(vercelRaw, /Content-Security-Policy/);
assert.match(vercelRaw, /noindex, noarchive/);

const [recognitionLedger, enterpriseFlow, consultant, safePortfolioLink] =
  await Promise.all([
    readRoot(
      "artifacts/anupam-intelligence-systems/src/components/sections/premium-achievements.tsx",
    ),
    readRoot(
      "artifacts/anupam-intelligence-systems/src/components/systems/enterprise-flow.tsx",
    ),
    readRoot(
      "artifacts/anupam-intelligence-systems/src/components/assistant/consult-system.tsx",
    ),
    readRoot(
      "artifacts/anupam-intelligence-systems/src/lib/safe-portfolio-link.ts",
    ),
  ]);
assert.match(recognitionLedger, /grid items-start/);
assert.match(recognitionLedger, /figure className="self-start/);
assert.match(enterpriseFlow, /initial=\{false\}/);
assert.doesNotMatch(enterpriseFlow, /whileInView/);
assert.match(consultant, /Portfolio-grounded only · no invented claims/);
assert.match(consultant, /role="log"/);
assert.match(consultant, /isSafePortfolioHref/);
assert.match(safePortfolioLink, /SAFE_PORTFOLIO_HOSTS/);
assert.match(safePortfolioLink, /url\.protocol === "https:"/);

for (const relative of [
  "artifacts/anupam-intelligence-systems/src/components/motion/magnetic-button.tsx",
  "artifacts/anupam-intelligence-systems/src/components/shared/neural-particles.tsx",
  "artifacts/anupam-intelligence-systems/src/components/telemetry/telemetry-strip.tsx",
  "FINAL_RELEASE_REPORT.md",
  "FINAL_V2_RELEASE_REPORT.md",
  "IMPLEMENTATION_NOTES.md",
  "LOCKFILE_INTEGRITY_FIX.md",
  "RELEASE_GATE_FIXES.md",
  "V3-RELEASE-NOTES.md",
]) {
  assert.equal(
    await exists(path.join(root, relative)),
    false,
    `Obsolete repository artifact remains: ${relative}`,
  );
}

const sourceFiles = (await walk(sourceRoot)).filter((file) =>
  /\.(?:ts|tsx)$/.test(file),
);
const sourceText = (
  await Promise.all(sourceFiles.map((file) => readFile(file, "utf8")))
).join("\n");
assert.doesNotMatch(
  sourceText,
  /SynapseOps|Hybrid Synapse|Synapse Core|SystemTimeDock|HybridSynapseLaunch|useIntroSession/i,
);
assert.doesNotMatch(
  sourceText,
  /setInterval|repeat:\s*Infinity|animate-ping|text-\[(?:8|9|10|11)px\]|architecture\.slice/,
);
assert.doesNotMatch(sourceText, /verified credentials/i);

for (const relative of [
  "src/components/hero/portfolio-entry-signal.tsx",
  "src/components/sections/executive-view.tsx",
  "src/components/certifications/certifications-vault.tsx",
  "src/components/assistant/consult-system.tsx",
]) {
  const content = await readFile(path.join(frontend, relative), "utf8");
  assert.match(content, /aria-modal="true"/);
  assert.match(content, /acquirePortfolioShellInert/);
}

for (const file of sourceFiles.filter((item) => item.endsWith(".tsx"))) {
  const content = await readFile(file, "utf8");
  for (const tag of content.match(/<a\b[^>]*target="_blank"[^>]*>/gs) ?? []) {
    assert.match(
      tag,
      /rel="[^"]*(?:noreferrer|noopener)/,
      `External link missing rel protection in ${path.relative(root, file)}`,
    );
  }
}

const pdfNames = [
  ...certifications.matchAll(/"([^"]+\.pdf)"\s*,\s*"https?:\/\//g),
].map((match) => match[1]);
assert.equal(pdfNames.length, 74);
for (const pdf of pdfNames) {
  assert.equal(
    await exists(path.join(frontend, "public", "certs", pdf)),
    true,
    `Missing certificate: ${pdf}`,
  );
  assert.equal(
    await exists(
      path.join(
        frontend,
        "public",
        "cert-thumbs",
        pdf.replace(/\.pdf$/, ".webp"),
      ),
    ),
    true,
    `Missing thumbnail: ${pdf}`,
  );
}

const importPatterns = [
  /from\s+["']([^"']+)["']/g,
  /import\(\s*["']([^"']+)["']\s*\)/g,
];
for (const file of sourceFiles) {
  const content = await readFile(file, "utf8");
  const specs = importPatterns.flatMap((pattern) =>
    [...content.matchAll(pattern)].map((match) => match[1]),
  );
  for (const spec of specs) {
    if (!(
      spec.startsWith("@/") ||
      spec.startsWith("./") ||
      spec.startsWith("../")
    ))
      continue;
    const base = spec.startsWith("@/")
      ? path.join(sourceRoot, spec.slice(2))
      : path.resolve(path.dirname(file), spec);
    const candidates = [
      base,
      `${base}.ts`,
      `${base}.tsx`,
      `${base}.js`,
      path.join(base, "index.ts"),
      path.join(base, "index.tsx"),
    ];
    assert.equal(
      (await Promise.all(candidates.map(exists))).some(Boolean),
      true,
      `Missing local import ${spec} from ${path.relative(root, file)}`,
    );
  }
}

const [
  finalCredentialData,
  finalRevealMask,
  finalWorkspacePolicy,
  finalLockfile,
] = await Promise.all([
  readRoot("artifacts/anupam-intelligence-systems/src/data/certifications.ts"),
  readRoot(
    "artifacts/anupam-intelligence-systems/src/components/motion/reveal-mask.tsx",
  ),
  readRoot("pnpm-workspace.yaml"),
  readRoot("pnpm-lock.yaml"),
]);

assert.match(
  finalCredentialData,
  /export const FEATURED_CERT_NAMES = \[[\s\S]*\] as const;/,
);
assert.doesNotMatch(finalCredentialData, /FEATURED_CERT_NAMES = new Set/);
assert.match(finalRevealMask, /delay\?: number/);
assert.match(finalRevealMask, /useReducedMotion/);
assert.match(finalWorkspacePolicy, /body-parser: 2\.3\.0/);
assert.match(finalWorkspacePolicy, /protobufjs: 7\.6\.5/);
assert.match(
  finalWorkspacePolicy,
  /ignoredBuiltDependencies:[\s\S]*["']@google\/genai["'][\s\S]*protobufjs/,
);
assert.match(finalLockfile, /body-parser@2\.3\.0/);
assert.match(finalLockfile, /protobufjs@7\.6\.5/);
const protobufjsResolution = finalLockfile.match(
  /protobufjs@7\.6\.5:\n\s+resolution: \{integrity: ([^}]+)\}/,
);
assert.equal(
  protobufjsResolution?.[1],
  "sha512-/FPD0nUc9jH6rfFjji9IBqOz4pcSE3CsT1m7Ep6Mdb0LxSUMj8hgl6GomOvZzpNpAqqGaXA0P3VSrZLFzIhQrw==",
);
assert.doesNotMatch(finalLockfile, /body-parser@2\.2\.2/);
assert.doesNotMatch(finalLockfile, /protobufjs@7\.6\.3/);

console.log(
  `Portfolio source verification passed: ${sourceFiles.length} source files, 74 credential records, static architecture rendering, safe consultant links, secure dependency pins, and protected entry/modal flows.`,
);
