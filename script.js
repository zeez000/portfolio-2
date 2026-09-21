(() => {
  "use strict";

  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const page = document.documentElement.dataset.page || "home";
  const canvas = document.getElementById("universe");
  const ctx = canvas?.getContext("2d");
  const enter = document.getElementById("enter-hole");
  const portalLinks = [...document.querySelectorAll(".portal-link")];
  const techButtons = [...document.querySelectorAll("#tech-orbit button")];
  const techDetail = document.getElementById("tech-detail");

  techButtons.forEach(button => {
    const activate = () => {
      techButtons.forEach(item => item.classList.remove("active"));
      button.classList.add("active");
      if (techDetail) techDetail.textContent = button.textContent + " // " + button.dataset.detail;
    };
    button.addEventListener("mouseenter", activate);
    button.addEventListener("focus", activate);
  });

  portalLinks.forEach(link => link.addEventListener("click", e => {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || link.target === "_blank") return;
    const href = link.getAttribute("href");
    if (!href || href.startsWith("#")) return;
    e.preventDefault();
    document.body.classList.add("transitioning");
    setTimeout(() => location.href = href, reduced ? 70 : 620);
  }));

  if (page === "home" && enter) {
    enter.addEventListener("click", () => {
      if (document.body.classList.contains("entered")) return;
      document.body.classList.add("entering");
      if (reduced) {
        document.body.classList.add("entered");
        return;
      }
      setTimeout(() => document.body.classList.add("entered"), 930);
    });
  } else {
    requestAnimationFrame(() => document.body.classList.add("ready"));
  }

  if (!canvas || !ctx) return;

  let width=0,height=0,dpr=1,frame=0;
  let particles=[];
  const pointer={x:-9999,y:-9999};
  const state={zoom:1,shiftX:0};

  const pageSettings={
    home:{x:.5,y:.5,scale:1.34,tilt:.34},
    profile:{x:.78,y:.55,scale:.86,tilt:.34},
    stack:{x:.19,y:.52,scale:.8,tilt:.34},
    projects:{x:.78,y:.43,scale:.84,tilt:.34},
    contact:{x:.19,y:.55,scale:.8,tilt:.34}
  };
  const settings=pageSettings[page] || pageSettings.home;

  const createParticle=(i=0)=>({
    angle:Math.random()*Math.PI*2,
    radius:.78+Math.random()*1.12,
    width:.45+Math.random()*2.1,
    speed:(.00022+Math.random()*.00058)*(Math.random()<.14?-1:1),
    phase:i*.43+Math.random()*Math.PI*2,
    heat:Math.random(),
    wobble:Math.random()*Math.PI*2
  });

  const colorFor=(p,a)=>{
    if (p.heat<.2) return `rgba(104,226,255,${a})`;
    if (p.heat<.38) return `rgba(127,89,255,${a})`;
    if (p.heat<.58) return `rgba(255,67,174,${a})`;
    if (p.heat<.8) return `rgba(255,83,52,${a})`;
    return `rgba(255,214,107,${a})`;
  };

  const resize=()=>{
    dpr=Math.min(devicePixelRatio||1,2);
    width=innerWidth;height=innerHeight;
    canvas.width=Math.max(1,Math.floor(width*dpr));
    canvas.height=Math.max(1,Math.floor(height*dpr));
    canvas.style.width=width+"px";
    canvas.style.height=height+"px";
    ctx.setTransform(dpr,0,0,dpr,0,0);
    particles=Array.from({length:width<700?900:1800},(_,i)=>createParticle(i));
  };

  const draw=time=>{
    ctx.clearRect(0,0,width,height);
    ctx.fillStyle="#000";
    ctx.fillRect(0,0,width,height);

    let zoom=1,shiftX=0;
    if(page==="home" && document.body.classList.contains("entering")){
      const start=Number(document.body.dataset.enterStart||0);
      const t=start?Math.min(1,(performance.now()-start)/1350):0;
      const eased=1-Math.pow(1-t,3);
      zoom=1+eased*.78;
      shiftX=-width*.10*eased;
    }else if(page==="home" && document.body.classList.contains("entered")){
      zoom=1.78;
      shiftX=-width*.10;
    }

    const cx=width*settings.x+shiftX;
    const cy=height*settings.y;
    const coreR=Math.min(width,height)*.225*settings.scale*zoom;
    const ringR=coreR*1.47;

    const pointerDist=Math.hypot(pointer.x-cx,pointer.y-cy);
    const pull=Math.max(0,1-pointerDist/(ringR*2.4));

    const halo=ctx.createRadialGradient(cx,cy,coreR*.9,cx,cy,ringR*2.2);
    halo.addColorStop(0,"rgba(0,0,0,0)");
    halo.addColorStop(.35,"rgba(255,100,42,.018)");
    halo.addColorStop(.54,"rgba(255,65,151,.025)");
    halo.addColorStop(.72,"rgba(87,113,255,.018)");
    halo.addColorStop(1,"rgba(0,0,0,0)");
    ctx.fillStyle=halo;
    ctx.beginPath();ctx.arc(cx,cy,ringR*2.2,0,Math.PI*2);ctx.fill();

    ctx.save();
    ctx.translate(cx,cy);
    ctx.rotate(-settings.tilt);

    for(let pass=0;pass<3;pass++){
      const passScale=[1.18,1,.84][pass];
      const passAlpha=[.22,.38,.62][pass];
      particles.forEach(p=>{
        if(!reduced){
          p.angle+=p.speed*(1+pull*.35);
        }
        const wave=Math.sin(p.angle*3+time*.0008+p.phase)*.032 + Math.sin(p.angle*6-time*.00055+p.wobble)*.018;
        const r=ringR*p.radius*passScale*(1+wave);
        const x=r*Math.cos(p.angle);
        const y=r*Math.sin(p.angle)*(.32+.025*Math.sin(time*.0004+p.wobble));
        const tangent=p.angle+Math.PI/2;
        const len=5+p.width*7;
        const alpha=Math.max(.018,passAlpha*(1.58-p.radius)*(.72+.28*Math.sin(time*.00055+p.phase)));
        ctx.strokeStyle=colorFor(p,alpha);
        ctx.lineWidth=Math.max(.35,p.width*(pass===2?1.12:.72));
        ctx.beginPath();
        ctx.moveTo(x-Math.cos(tangent)*len,y-Math.sin(tangent)*len*.31);
        ctx.lineTo(x+Math.cos(tangent)*len,y+Math.sin(tangent)*len*.31);
        ctx.stroke();
      });
    }

    ctx.restore();

    ctx.save();
    ctx.translate(cx,cy);
    ctx.rotate(-settings.tilt);
    ctx.scale(1,.32);
    const ring=ctx.createRadialGradient(0,0,ringR*.88,0,0,ringR*1.24);
    ring.addColorStop(0,"rgba(0,0,0,0)");
    ring.addColorStop(.27,"rgba(255,84,44,.12)");
    ring.addColorStop(.49,"rgba(255,207,91,.95)");
    ring.addColorStop(.60,"rgba(255,86,53,.8)");
    ring.addColorStop(.74,"rgba(139,87,255,.36)");
    ring.addColorStop(.88,"rgba(93,210,255,.14)");
    ring.addColorStop(1,"rgba(0,0,0,0)");
    ctx.fillStyle=ring;
    ctx.beginPath();ctx.arc(0,0,ringR*1.24,0,Math.PI*2);ctx.fill();
    ctx.restore();

    const core=ctx.createRadialGradient(cx,cy,0,cx,cy,coreR*1.12);
    core.addColorStop(0,"rgba(0,0,0,1)");
    core.addColorStop(.82,"rgba(0,0,0,1)");
    core.addColorStop(.95,"rgba(0,0,0,.99)");
    core.addColorStop(1,"rgba(0,0,0,0)");
    ctx.fillStyle=core;
    ctx.beginPath();ctx.arc(cx,cy,coreR*1.13,0,Math.PI*2);ctx.fill();

    if(!reduced) frame=requestAnimationFrame(draw);
  };

  if(page==="home" && enter){
    enter.addEventListener("click",()=>{
      document.body.dataset.enterStart=String(performance.now());
    },{once:true});
  }

  addEventListener("pointermove",e=>{pointer.x=e.clientX;pointer.y=e.clientY},{passive:true});
  addEventListener("pointerleave",()=>{pointer.x=-9999;pointer.y=-9999},{passive:true});
  addEventListener("resize",()=>{cancelAnimationFrame(frame);resize();draw(performance.now())},{passive:true});

  resize();
  draw(performance.now());
})();