/**
 * Inline script that applies a saved theme before first paint. Astro hashes
 * its own bundled scripts for the Content-Security-Policy meta tag, but not
 * inline ones, so astro.config.mjs adds this script's SHA-256 hash. It also
 * points the browser's theme-color at the saved theme, so the browser UI
 * matches the page rather than the operating system setting.
 */
export const THEME_INIT_SCRIPT =
  '(function(){try{var t=localStorage.getItem("pa-theme");if(t==="light"||t==="dark"){document.documentElement.dataset.theme=t;var m=document.querySelectorAll(\'meta[name="theme-color"]\');for(var i=0;i<m.length;i++)m[i].setAttribute("content",t==="dark"?"#111a18":"#f2f0e8")}}catch(e){}})();';

/** Browser UI colours for each theme (the paper token). */
export const THEME_COLOR = { light: "#f2f0e8", dark: "#111a18" } as const;
