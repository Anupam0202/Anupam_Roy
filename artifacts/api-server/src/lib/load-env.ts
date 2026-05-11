import { config } from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";

const currentDir = path.dirname(fileURLToPath(import.meta.url));
const packageRoot = path.resolve(currentDir, "..");
const workspaceRoot = path.resolve(packageRoot, "../..");

const candidatePaths = [
  path.resolve(workspaceRoot, ".env"),
  path.resolve(packageRoot, ".env"),
  path.resolve(process.cwd(), ".env"),
];

const uniquePaths = Array.from(new Set(candidatePaths));

for (const envPath of uniquePaths) {
  config({ path: envPath, override: false, quiet: true });
}
