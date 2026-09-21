(() => {
  "use strict";

  if (!matchMedia("(pointer:fine)").matches || matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  const root = document.documentElement;
  root.classList.add("cursor-enabled");

  const dot = document.createElement("div");
  dot.className = "fx-cursor-dot";
  const shell = document.createElement("div");
  shell.className = "fx-cursor-shell";
  document.body.append(dot, shell);

  const mouse = { x: -100, y: -100 };
  const dotPos = { x: -100, y: -100 };
  const shellPos = { x: -100, y: -100 };

  let active = null;
  let rect = null;
  let targetW = 34;
  let targetH = 34;
  let targetRadius = 17;
  let raf = 0;

  const candidates = () => [...document.querySelectorAll(
    'a, button, [data-cursor-magnet], .portal-card, .page-cta, .contact-actions a, .project-world a, .tech-orbit button'
  )].filter(el => !el.hasAttribute("disabled") && el.offsetParent !== null);

  const expandedHit = (r, pad = 26) =>
    mouse.x >= r.left - pad &&
    mouse.x <= r.right + pad &&
    mouse.y >= r.top - pad &&
    mouse.y <= r.bottom + pad;

  const distanceToRect = r => {
    const dx = Math.max(r.left - mouse.x, 0, mouse.x - r.right);
    const dy = Math.max(r.top - mouse.y, 0, mouse.y - r.bottom);
    return Math.hypot(dx, dy);
  };

  const chooseTarget = () => {
    let best = null;
    let bestRect = null;
    let bestDist = Infinity;

    for (const el of candidates()) {
      if (el.id === "blackhole-trigger") continue;
      const r = el.getBoundingClientRect();
      if (!expandedHit(r, 30)) continue;
      const d = distanceToRect(r);
      if (d < bestDist) {
        best = el;
        bestRect = r;
        bestDist = d;
      }
    }
    active = best;
    rect = bestRect;
  };

  const updateMagnetVisual = () => {
    document.querySelectorAll(".cursor-magnet").forEach(el => {
      if (el !== active) {
        el.classList.remove("cursor-magnet");
        el.style.transform = "";
      }
    });

    if (!active || !rect) {
      root.classList.remove("cursor-magnetic");
      targetW = 34;
      targetH = 34;
      targetRadius = 17;
      return;
    }

    root.classList.add("cursor-magnetic");
    active.classList.add("cursor-magnet");

    targetW = Math.max(38, rect.width + 14);
    targetH = Math.max(34, rect.height + 12);

    const cs = getComputedStyle(active);
    const br = parseFloat(cs.borderTopLeftRadius) || 0;
    targetRadius = Math.min(Math.max(br + 6, 12), targetH / 2);

    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const nx = Math.max(-1, Math.min(1, (mouse.x - cx) / Math.max(rect.width / 2, 1)));
    const ny = Math.max(-1, Math.min(1, (mouse.y - cy) / Math.max(rect.height / 2, 1)));

    active.style.transform = `translate3d(${nx * 4}px,${ny * 4}px,0)`;
  };

  const animate = () => {
    chooseTarget();
    updateMagnetVisual();

    dotPos.x += (mouse.x - dotPos.x) * .62;
    dotPos.y += (mouse.y - dotPos.y) * .62;

    let sx = mouse.x;
    let sy = mouse.y;

    if (active && rect) {
      sx = rect.left + rect.width / 2;
      sy = rect.top + rect.height / 2;
    }

    shellPos.x += (sx - shellPos.x) * (active ? .22 : .16);
    shellPos.y += (sy - shellPos.y) * (active ? .22 : .16);

    dot.style.transform = `translate3d(${dotPos.x}px,${dotPos.y}px,0) translate(-50%,-50%)`;
    shell.style.transform = `translate3d(${shellPos.x}px,${shellPos.y}px,0) translate(-50%,-50%)`;

    shell.style.width = targetW + "px";
    shell.style.height = targetH + "px";
    shell.style.borderRadius = targetRadius + "px";

    raf = requestAnimationFrame(animate);
  };

  addEventListener("pointermove", e => {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
    root.classList.add("cursor-visible");
  }, { passive: true });

  addEventListener("pointerleave", () => {
    root.classList.remove("cursor-visible","cursor-magnetic","cursor-hole");
    active = null;
    rect = null;
  }, { passive: true });

  const hole = document.getElementById("blackhole-trigger");
  if (hole) {
    hole.addEventListener("pointerenter", () => {
      root.classList.add("cursor-hole");
      root.classList.remove("cursor-magnetic");
    });
    hole.addEventListener("pointerleave", () => {
      root.classList.remove("cursor-hole");
    });
  }

  addEventListener("resize", () => {
    active = null;
    rect = null;
  }, { passive: true });

  cancelAnimationFrame(raf);
  animate();
})();