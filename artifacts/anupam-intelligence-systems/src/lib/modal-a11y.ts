let activeModalCount = 0;
let previousAriaHidden: string | null = null;
let previouslyInert = false;
export function acquirePortfolioShellInert() {
  const shell = document.querySelector<HTMLElement>("[data-portfolio-shell]");
  if (!shell) return () => undefined;
  if (activeModalCount === 0) {
    previousAriaHidden = shell.getAttribute("aria-hidden");
    previouslyInert = shell.hasAttribute("inert");
    shell.setAttribute("aria-hidden", "true");
    shell.setAttribute("inert", "");
  }
  activeModalCount += 1;
  let released = false;
  return () => {
    if (released) return;
    released = true;
    activeModalCount = Math.max(0, activeModalCount - 1);
    if (activeModalCount) return;
    if (previousAriaHidden === null) shell.removeAttribute("aria-hidden");
    else shell.setAttribute("aria-hidden", previousAriaHidden);
    if (!previouslyInert) shell.removeAttribute("inert");
  };
}
