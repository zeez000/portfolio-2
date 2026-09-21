(() => {
  "use strict";
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const canvas = document.getElementById("blackhole-canvas");
  const ctx = canvas?.getContext("2d");
  const trigger = document.getElementById("blackhole-trigger");
  const portfolio = document.getElementById("portfolio");
  if (!canvas || !ctx || !trigger) return;

  let width=0,height=0,dpr=1,raf=0;
  let particles=[];
  let enterStart=0;
  const pointer={x:-9999,y:-9999};

  const makeParticle=(i=0)=>({
    angle:Math.random()*Math.PI*2,
    radius:.76+Math.random()*1.2,
    width:.45+Math.random()*2.05,
    speed:(.00016+Math.random()*.00042)*(Math.random()<.12?-1:1),
    phase:i*.41+Math.random()*Math.PI*2,
    heat:Math.random(),
    wobble:Math.random()*Math.PI*2
  });

  const colorFor=(p,a)=>{
    if (p.heat<.18) return `rgba(105,225,255,${a})`;
    if (p.heat<.36) return `rgba(120,82,255,${a})`;
    if (p.heat<.56) return `rgba(255,61,167,${a})`;
    if (p.heat<.78) return `rgba(255,79,48,${a})`;
    return `rgba(255,214,103,${a})`;
  };

  const resize=()=>{
    dpr=Math.min(devicePixelRatio||1,2);
    width=innerWidth;height=innerHeight;
    canvas.width=Math.max(1,Math.floor(width*dpr));
    canvas.height=Math.max(1,Math.floor(height*dpr));
    canvas.style.width=width+"px";
    canvas.style.height=height+"px";
    ctx.setTransform(dpr,0,0,dpr,0,0);
    particles=Array.from({length:width<700?850:1700},(_,i)=>makeParticle(i));
  };

  const draw=time=>{
    ctx.clearRect(0,0,width,height);
    ctx.fillStyle="#000";
    ctx.fillRect(0,0,width,height);

    let t=0;
    if(enterStart){
      t=Math.min(1,(time-enterStart)/1450);
      t=1-Math.pow(1-t,3);
    }

    const cx=width*(.5-.11*t);
    const cy=height*.5;
    const baseCore=Math.min(width,height)*.23;
    const coreR=baseCore*(1+t*.85);
    const ringR=coreR*1.46;
    const pointerDist=Math.hypot(pointer.x-cx,pointer.y-cy);
    const pull=Math.max(0,1-pointerDist/(ringR*2.3));

    const halo=ctx.createRadialGradient(cx,cy,coreR*.9,cx,cy,ringR*2.15);
    halo.addColorStop(0,"rgba(0,0,0,0)");
    halo.addColorStop(.36,"rgba(255,99,40,.02)");
    halo.addColorStop(.55,"rgba(255,59,151,.028)");
    halo.addColorStop(.72,"rgba(87,115,255,.018)");
    halo.addColorStop(1,"rgba(0,0,0,0)");
    ctx.fillStyle=halo;
    ctx.beginPath();ctx.arc(cx,cy,ringR*2.15,0,Math.PI*2);ctx.fill();

    ctx.save();
    ctx.translate(cx,cy);
    ctx.rotate(-.33);
    for(let pass=0;pass<3;pass++){
      const passScale=[1.18,1,.84][pass];
      const passAlpha=[.21,.37,.63][pass];
      particles.forEach(p=>{
        if(!reduced) p.angle+=p.speed*(1+pull*.25);
        const wave=Math.sin(p.angle*3+time*.00065+p.phase)*.028 + Math.sin(p.angle*6-time*.00042+p.wobble)*.014;
        const r=ringR*p.radius*passScale*(1+wave);
        const x=r*Math.cos(p.angle);
        const y=r*Math.sin(p.angle)*(.31+.02*Math.sin(time*.00035+p.wobble));
        const tangent=p.angle+Math.PI/2;
        const len=5+p.width*7;
        const alpha=Math.max(.016,passAlpha*(1.58-p.radius)*(.74+.26*Math.sin(time*.0005+p.phase)));
        ctx.strokeStyle=colorFor(p,alpha);
        ctx.lineWidth=Math.max(.35,p.width*(pass===2?1.12:.72));
        ctx.beginPath();
        ctx.moveTo(x-Math.cos(tangent)*len,y-Math.sin(tangent)*len*.3);
        ctx.lineTo(x+Math.cos(tangent)*len,y+Math.sin(tangent)*len*.3);
        ctx.stroke();
      });
    }
    ctx.restore();

    ctx.save();
    ctx.translate(cx,cy);
    ctx.rotate(-.33);
    ctx.scale(1,.31);
    const ring=ctx.createRadialGradient(0,0,ringR*.88,0,0,ringR*1.24);
    ring.addColorStop(0,"rgba(0,0,0,0)");
    ring.addColorStop(.26,"rgba(255,82,42,.12)");
    ring.addColorStop(.49,"rgba(255,209,92,.95)");
    ring.addColorStop(.60,"rgba(255,84,51,.82)");
    ring.addColorStop(.74,"rgba(137,84,255,.38)");
    ring.addColorStop(.88,"rgba(93,210,255,.15)");
    ring.addColorStop(1,"rgba(0,0,0,0)");
    ctx.fillStyle=ring;
    ctx.beginPath();ctx.arc(0,0,ringR*1.24,0,Math.PI*2);ctx.fill();
    ctx.restore();

    const core=ctx.createRadialGradient(cx,cy,0,cx,cy,coreR*1.13);
    core.addColorStop(0,"rgba(0,0,0,1)");
    core.addColorStop(.82,"rgba(0,0,0,1)");
    core.addColorStop(.95,"rgba(0,0,0,.995)");
    core.addColorStop(1,"rgba(0,0,0,0)");
    ctx.fillStyle=core;
    ctx.beginPath();ctx.arc(cx,cy,coreR*1.13,0,Math.PI*2);ctx.fill();

    if(!reduced) raf=requestAnimationFrame(draw);
  };

  trigger.addEventListener("click",()=>{
    if(document.body.classList.contains("entering")||document.body.classList.contains("entered")) return;
    document.body.classList.add("entering");
    enterStart=performance.now();
    if(reduced){
      document.body.classList.add("entered");
      portfolio?.setAttribute("aria-hidden","false");
      return;
    }
    setTimeout(()=>{
      document.body.classList.add("entered");
      portfolio?.setAttribute("aria-hidden","false");
    },920);
  });

  addEventListener("pointermove",e=>{pointer.x=e.clientX;pointer.y=e.clientY},{passive:true});
  addEventListener("pointerleave",()=>{pointer.x=-9999;pointer.y=-9999},{passive:true});
  addEventListener("resize",()=>{cancelAnimationFrame(raf);resize();draw(performance.now())},{passive:true});

  resize();
  draw(performance.now());
})();