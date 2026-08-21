document.documentElement.classList.add("js");
window.__portfolioBootTimer = window.setTimeout(
  () => document.documentElement.classList.add("boot-failed"),
  1800,
);
