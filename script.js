(() => {
  "use strict";
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const page = document.documentElement.dataset.page || "home";
  const canvas = document.getElementById("universe");
  const ctx = canvas?.getContext("2d");
  const portalLinks = [...document.querySelectorAll(".portal-link")];
  const techButtons = [...document.querySelectorAll("#tech-orbit button")];
  const techDetail = document.getElementById("tech-detail");
  requestAnimationFrame(() => document.body.classList.add("ready"));

  portalLinks.forEach(link => link.addEventListener("click", e => {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || link.target === "_blank") return;
    const href = link.getAttribute("href");
    if (!href || href.startsWith("#")) return;
    e.preventDefault();
    document.body.classList.add("transitioning");
    setTimeout(() => { location.href = href; }, reduced ? 80 : 620);
  }));

  techButtons.forEach(button => {
    const activate = () => {
      techButtons.forEach(item => item.classList.remove("active"));
      button.classList.add("active");
      if (techDetail) techDetail.textContent = button.textContent + " // " + button.dataset.detail;
    };
    button.addEventListener("mouseenter", activate);
    button.addEventListener("focus", activate);
  });

  if (!canvas || !ctx) return;

  let width=0,height=0,dpr=1,frame=0,stars=[],particles=[];
  const pointer={x:-9999,y:-9999};
  const settings={
    home:{x:.50,y:.50,scale:1,spin:1},
    profile:{x:.80,y:.56,scale:.74,spin:.78},
    stack:{x:.18,y:.52,scale:.68,spin:1.15},
    projects:{x:.78,y:.42,scale:.72,spin:.92},
    contact:{x:.18,y:.55,scale:.66,spin:.82}
  }[page] || {x:.5,y:.5,scale:1,spin:1};

  const makeStar=()=>({x:Math.random(),y:Math.random(),r:Math.random()<.92?Math.random()*.8+.18:Math.random()*1.8+.8,a:Math.random()*.75+.12,tw:Math.random()*Math.PI*2});
  const makeParticle=(i=0)=>({angle:Math.random()*Math.PI*2,radius:.86+Math.random()*.95,speed:(.00045+Math.random()*.00125)*(Math.random()<.18?-1:1),width:.5+Math.random()*2.4,heat:Math.random(),drift:Math.random()*Math.PI*2,phase:i*.37+Math.random()*5});
  const colorFor=(p,a)=>p.heat<.22?`rgba(112,231,255,${a})`:p.heat<.42?`rgba(138,92,255,${a})`:p.heat<.62?`rgba(255,61,159,${a})`:p.heat<.82?`rgba(255,78,58,${a})`:`rgba(255,208,92,${a})`;

  const resize=()=>{
    dpr=Math.min(devicePixelRatio||1,2); width=innerWidth; height=innerHeight;
    canvas.width=Math.max(1,Math.floor(width*dpr)); canvas.height=Math.max(1,Math.floor(height*dpr));
    canvas.style.width=width+"px"; canvas.style.height=height+"px"; ctx.setTransform(dpr,0,0,dpr,0,0);
    stars=Array.from({length:Math.min(900,Math.max(320,Math.floor(width*height/2100)))},makeStar);
    particles=Array.from({length:width<700?720:1500},(_,i)=>makeParticle(i));
  };

  const draw=time=>{
    ctx.clearRect(0,0,width,height); ctx.fillStyle="#000"; ctx.fillRect(0,0,width,height);
    const cx=width*settings.x,cy=height*settings.y,base=Math.min(width,height)*.24*settings.scale;
    const coreR=Math.min(width,height)*(page==="home"?.18:.13)*settings.scale,ringR=coreR*1.45;
    const hoverDist=Math.hypot(pointer.x-cx,pointer.y-cy),hoverPull=Math.max(0,1-hoverDist/(coreR*3.2));

    stars.forEach(s=>{
      let x=s.x*width,y=s.y*height; const dx=x-cx,dy=y-cy,dist=Math.hypot(dx,dy)||1,bend=Math.max(0,1-dist/(base*5))*7;
      x+=(-dy/dist)*bend; y+=(dx/dist)*bend;
      ctx.fillStyle=`rgba(255,255,255,${s.a*(.72+.28*Math.sin(time*.0015+s.tw))})`;
      ctx.beginPath(); ctx.arc(x,y,s.r,0,Math.PI*2); ctx.fill();
    });

    const glow=ctx.createRadialGradient(cx,cy,coreR*.7,cx,cy,ringR*2.8);
    glow.addColorStop(0,"rgba(0,0,0,0)"); glow.addColorStop(.34,"rgba(255,107,44,.03)"); glow.addColorStop(.52,"rgba(255,48,138,.035)"); glow.addColorStop(.7,"rgba(77,106,255,.025)"); glow.addColorStop(1,"rgba(0,0,0,0)");
    ctx.fillStyle=glow; ctx.beginPath(); ctx.arc(cx,cy,ringR*2.8,0,Math.PI*2); ctx.fill();

    ctx.save(); ctx.translate(cx,cy); ctx.rotate(-.18);
    for(let pass=0;pass<3;pass++){
      const ps=[1.22,1,.78][pass],as=[.22,.42,.62][pass];
      particles.forEach(p=>{
        if(!reduced) p.angle+=p.speed*settings.spin*(1+hoverPull*.65);
        const ripple=Math.sin(p.angle*3+time*.0014+p.phase)*.065+Math.sin(p.angle*7-time*.0009+p.phase)*.025;
        const r=ringR*p.radius*ps*(1+ripple),ex=r*Math.cos(p.angle),ey=r*Math.sin(p.angle)*(.34+.05*Math.sin(time*.0006+p.drift)),tan=p.angle+Math.PI/2,len=4+p.width*7+(1-p.radius+.86)*5;
        const alpha=Math.max(.02,as*(1.65-p.radius)*(.58+.42*Math.sin(p.phase+time*.001)));
        ctx.strokeStyle=colorFor(p,alpha); ctx.lineWidth=Math.max(.35,p.width*(pass===2?1.18:.7)); ctx.beginPath();
        ctx.moveTo(ex-Math.cos(tan)*len,ey-Math.sin(tan)*len*.34); ctx.lineTo(ex+Math.cos(tan)*len,ey+Math.sin(tan)*len*.34); ctx.stroke();
      });
    }
    ctx.restore();

    ctx.save(); ctx.translate(cx,cy); ctx.rotate(-.18); ctx.scale(1,.35);
    const rg=ctx.createRadialGradient(0,0,ringR*.88,0,0,ringR*1.24);
    rg.addColorStop(0,"rgba(0,0,0,0)"); rg.addColorStop(.28,"rgba(255,91,48,.16)"); rg.addColorStop(.52,"rgba(255,207,95,.92)"); rg.addColorStop(.64,"rgba(255,74,75,.72)"); rg.addColorStop(.8,"rgba(113,80,255,.34)"); rg.addColorStop(1,"rgba(0,0,0,0)");
    ctx.fillStyle=rg; ctx.beginPath(); ctx.arc(0,0,ringR*1.25,0,Math.PI*2); ctx.fill(); ctx.restore();

    const core=ctx.createRadialGradient(cx,cy,0,cx,cy,coreR*1.08);
    core.addColorStop(0,"rgba(0,0,0,1)"); core.addColorStop(.78,"rgba(0,0,0,1)"); core.addColorStop(.92,"rgba(0,0,0,.98)"); core.addColorStop(1,"rgba(0,0,0,0)");
    ctx.fillStyle=core; ctx.beginPath(); ctx.arc(cx,cy,coreR*1.11,0,Math.PI*2); ctx.fill();
    ctx.strokeStyle=`rgba(255,218,140,${.10+hoverPull*.1})`; ctx.lineWidth=1; ctx.beginPath(); ctx.arc(cx,cy,coreR*1.05,0,Math.PI*2); ctx.stroke();

    if(!reduced) frame=requestAnimationFrame(draw);
  };

  addEventListener("pointermove",e=>{pointer.x=e.clientX;pointer.y=e.clientY},{passive:true});
  addEventListener("pointerleave",()=>{pointer.x=-9999;pointer.y=-9999},{passive:true});
  addEventListener("resize",()=>{cancelAnimationFrame(frame);resize();draw(performance.now())},{passive:true});
  resize(); draw(performance.now());
})();