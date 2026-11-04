// Four retained product surfaces: gather, bring the important layer forward, trace its source.
export function mountWorkspace({ gsap, ScrollTrigger, reduced = true, desktop = false }) {
  const stage = document.querySelector('[data-product-workspace]');
  if (!stage) return () => {};
  const art = stage.querySelector('.folio-art'), pieces = [...stage.querySelectorAll('[data-folio-piece]')];
  const headings = [...stage.querySelectorAll('[data-folio-heading]')], buttons = [...stage.querySelectorAll('[data-workspace-step]')];
  const lines = [...stage.querySelectorAll('[data-folio-line]')], packet = stage.querySelector('[data-folio-packet]');
  const answer = stage.querySelector('.folio-answer'), business = stage.querySelector('.folio-business');
  let active = 0, main, mainContext, manualContext, replayContext, observer, resizeFrame = 0;
  let geometry, visible = false, pendingIntro = true, disposed = false;
  const starts = [0,3.1,6.2], checkpoints = [1.7,4.8,8.05];
  function measure() {
    geometry = { w:art.clientWidth,h:art.clientHeight,compact:innerWidth <= 760,sizes:Object.fromEntries(pieces.map(p => [p.dataset.folioPiece,{ w:p.offsetWidth,h:p.offsetHeight }])) };
    stage.querySelector('.folio-connections').setAttribute('viewBox',`0 0 ${geometry.w} ${geometry.h}`);
  }
  function poses(index) {
    const { w,compact,sizes } = geometry, full = 'inset(0 0px 0px 0 round 16px)';
    const clip = compact ? `inset(0 ${sizes.assistant.w - 144}px ${sizes.assistant.h - 80}px 0 round 16px)` : `inset(0 0px ${sizes.assistant.h - 66}px 0 round 16px)`;
    const p = (x,y,z,rotation,scale = 1,autoAlpha = 1,zIndex = 3,rotationY = 0) => ({ x,y,z,rotation,scale,autoAlpha,zIndex,rotationY,rotationX:0 });
    if (compact) {
      const narrow = w < 320;
      if (index === 0) return { portfolio:p(0,-51,narrow ? 0 : 80,-3,narrow ? .94 : 1,1,5),business:p(4,-27,0,4,narrow ? .9 : 1,.9,3),calendar:p(w * .225,158,30,3,1,1,4),assistant:{ ...p(5,225,40,0,1,1,6),clipPath:clip } };
      if (index === 1) return { portfolio:p(-8,-22,-20,-5,.92,.55,2),business:p(0,-41,90,0,narrow ? .9 : 1,1,5),calendar:p(w * .225,158,15,3,1,.85,4),assistant:{ ...p(5,225,20,0,1,1,6),clipPath:clip } };
      return { portfolio:p(-13,-32,-30,-6,.87,.2,1),business:p(-4,-69,0,-3,.92,.95,3),calendar:p(w * .225,163,-20,6,.92,.3,2),assistant:{ ...p(0,35,90,0,narrow ? .91 : 1,1,6),clipPath:full } };
    }
    if (index === 0) return { portfolio:p(-w * .295,-20,65,-4,1,1,5,-3),business:p(w * .015,-10,15,3,1,1,3,3),calendar:p(w * .315,-65,20,5,1,1,2,-3),assistant:{ ...p(w * .245,208,35,-2,1,1,6),clipPath:clip } };
    if (index === 1) return { portfolio:p(-w * .31,75,-25,-7,.85,.5,2,-7),business:p(-w * .035,-15,90,0,1.1,1,5),calendar:p(w * .31,-60,-10,5,.92,.75,2),assistant:{ ...p(w * .255,208,20,-2,1,1,6),clipPath:clip } };
    return { portfolio:p(-w * .325,92,-50,-8,.78,.25,1,-9),business:p(-w * .14,-16,10,-2,.92,1,4),calendar:p(w * .34,90,-45,8,.8,.25,2),assistant:{ ...p(w * .19,30,110,0,1.07,1,6),clipPath:full } };
  }
  function route(index,lineIndex) {
    const p = poses(index), { w,h,sizes } = geometry;
    const point = (id,dx,dy) => ({ x:w / 2 + p[id].x + sizes[id].w * p[id].scale * dx,y:h / 2 + p[id].y + sizes[id].h * p[id].scale * dy });
    const pair = lineIndex === 0 ? [point('portfolio',.4,-.1),point('business',-.4,-.05)] : lineIndex === 1 ? [point('business',.4,-.05),point('calendar',-.4,.1)] : [point('business',.35,.25),point('assistant',-.3,index === 2 ? .23 : -.42)];
    const [a,b] = pair, middle = (a.x + b.x) / 2;
    return `M${a.x} ${a.y}C${middle} ${a.y} ${middle} ${b.y} ${b.x} ${b.y}`;
  }
  function select(index) {
    active = index; stage.dataset.chapter = String(index);
    headings.forEach((heading,n) => { heading.classList.toggle('is-active',n === index); heading.setAttribute('aria-hidden',String(n !== index)); buttons[n].setAttribute('aria-pressed',String(n === index)); });
    pieces.forEach(piece => { const focused = piece.dataset.folioPiece === ['portfolio','business','assistant'][index]; piece.classList.toggle('is-focused',focused); piece.inert = !focused; });
    answer.setAttribute('aria-hidden',String(index !== 2)); answer.inert = index !== 2;
  }
  function setPoster(index) {
    const state = poses(index);
    pieces.forEach(piece => {
      const p = state[piece.dataset.folioPiece];
      if (gsap) gsap.set(piece,{ xPercent:-50,yPercent:-50,...p });
      else {
        piece.style.transform = `translate(-50%,-50%) translate3d(${p.x}px,${p.y}px,${p.z}px) rotate(${p.rotation}deg) rotateY(${p.rotationY}deg) scale(${p.scale})`;
        piece.style.opacity = String(p.autoAlpha); piece.style.zIndex = String(p.zIndex); piece.style.clipPath = p.clipPath || 'none';
      }
    });
    lines.forEach((line,n) => line.setAttribute('d',route(index,n))); packet.setAttribute('d',route(index,index === 2 ? 2 : 0));
  }
  function shape(index,tl,time,duration = 1.05) {
    pieces.forEach((piece,n) => {
      const key = piece.dataset.folioPiece, target = () => poses(index)[key];
      const vars = { duration,ease:'power3.inOut',x:() => target().x,y:() => target().y,z:() => target().z,rotation:() => target().rotation,rotationX:0,rotationY:() => target().rotationY,scale:() => target().scale,autoAlpha:() => target().autoAlpha,zIndex:() => target().zIndex };
      if (key === 'assistant') vars.clipPath = () => target().clipPath;
      tl.to(piece,vars,time + n * .045);
    });
    lines.forEach((line,n) => tl.to(line,{ attr:{ d:() => route(index,n) },duration,ease:'power3.inOut' },time));
    return tl;
  }
  function detail(index) {
    const tl = gsap.timeline({ defaults:{ ease:'power3.out',immediateRender:false } });
    if (index === 0) {
      tl.fromTo(stage.querySelectorAll('.folio-holdings>div'),{ x:-15,autoAlpha:.8 },{ x:0,autoAlpha:1,duration:.4,stagger:.065 },.28)
        .fromTo(stage.querySelector('.folio-binding'),{ scale:.88,autoAlpha:.8 },{ scale:1.25,autoAlpha:0,duration:.6 },0);
      lines.forEach((line,n) => tl.fromTo(line,{ strokeDasharray:1,strokeDashoffset:1 },{ strokeDashoffset:0,duration:.55,ease:'none' },.4 + n * .11));
    } else if (index === 1) {
      tl.fromTo(stage.querySelector('.folio-paper'),{ rotationX:-72,y:24,z:0,autoAlpha:.3 },{ rotationX:0,y:0,z:28,autoAlpha:1,duration:.85 },.1)
        .fromTo(stage.querySelector('.folio-paper-scan'),{ y:0,autoAlpha:0 },{ y:95,autoAlpha:.7,duration:.6,ease:'none' },.55)
        .to(stage.querySelector('.folio-paper-scan'),{ autoAlpha:0,duration:.12 },1.09)
        .fromTo(stage.querySelectorAll('.folio-paper-row'),{ x:-12,autoAlpha:.25 },{ x:0,autoAlpha:1,duration:.35,stagger:.08 },.62);
    } else {
      tl.fromTo(stage.querySelector('.folio-paper'),{ x:0,y:0,rotation:0 },{ x:geometry.compact ? 0 : 32,y:geometry.compact ? -9 : 8,rotation:-2,duration:.75 },.1)
        .fromTo(stage.querySelector('.folio-question'),{ x:20,autoAlpha:0 },{ x:0,autoAlpha:1,duration:.3 },.45)
        .fromTo(stage.querySelectorAll('.folio-answer p>span'),{ y:7,autoAlpha:.1,clipPath:'inset(0 0 100% 0)' },{ y:0,autoAlpha:1,clipPath:'inset(0 0 0% 0)',duration:.35,stagger:.09 },.72)
        .fromTo(stage.querySelector('.folio-answer a'),{ y:9,autoAlpha:0 },{ y:0,autoAlpha:1,duration:.3 },1.04);
    }
    const pathIndex = index === 2 ? 2 : 0;
    tl.set(packet,{ attr:{ d:() => route(index,pathIndex) },strokeDasharray:'.035 .965',autoAlpha:1,strokeDashoffset:0 },.75)
      .to(packet,{ strokeDashoffset:-1,duration:.6,ease:'none' },.75).to(packet,{ autoAlpha:0,duration:.1 },1.27);
    return tl;
  }
  function stopReplay() { replayContext?.revert(); replayContext = null; }
  function show(index,instant,intro = false) {
    stopReplay(); manualContext?.revert(); manualContext = null;
    const previous = active; select(index);
    if (!gsap) { setPoster(index); return; }
    manualContext = gsap.context(() => {
      gsap.set(headings,{ autoAlpha:0,y:0 }); gsap.set(headings[index],{ autoAlpha:1 }); setPoster(instant ? index : previous);
      if (!instant) {
        const tl = gsap.timeline({ defaults:{ ease:'power3.out',immediateRender:false } });
        if (intro) pieces.forEach((piece,n) => gsap.set(piece,{ x:(n - 1.5) * 17,y:n * 8 - 15,z:-30 + n * 12,rotation:(n - 1.5) * 3,rotationX:12,rotationY:-18,scale:.94,autoAlpha:.5 }));
        shape(index,tl,0).fromTo(headings[index],{ y:14,autoAlpha:.35 },{ y:0,autoAlpha:1,duration:.35 },0).add(detail(index),.12);
      }
    },stage);
  }
  const navigate = event => {
    const step = event.target.closest('[data-workspace-step],[data-folio-focus]'), repeat = event.target.closest('[data-folio-replay]');
    if (!step && !repeat) return;
    const keyboard = event.detail === 0;
    if (repeat) {
      stopReplay();
      if (reduced || keyboard || !gsap) { if (!main) show(active,true); return; }
      replayContext = gsap.context(() => {
        const tl = gsap.timeline({ defaults:{ immediateRender:false } });
        pieces.forEach((piece,n) => tl.to(piece,{ x:(n - 1.5) * 17,y:n * 8 - 10,z:n * 8,rotation:(n - 1.5) * 3,rotationY:-15,scale:.95,duration:.5,ease:'power3.inOut' },0));
        shape(active,tl,.5).add(detail(active),.7);
      },stage); return;
    }
    stopReplay(); const index = Number(step.dataset.workspaceStep ?? step.dataset.folioFocus), trigger = main?.scrollTrigger;
    if (trigger) {
      const time = main.labels[`folio-${index}`], top = trigger.start + time / main.duration() * (trigger.end - trigger.start);
      window.scrollTo({ top,behavior:keyboard ? 'instant' : 'smooth' });
      if (keyboard) { trigger.getTween()?.pause(); main.time(time); select(index); }
    } else {
      const instant = keyboard || reduced || !visible;
      pendingIntro = !keyboard && !reduced && !visible; show(index,instant);
    }
  };
  const visibility = () => { if (!document.hidden) return; stopReplay(); if (main) main.scrollTrigger?.getTween()?.pause(); else { pendingIntro = false; show(active,true); } };
  const resize = () => {
    if (resizeFrame) cancelAnimationFrame(resizeFrame);
    resizeFrame = requestAnimationFrame(() => { resizeFrame = 0; if (!disposed && !main) { measure(); show(active,true); } });
  };
  measure(); pieces.forEach(piece => { piece.style.left = '50%'; piece.style.top = '50%'; }); select(0); setPoster(0);
  stage.addEventListener('click',navigate); document.addEventListener('visibilitychange',visibility); addEventListener('scroll',stopReplay,{passive:true}); addEventListener('resize',resize,{passive:true});
  if (gsap && ScrollTrigger && desktop && !reduced) {
    mainContext = gsap.context(() => {
      gsap.set(headings,{ autoAlpha:0 }); gsap.set(headings[0],{ autoAlpha:1 });
      const tl = gsap.timeline({ defaults:{ immediateRender:false },scrollTrigger:{ id:'tail-workspace',trigger:stage,pin:true,start:'top 96px',end:() => `+=${Math.round(innerHeight * 4.8)}`,scrub:.5,invalidateOnRefresh:true,onRefreshInit:measure },onUpdate() {
        const next = this.time() < starts[1] ? 0 : this.time() < starts[2] ? 1 : 2; if (next !== active) select(next);
      } });
      pieces.forEach((piece,n) => {
        const target = () => poses(0)[piece.dataset.folioPiece];
        const to = { x:() => target().x,y:() => target().y,z:() => target().z,rotation:() => target().rotation,rotationY:() => target().rotationY,rotationX:0,scale:() => target().scale,autoAlpha:1,zIndex:() => target().zIndex,duration:1.1,ease:'power3.inOut' };
        const from = { x:() => target().x * .94,y:() => target().y + 12,z:0,rotation:() => target().rotation + 2,rotationX:0,rotationY:() => target().rotationY,scale:() => target().scale,autoAlpha:1 };
        if (piece.dataset.folioPiece === 'assistant') { from.clipPath = () => target().clipPath; to.clipPath = () => target().clipPath; }
        tl.fromTo(piece,from,to,n * .045);
      });
      tl.add(detail(0),.12).addLabel('folio-0',checkpoints[0]);
      for (let index = 1; index < 3; index++) {
        const start = starts[index];
        tl.to(headings[index - 1],{ y:-12,autoAlpha:0,duration:.23 },start - .2)
          .fromTo(headings[index],{ y:18,autoAlpha:0 },{ y:0,autoAlpha:1,duration:.35,ease:'power3.out' },start + .02);
        shape(index,tl,start).add(detail(index),start + .18).addLabel(`folio-${index}`,checkpoints[index]);
      }
      tl.to({},{duration:1.35},checkpoints[2]); main = tl;
    },stage);
  } else {
    show(0,true);
    if (gsap && !reduced && 'IntersectionObserver' in window) {
      observer = new IntersectionObserver(entries => { if (disposed) return; visible = entries[0].intersectionRatio >= .4; if (visible && pendingIntro) { pendingIntro = false; if (!document.body.classList.contains('keyboard-input')) show(active,false,true); } },{threshold:[0,.4]}); observer.observe(art);
    } else visible = true;
  }
  return () => {
    disposed = true; observer?.disconnect(); cancelAnimationFrame(resizeFrame); stopReplay(); manualContext?.revert(); mainContext?.revert();
    stage.removeEventListener('click',navigate); document.removeEventListener('visibilitychange',visibility); removeEventListener('scroll',stopReplay); removeEventListener('resize',resize);
    pieces.forEach(piece => ['left','top','transform','opacity','visibility','z-index','clip-path'].forEach(property => piece.style.removeProperty(property))); select(0);
  };
}
