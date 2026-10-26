/**
 * Short commit SHA of the running build: Vercel's system variable, then
 * GitHub Actions', else null (a local build).
 */
export function releaseSha(env: Record<string, string | undefined>): string | null {
  const sha = (env.VERCEL_GIT_COMMIT_SHA ?? env.GITHUB_SHA ?? "").trim();
  return /^[0-9a-f]{7,40}$/i.test(sha) ? sha.slice(0, 7).toLowerCase() : null;
}
