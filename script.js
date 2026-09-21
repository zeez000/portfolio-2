(() => {
  "use strict";

  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const nav = document.querySelector("[data-nav]");
  const menuButton = document.querySelector(".menu-toggle");
  const navLinks = [...document.querySelectorAll("#primary-navigation a")];
  const progress = document.querySelector(".scroll-progress span");

  document.getElementById("year").textContent = new Date().getFullYear();

  menuButton?.addEventListener("click", () => {
    const open = nav.classList.toggle("open");
    menuButton.setAttribute("aria-expanded", String(open));
  });

  navLinks.forEach(link => link.addEventListener("click", () => {
    nav.classList.remove("open");
    menuButton?.setAttribute("aria-expanded", "false");
  }));

  const updateScroll = () => {
    const max = document.documentElement.scrollHeight - innerHeight;
    const ratio = max > 0 ? scrollY / max : 0;
    progress.style.width = `${ratio * 100}%`;
    nav.classList.toggle("scrolled", scrollY > 24);
  };
  addEventListener("scroll", updateScroll, { passive: true });
  updateScroll();

  const reveals = document.querySelectorAll(".reveal");
  if (reducedMotion || !("IntersectionObserver" in window)) {
    reveals.forEach(item => item.classList.add("visible"));
  } else {
    const revealObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
          revealObserver.unobserve(entry.target);
        }
      });
    }, { threshold: .12 });
    reveals.forEach(item => revealObserver.observe(item));
  }

  const sections = [...document.querySelectorAll("main section[id]")];
  const activateNav = () => {
    const current = sections.reduce((active, section) =>
      scrollY >= section.offsetTop - innerHeight * .35 ? section.id : active, "home");
    navLinks.forEach(link => link.classList.toggle("active", link.hash === `#${current}`));
  };
  addEventListener("scroll", activateNav, { passive: true });
  activateNav();

  const canvas = document.getElementById("network-background");
  const ctx = canvas.getContext("2d");
  let width = 0;
  let height = 0;
  let dpr = 1;
  let nodes = [];
  let animationFrame = 0;
  const pointer = { x: -1000, y: -1000 };

  const resize = () => {
    dpr = Math.min(devicePixelRatio || 1, 2);
    width = innerWidth;
    height = innerHeight;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const count = Math.max(24, Math.min(68, Math.floor(width * height / 28000)));
    nodes = Array.from({ length: count }, (_, index) => ({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - .5) * .16,
      vy: (Math.random() - .5) * .16,
      r: index % 7 === 0 ? 1.8 : 1,
      phase: Math.random()
    }));
  };

  const draw = time => {
    ctx.clearRect(0, 0, width, height);
    const maxDistance = Math.min(190, width * .18);

    nodes.forEach((node, index) => {
      if (!reducedMotion) {
        node.x += node.vx;
        node.y += node.vy;
        if (node.x < -20) node.x = width + 20;
        if (node.x > width + 20) node.x = -20;
        if (node.y < -20) node.y = height + 20;
        if (node.y > height + 20) node.y = -20;
      }

      const pointerDistance = Math.hypot(node.x - pointer.x, node.y - pointer.y);
      if (pointerDistance < 170 && !reducedMotion) {
        const force = (170 - pointerDistance) / 170;
        node.x += (node.x - pointer.x) * force * .006;
        node.y += (node.y - pointer.y) * force * .006;
      }

      for (let j = index + 1; j < nodes.length; j++) {
        const other = nodes[j];
        const distance = Math.hypot(node.x - other.x, node.y - other.y);
        if (distance < maxDistance) {
          const alpha = (1 - distance / maxDistance) * .16;
          ctx.strokeStyle = `rgba(128, 154, 170, ${alpha})`;
          ctx.lineWidth = .65;
          ctx.beginPath();
          ctx.moveTo(node.x, node.y);
          ctx.lineTo(other.x, other.y);
          ctx.stroke();

          if ((index + j) % 17 === 0) {
            const t = reducedMotion ? node.phase : (time * .00008 + node.phase) % 1;
            const px = node.x + (other.x - node.x) * t;
            const py = node.y + (other.y - node.y) * t;
            ctx.fillStyle = "rgba(92, 225, 255, .75)";
            ctx.beginPath();
            ctx.arc(px, py, 1.3, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      }

      ctx.fillStyle = node.r > 1 ? "rgba(92, 225, 255, .7)" : "rgba(205, 218, 228, .32)";
      ctx.beginPath();
      ctx.arc(node.x, node.y, node.r, 0, Math.PI * 2);
      ctx.fill();
    });

    if (!reducedMotion) animationFrame = requestAnimationFrame(draw);
  };

  addEventListener("resize", () => { cancelAnimationFrame(animationFrame); resize(); draw(performance.now()); }, { passive: true });
  addEventListener("pointermove", event => { pointer.x = event.clientX; pointer.y = event.clientY; }, { passive: true });
  addEventListener("pointerleave", () => { pointer.x = -1000; pointer.y = -1000; }, { passive: true });
  resize();
  draw(performance.now());
})();
