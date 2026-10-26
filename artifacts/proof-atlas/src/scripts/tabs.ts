/**
 * Progressive ARIA tabs. Markup: [data-tabs] containing a [role=tablist]
 * (rendered `hidden`) with [role=tab] buttons, and [role=tabpanel] panels.
 * Without JavaScript the tablist stays hidden and every panel is shown.
 */
export function initTabs(root: ParentNode = document) {
  root.querySelectorAll<HTMLElement>("[data-tabs]").forEach((container) => {
    const list = container.querySelector<HTMLElement>("[role=tablist]");
    const tabs = [...container.querySelectorAll<HTMLButtonElement>("[role=tab]")];
    const panels = tabs.map((t) => document.getElementById(t.getAttribute("aria-controls") ?? ""));
    if (!list || !tabs.length || panels.some((p) => !p)) return;
    list.hidden = false;
    container.classList.add("tabs-ready");

    /** Shows one panel. Only a visitor's choice writes the URL, and the default tab leaves no parameter. */
    const select = (index: number, focus: boolean, fromUser: boolean) => {
      tabs.forEach((tab, i) => {
        const active = i === index;
        tab.setAttribute("aria-selected", String(active));
        tab.tabIndex = active ? 0 : -1;
        panels[i]!.hidden = !active;
      });
      if (focus) tabs[index].focus();
      const key = container.dataset.tabsParam;
      if (key && fromUser) {
        const url = new URL(location.href);
        if (index === 0) url.searchParams.delete(key);
        else url.searchParams.set(key, tabs[index].dataset.value ?? String(index));
        history.replaceState(null, "", url);
      }
    };

    tabs.forEach((tab, i) => {
      tab.addEventListener("click", () => select(i, false, true));
      tab.addEventListener("keydown", (event) => {
        const last = tabs.length - 1;
        const next =
          event.key === "ArrowRight" ? (i === last ? 0 : i + 1)
          : event.key === "ArrowLeft" ? (i === 0 ? last : i - 1)
          : event.key === "Home" ? 0
          : event.key === "End" ? last
          : -1;
        if (next < 0) return;
        event.preventDefault();
        select(next, true, true);
      });
    });

    const key = container.dataset.tabsParam;
    const url = new URL(location.href);
    const wanted = key ? url.searchParams.get(key) : null;
    const found = tabs.findIndex((t) => t.dataset.value === wanted);
    select(Math.max(0, found), false, false);
    // An unknown value is dropped rather than replaced with a default.
    if (key && wanted !== null && found === -1) {
      url.searchParams.delete(key);
      history.replaceState(null, "", url);
    }
  });
}
