(() => {
  "use strict";

  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const boot = document.querySelector(".boot-screen");
  const nav = document.querySelector("[data-nav]");
  const progress = document.querySelector(".scroll-progress span");
  const phaseLabel = document.getElementById("phase-label");
  const modeValue = document.getElementById("mode-value");
  const glow = document.querySelector(".cursor-glow");
  const logBox = document.getElementById("log-lines");
  const flowToast = document.getElementById("event-toast");
  const flowStatus = document.getElementById("flow-status");

  document.getElementById("year").textContent = new Date().getFullYear();

  if (!reduced) setTimeout(() => boot?.classList.add("done"), 1450);
  else boot?.classList.add("done");

  const phases = [
    { id: "home", label: "DISCOVER" },
    { id: "about", label: "BUILD" },
    { id: "stack", label: "CONNECT" },
    { id: "projects", label: "DEPLOY" },
    { id: "contact", label: "AVAILABLE" }
  ];

  const updateScroll = () => {
    const max = document.documentElement.scrollHeight - innerHeight;
    const ratio = max > 0 ? scrollY / max : 0;
    progress.style.width = `${ratio * 100}%`;
    nav?.classList.toggle("scrolled", scrollY > 30);

    let phase = phases[0];
    for (const item of phases) {
      const section = document.getElementById(item.id);
      if (section && scrollY >= section.offsetTop - innerHeight * .42) phase = item;
    }
    if (phaseLabel) phaseLabel.textContent = phase.label;
    if (modeValue) modeValue.textContent = phase.label;
    document.body.dataset.phase = phase.label.toLowerCase();

    document.querySelectorAll("nav a").forEach(link => {
      link.classList.toggle("active", link.hash === `#${phase.id}`);
    });
  };
  addEventListener("scroll", updateScroll, { passive: true });
  updateScroll();

  addEventListener("pointermove", e => {
    if (!glow || reduced) return;
    glow.style.left = `${e.clientX}px`;
    glow.style.top = `${e.clientY}px`;
  }, { passive: true });

  const logMessages = [
    "container healthcheck passed",
    "kafka broker connected",
    "order.created event received",
    "inventory reservation complete",
    "docker network ready",
    "git workflow synchronized",
    "aws region handshake ok",
    "pipeline stage passed",
    "service discovery refreshed",
    "mongodb connection healthy"
  ];
  let logIndex = 0;
  const pushLog = () => {
    if (!logBox) return;
    const time = new Date().toLocaleTimeString([], { hour12:false, hour:"2-digit", minute:"2-digit", second:"2-digit" });
    const row = document.createElement("p");
    row.innerHTML = `<b>${time}</b>${logMessages[logIndex % logMessages.length]}`;
    logIndex++;
    logBox.prepend(row);
    while (logBox.children.length > 4) logBox.lastElementChild.remove();
  };
  for (let i = 0; i < 4; i++) pushLog();
  if (!reduced) setInterval(pushLog, 2200);

  const techNodes = [...document.querySelectorAll(".tech-node")];
  const detail = document.getElementById("stack-detail");
  techNodes.forEach(node => {
    node.addEventListener("mouseenter", () => {
      techNodes.forEach(n => n.classList.remove("active"));
      node.classList.add("active");
      if (detail) detail.textContent = `${node.textContent} // ${node.dataset.detail}`;
    });
    node.addEventListener("focus", () => {
      techNodes.forEach(n => n.classList.remove("active"));
      node.classList.add("active");
      if (detail) detail.textContent = `${node.textContent} // ${node.dataset.detail}`;
    });
  });

  if (!reduced) {
    setInterval(() => {
      flowToast?.classList.add("flash");
      if (flowStatus) flowStatus.textContent = "EVENT: order.created → kafka → inventory.reserve()";
      setTimeout(() => {
        flowToast?.classList.remove("flash");
        if (flowStatus) flowStatus.textContent = "SIMULATING: client → api → order → kafka → inventory";
      }, 1200);
    }, 5000);
  }

  const canvas = document.getElementById("infra-canvas");
  const ctx = canvas?.getContext("2d");
  if (!canvas || !ctx) return;

  let w = 0, h = 0, dpr = 1, raf = 0;
  const pointer = { x: -9999, y: -9999 };
  const labels = ["CLIENT","NGINX","API","PRODUCT","ORDER","KAFKA","INVENTORY","MONGODB","REDIS","AWS"];
  let nodes = [];
  let packets = [];

  const layouts = {
    discover: [
      [.10,.20],[.28,.16],[.48,.23],[.73,.16],[.86,.31],[.54,.47],[.78,.56],[.89,.76],[.54,.79],[.20,.69]
    ],
    build: [
      [.18,.28],[.33,.18],[.50,.27],[.70,.18],[.82,.34],[.50,.50],[.72,.60],[.84,.75],[.50,.78],[.23,.69]
    ],
    connect: [
      [.50,.08],[.22,.22],[.78,.22],[.12,.50],[.88,.50],[.50,.50],[.20,.78],[.80,.78],[.50,.90],[.50,.24]
    ],
    deploy: [
      [.08,.50],[.22,.50],[.36,.34],[.36,.67],[.52,.50],[.68,.50],[.85,.38],[.85,.62],[.68,.72],[.68,.18]
    ],
    available: [
      [.15,.20],[.35,.15],[.55,.18],[.75,.15],[.85,.35],[.68,.52],[.82,.72],[.55,.80],[.32,.76],[.18,.60]
    ]
  };

  const edges = [[0,1],[1,2],[2,3],[2,4],[3,5],[4,5],[5,6],[6,7],[6,8],[6,9],[9,7],[9,8]];

  const currentLayout = () => layouts[document.body.dataset.phase || "discover"] || layouts.discover;

  const resize = () => {
    dpr = Math.min(devicePixelRatio || 1, 2);
    w = innerWidth; h = innerHeight;
    canvas.width = w * dpr; canvas.height = h * dpr;
    canvas.style.width = `${w}px`; canvas.style.height = `${h}px`;
    ctx.setTransform(dpr,0,0,dpr,0,0);

    const layout = currentLayout();
    nodes = labels.map((label,i) => {
      const old = nodes[i];
      return {
        label,
        x: old?.x ?? layout[i][0]*w,
        y: old?.y ?? layout[i][1]*h,
        pulse: Math.random()*Math.PI*2
      };
    });
    packets = edges.slice(0,8).map((edge,i) => ({ edge, t:(i/8), speed:.000055 + (i%3)*.000012 }));
  };

  const draw = time => {
    ctx.clearRect(0,0,w,h);
    const layout = currentLayout();

    nodes.forEach((n,i) => {
      const tx = layout[i][0]*w, ty = layout[i][1]*h;
      n.x += (tx-n.x)*.025;
      n.y += (ty-n.y)*.025;
    });

    edges.forEach(([a,b],i) => {
      const A=nodes[a], B=nodes[b];
      const near = Math.min(Math.hypot(A.x-pointer.x,A.y-pointer.y),Math.hypot(B.x-pointer.x,B.y-pointer.y)) < 150;
      ctx.strokeStyle = near ? "rgba(98,245,255,.38)" : "rgba(98,245,255,.13)";
      ctx.lineWidth = near ? 1.1 : .7;
      ctx.setLineDash([5,8]);
      ctx.beginPath();ctx.moveTo(A.x,A.y);ctx.lineTo(B.x,B.y);ctx.stroke();
    });
    ctx.setLineDash([]);

    packets.forEach((p,i) => {
      if (!reduced) p.t = (p.t + p.speed * 16.67) % 1;
      const [a,b]=p.edge,A=nodes[a],B=nodes[b];
      const x=A.x+(B.x-A.x)*p.t, y=A.y+(B.y-A.y)*p.t;
      ctx.fillStyle="rgba(98,245,255,.95)";
      ctx.shadowColor="rgba(98,245,255,.8)";ctx.shadowBlur=12;
      ctx.beginPath();ctx.arc(x,y,2.2,0,Math.PI*2);ctx.fill();
      ctx.shadowBlur=0;
    });

    nodes.forEach((n,i) => {
      const dist=Math.hypot(n.x-pointer.x,n.y-pointer.y);
      const active=dist<120;
      const pulse=1+(Math.sin(time*.002+n.pulse)+1)*.35;
      ctx.fillStyle=active?"rgba(98,245,255,.95)":"rgba(98,245,255,.55)";
      ctx.beginPath();ctx.arc(n.x,n.y,active?4.5:2.5*pulse,0,Math.PI*2);ctx.fill();
      ctx.strokeStyle=active?"rgba(98,245,255,.42)":"rgba(98,245,255,.12)";
      ctx.beginPath();ctx.arc(n.x,n.y,active?22:11+pulse*3,0,Math.PI*2);ctx.stroke();

      if (w > 760) {
        ctx.font="500 9px JetBrains Mono, monospace";
        ctx.fillStyle=active?"rgba(238,247,248,.9)":"rgba(151,180,184,.42)";
        ctx.fillText(n.label,n.x+10,n.y-9);
      }
    });

    if (!reduced) raf=requestAnimationFrame(draw);
  };

  addEventListener("pointermove",e=>{pointer.x=e.clientX;pointer.y=e.clientY},{passive:true});
  addEventListener("pointerleave",()=>{pointer.x=-9999;pointer.y=-9999},{passive:true});
  addEventListener("resize",()=>{cancelAnimationFrame(raf);resize();draw(performance.now())},{passive:true});

  resize();
  draw(performance.now());
})();