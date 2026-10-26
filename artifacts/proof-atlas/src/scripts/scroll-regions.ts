/**
 * Wide tables, code and drawings scroll sideways on small screens. While an
 * element actually overflows, make it reachable by keyboard (WCAG 2.1.1) and
 * give it a name; remove that again when it fits, so desktop users do not get
 * extra tab stops. Islands render later, so DOM changes are watched too.
 */
const SELECTOR = ".table-wrap, pre, .graph-wrap, .graph-lab, .formula-text";

function label(el: HTMLElement): string {
  const caption = el.querySelector("caption")?.textContent?.trim();
  return caption ? `${caption} (scrollable)` : "Scrollable content";
}

function update() {
  document.querySelectorAll<HTMLElement>(SELECTOR).forEach((el) => {
    const managed = el.dataset.scrollRegion === "auto";
    const overflows = el.scrollWidth > el.clientWidth + 1;
    if (overflows && !el.hasAttribute("tabindex")) {
      el.tabIndex = 0;
      if (!el.hasAttribute("role")) el.setAttribute("role", "region");
      if (!el.hasAttribute("aria-label")) el.setAttribute("aria-label", label(el));
      el.dataset.scrollRegion = "auto";
    } else if (!overflows && managed) {
      el.removeAttribute("tabindex");
      el.removeAttribute("role");
      el.removeAttribute("aria-label");
      delete el.dataset.scrollRegion;
    }
  });
}

let queued = false;
const schedule = () => {
  if (queued) return;
  queued = true;
  requestAnimationFrame(() => {
    queued = false;
    update();
  });
};

schedule();
addEventListener("resize", schedule);
new MutationObserver(schedule).observe(document.body, { childList: true, subtree: true });
