/**
 * Minimal matcher for the route patterns used in vercel.json, shared by the
 * local preview server and the configuration tests.
 */

/**
 * Compiles the subset of Vercel's path-to-regexp syntax this project uses:
 * literal text, :name, :name* and raw regex groups "( … )".
 */
export function compileSource(source) {
  let pattern = "";
  const names = [];
  for (let i = 0; i < source.length; ) {
    const ch = source[i];
    if (ch === "(") {
      let depth = 0;
      let j = i;
      for (; j < source.length; j += 1) {
        if (source[j] === "\\") {
          j += 1;
          continue;
        }
        if (source[j] === "(") depth += 1;
        if (source[j] === ")" && --depth === 0) break;
      }
      pattern += source.slice(i, j + 1);
      names.push(String(names.filter((n) => /^\d+$/.test(n)).length + 1));
      i = j + 1;
    } else if (ch === ":") {
      const name = /^[A-Za-z0-9_]+/.exec(source.slice(i + 1))[0];
      i += 1 + name.length;
      if (source[i] === "*") {
        pattern += "(.*)";
        i += 1;
      } else pattern += "([^/#?]+?)";
      names.push(name);
    } else {
      pattern += ch.replace(/[.*+?^${}|[\]\\/]/g, "\\$&");
      i += 1;
    }
  }
  return { regex: new RegExp(`^${pattern}$`), names };
}

export function match(source, pathname) {
  const { regex, names } = compileSource(source);
  const m = regex.exec(pathname);
  if (!m) return null;
  return Object.fromEntries(names.map((n, idx) => [n, m[idx + 1] ?? ""]));
}

export function fill(destination, params) {
  return destination.replace(/\$(\d+)|:([A-Za-z0-9_]+)\*?/g, (_, num, name) => params[num ?? name] ?? "");
}

/** Returns the redirect target for a path, or null, applying rules in order like Vercel. */
export function redirectFor(redirects, pathname) {
  for (const r of redirects) {
    const params = match(r.source, pathname);
    if (params) return { destination: fill(r.destination, params), permanent: Boolean(r.permanent) };
  }
  return null;
}
