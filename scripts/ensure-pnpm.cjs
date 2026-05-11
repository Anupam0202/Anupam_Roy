const fs = require("node:fs");

for (const lockFile of ["package-lock.json", "yarn.lock"]) {
  try {
    fs.rmSync(lockFile, { force: true });
  } catch {
    // Best-effort cleanup only.
  }
}

const userAgent = process.env.npm_config_user_agent || "";

if (!userAgent.startsWith("pnpm/")) {
  console.error("Use pnpm instead");
  process.exit(1);
}
