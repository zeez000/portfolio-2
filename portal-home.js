(() => {
  "use strict";

  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const portal = document.getElementById("portal");
  const site = document.getElementById("site");
  const links = [...document.querySelectorAll(".portal-link")];

  if (!portal || !site) return;

  portal.addEventListener("pointermove", e => {
    if (reduced) return;
    const r = portal.getBoundingClientRect();
    const nx = (e.clientX - (r.left + r.width/2)) / (r.width/2);
    const ny = (e.clientY - (r.top + r.height/2)) / (r.height/2);
    portal.style.setProperty("--mx", nx.toFixed(3));
    portal.style.setProperty("--my", ny.toFixed(3));
  });

  portal.addEventListener("click", () => {
    if (document.body.classList.contains("entering") || document.body.classList.contains("entered")) return;

    document.body.classList.add("entering");

    if (reduced) {
      document.body.classList.add("entered");
      site.setAttribute("aria-hidden","false");
      return;
    }

    setTimeout(() => {
      document.body.classList.add("entered");
      site.setAttribute("aria-hidden","false");
    }, 760);
  });

  links.forEach(link => {
    link.addEventListener("click", e => {
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const href = link.getAttribute("href");
      if (!href) return;

      e.preventDefault();
      document.body.classList.add("page-leaving");

      setTimeout(() => {
        location.href = href;
      }, reduced ? 20 : 650);
    });
  });
})();