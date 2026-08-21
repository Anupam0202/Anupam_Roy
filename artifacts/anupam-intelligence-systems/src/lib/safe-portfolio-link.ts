const SAFE_PORTFOLIO_HOSTS = new Set([
  "achieve.snowflake.com",
  "anupam-roy.vercel.app",
  "credentials.databricks.com",
  "github.com",
  "learn.microsoft.com",
  "learn.mongodb.com",
  "verify.skilljar.com",
  "www.codechef.com",
  "www.credly.com",
  "www.linkedin.com",
]);

const PORTFOLIO_EMAIL = "mailto:anupam020202@gmail.com";
const SECTION_REFERENCE = /^#[a-z][a-z0-9-]*$/i;

export function isSafePortfolioHref(href?: string): href is string {
  if (!href) return false;
  if (SECTION_REFERENCE.test(href)) return true;
  if (href.toLowerCase() === PORTFOLIO_EMAIL) return true;

  try {
    const url = new URL(href);
    return (
      url.protocol === "https:" &&
      url.username === "" &&
      url.password === "" &&
      SAFE_PORTFOLIO_HOSTS.has(url.hostname.toLowerCase())
    );
  } catch {
    return false;
  }
}
