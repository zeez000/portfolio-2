(() => {
  "use strict";

  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const canvas = document.getElementById("blackhole-canvas");
  const ctx = canvas?.getContext("2d");
  const trigger = document.getElementById("blackhole-trigger");
  const portfolio = document.getElementById("portfolio");
  if (!canvas || !ctx || !trigger) return;

  let width=0,height=0,dpr=1,raf=0,enterStart=0;
  const pointer={x:-9999,y:-9999};
  const palette=[
    [255,214,103],
    [255,91,49],
    [255,62,166],
    [124,84,255],
    [96,220,255]
  ];

  const colorAt=(t,a)=>{
    const p=((t%1)+1)%1*palette.length;
    const i=Math.floor(p)%palette.length;
    const j=(i+1)%palette.length;
    const f=p-Math.floor(p);
    const A=palette[i],B=palette[j];
    const r=Math.round(A[0]+(B[0]-A[0])*f);
    const g=Math.round(A[1]+(B[1]-A[1])*f);
    const b=Math.round(A[2]+(B[2]-A[2])*f);
    return `rgba(${r},${g},${b},${a})`;
  };

  const ease=t=>t<.5?4*t*t*t:1-Math.pow(-2*t+2,3)/2;

  const resize=()=>{
    dpr=Math.min(devicePixelRatio||1,2);
    width=innerWidth;height=innerHeight;
    canvas.width=Math.max(1,Math.floor(width*dpr));
    canvas.height=Math.max(1,Math.floor(height*dpr));
    canvas.style.width=width+"px";
    canvas.style.height=height+"px";
    ctx.setTransform(dpr,0,0,dpr,0,0);
  };

  const drawLiquidRim=(cx,cy,r,time,react)=>{
    const segments=300;
    const flow=time*.000032;

    for(let layer=3;layer>=0;layer--){
      const widths=[3,6,11,20];
      const alphas=[.92,.38,.16,.065];
      ctx.lineCap="round";

      for(let i=0;i<segments;i++){
        const a0=i/segments*Math.PI*2;
        const a1=(i+1.45)/segments*Math.PI*2;
        const pulse=
          Math.sin(a0*3.1+time*.00072)*1.6+
          Math.sin(a0*6.7-time*.00049)*.8+
          Math.sin(a0*11.2+time*.00031)*.36;
        const localR=r + pulse*(1+react*.7) + layer*2.8;
        const hue=i/segments+flow+.018*Math.sin(a0*2-time*.00018);

        ctx.strokeStyle=colorAt(hue,alphas[layer]);
        ctx.lineWidth=widths[layer];
        ctx.beginPath();
        ctx.arc(cx,cy,localR,a0,a1);
        ctx.stroke();
      }
    }
  };

  const draw=time=>{
    ctx.clearRect(0,0,width,height);
    ctx.fillStyle="#000";
    ctx.fillRect(0,0,width,height);

    let p=0;
    if(enterStart){
      p=Math.min(1,(time-enterStart)/1550);
      p=ease(p);
    }

    const cx=width*(.5+.27*p);
    const cy=height*.5;
    const base=Math.min(width,height)*.235;
    const radius=base*(1+1.05*p);

    const dist=Math.hypot(pointer.x-cx,pointer.y-cy);
    const react=Math.max(0,1-dist/(radius*1.75));

    const halo=ctx.createRadialGradient(cx,cy,radius*.92,cx,cy,radius*1.2);
    halo.addColorStop(0,"rgba(0,0,0,0)");
    halo.addColorStop(.35,"rgba(255,128,48,.045)");
    halo.addColorStop(.58,"rgba(255,64,167,.034)");
    halo.addColorStop(.78,"rgba(95,210,255,.022)");
    halo.addColorStop(1,"rgba(0,0,0,0)");
    ctx.fillStyle=halo;
    ctx.beginPath();
    ctx.arc(cx,cy,radius*1.2,0,Math.PI*2);
    ctx.fill();

    drawLiquidRim(cx,cy,radius,time,react);

    ctx.fillStyle="#000";
    ctx.beginPath();
    ctx.arc(cx,cy,radius-1.5,0,Math.PI*2);
    ctx.fill();

    if(!reduced) raf=requestAnimationFrame(draw);
  };

  trigger.addEventListener("click",()=>{
    if(document.body.classList.contains("entering")||document.body.classList.contains("entered")) return;
    enterStart=performance.now();
    document.body.classList.add("entering");
    if(reduced){
      document.body.classList.add("entered");
      portfolio?.setAttribute("aria-hidden","false");
      return;
    }
    setTimeout(()=>{
      document.body.classList.add("entered");
      portfolio?.setAttribute("aria-hidden","false");
    },1050);
  });

  addEventListener("pointermove",e=>{pointer.x=e.clientX;pointer.y=e.clientY},{passive:true});
  addEventListener("pointerleave",()=>{pointer.x=-9999;pointer.y=-9999},{passive:true});
  addEventListener("resize",()=>{cancelAnimationFrame(raf);resize();draw(performance.now())},{passive:true});

  resize();
  draw(performance.now());
})();