// A single retained company token ties the four explanations together.
// Scroll, replay and local controls have separate, interruptible owners.
export function mountWorkspace({ gsap, ScrollTrigger, reduced = true, desktop = false }) {
  const stage = document.querySelector('[data-product-workspace]');
  if (!stage) return () => {};
  const panels = [...stage.querySelectorAll('[data-workspace-panel]')];
  const copies = [...stage.querySelectorAll('[data-workspace-copy]')];
  const steps = [...stage.querySelectorAll('[data-workspace-step]')];
  const canvas = stage.querySelector('.desk-canvas'), token = stage.querySelector('.desk-company-token');
  const replayButton = stage.querySelector('[data-desk-replay]');
  const detail = stage.querySelector('#desk-evidence-more'), detailHome = detail.parentNode, detailNext = detail.nextSibling;
  const starts = [0,3.4,6.8,10.2], checkpoints = starts.map(time => time + 1.8);
  let active = 0, main, mainContext, manualContext, replayContext, actionContext, observer, flight;
  let anchors = [], linkLengths = [], productVisible = false, pendingIntro = true, disposed = false;
  const localRect = element => {
    let x = 0, y = 0, node = element;
    while (node && node !== canvas) { x += node.offsetLeft; y += node.offsetTop; node = node.offsetParent; }
    return { x,y,width:element.offsetWidth,height:element.offsetHeight };
  };
  function measure() {
    // On compact screens the calculation opens after the answer, keeping its source visible.
    if (innerWidth <= 600) panels[3].append(detail);
    else if (detail.parentNode !== detailHome) detailHome.insertBefore(detail,detailNext);
    // offset geometry ignores animated transforms, and is read only at init/refresh.
    anchors = panels.map(panel => localRect(panel.querySelector('[data-company-anchor]')));
    const rows = [0,1].map(index => localRect(stage.querySelectorAll('.desk-holding')[index]));
    const ring = localRect(stage.querySelector('.desk-allocation'));
    const paths = stage.querySelectorAll('.desk-link'), packets = stage.querySelectorAll('.desk-link-packet');
    stage.querySelector('.desk-links').setAttribute('viewBox',`0 0 ${canvas.offsetWidth} ${canvas.offsetHeight}`);
    stage.querySelector('.desk-answer-link').setAttribute('viewBox',`0 0 ${canvas.offsetWidth} ${canvas.offsetHeight}`);
    rows.forEach((row,index) => {
      const x = row.x + row.width, y = row.y + row.height / 2;
      const endX = ring.x + 15, endY = ring.y + ring.height / 2 + (index ? 12 : -12);
      const middle = x + (endX - x) * .55;
      const d = `M${x} ${y}C${middle} ${y} ${middle} ${endY} ${endX} ${endY}`;
      paths[index].setAttribute('d',d); packets[index].setAttribute('d',d);
    });
    linkLengths = [...paths].map(path => path.getTotalLength());
  }
  function select(index) {
    active = index;
    panels.forEach((panel,number) => {
      const chosen = number === index;
      panel.classList.toggle('is-active',chosen); panel.setAttribute('aria-hidden',String(!chosen)); panel.inert = !chosen;
      copies[number].classList.toggle('is-active',chosen); copies[number].setAttribute('aria-hidden',String(!chosen));
      steps[number].setAttribute('aria-pressed',String(chosen));
    });
  }
  function placeToken(index) {
    const { x,y } = anchors[index];
    if (gsap) gsap.set(token,{ x,y,scale:1,autoAlpha:1 });
    else token.style.transform = `translate(${x}px,${y}px)`;
  }
  function choreography(index) {
    const panel = panels[index], q = selector => panel.querySelector(selector), all = selector => panel.querySelectorAll(selector);
    const tl = gsap.timeline({ defaults:{ ease:'power3.out',immediateRender:false } });
    if (index === 0) {
      tl.fromTo(all('.desk-holding'),{ x:-38,y:number => 13 - number * 4,rotation:number => number ? 1.5 : -1.5,autoAlpha:.25 },{ x:0,y:0,rotation:0,autoAlpha:1,duration:.55,stagger:.07 },0);
      all('.desk-link').forEach((path,index) => tl.fromTo(path,{ strokeDasharray:() => linkLengths[index],strokeDashoffset:() => linkLengths[index] },{ strokeDashoffset:0,duration:.5,ease:'none' },.26 + index * .1));
      all('.desk-link-packet').forEach((path,index) => {
        const time = .62 + index * .14;
        tl.set(path,{ strokeDasharray:() => `12 ${linkLengths[index] + 12}`,opacity:1 },time)
          .fromTo(path,{ strokeDashoffset:0 },{ strokeDashoffset:() => -linkLengths[index],duration:.48,ease:'none' },time)
          .to(path,{ opacity:0,duration:.1 },time + .38);
      });
      tl.fromTo(q('.desk-allocation-share'),{ strokeDasharray:'0 100' },{ strokeDasharray:'30 70',duration:.65,ease:'power2.inOut' },.4)
        .fromTo(q('.desk-allocation-bond'),{ strokeDasharray:'0 100' },{ strokeDasharray:'20 80',duration:.55,ease:'power2.inOut' },.71)
        .fromTo(q('.desk-allocation-result'),{ y:14,autoAlpha:0,clipPath:'inset(0 0 100% 0)' },{ y:0,autoAlpha:1,clipPath:'inset(0 0 0% 0)',duration:.4 },.85)
        .fromTo(q('.desk-exposure-legend'),{ y:8,autoAlpha:0 },{ y:0,autoAlpha:1,duration:.3 },1.08)
        .fromTo(q('.desk-portfolio-payoff'),{ x:15,autoAlpha:0 },{ x:0,autoAlpha:1,duration:.3 },1.26);
    } else if (index === 1) {
      tl.fromTo(q('.desk-paper-back'),{ y:25,rotation:0,autoAlpha:.2 },{ y:0,rotation:-3,autoAlpha:1,duration:.6 },0)
        .fromTo(q('.desk-paper'),{ y:38,rotationX:16,rotation:3,autoAlpha:.25 },{ y:0,rotationX:0,rotation:0,autoAlpha:1,duration:.65 },.08)
        .fromTo(all('.desk-document-row'),{ x:-15,autoAlpha:.2 },{ x:0,autoAlpha:1,duration:.3,stagger:.07 },.38)
        .fromTo(q('.desk-document-scan'),{ y:0,autoAlpha:0 },{ y:135,autoAlpha:.75,duration:.6,ease:'none' },.42)
        .to(q('.desk-document-scan'),{ autoAlpha:0,duration:.12 },.96)
        .fromTo(q('.desk-analysis'),{ x:35,autoAlpha:.2 },{ x:0,autoAlpha:1,duration:.45 },.33)
        .fromTo(all('.desk-bar-reveal'),{ scaleY:.08 },{ scaleY:1,duration:.7,stagger:.055,ease:'power3.inOut' },.6)
        .fromTo(all('.desk-comparison > div > strong'),{ y:12,autoAlpha:0 },{ y:0,autoAlpha:1,duration:.3,stagger:.055 },.95)
        .fromTo(all('.desk-comparison-change'),{ y:10,autoAlpha:0,clipPath:'inset(0 100% 0 0)' },{ y:0,autoAlpha:1,clipPath:'inset(0 0% 0 0)',duration:.35 },1.04)
        .fromTo(q('.desk-analysis-proof'),{ y:10,autoAlpha:0 },{ y:0,autoAlpha:1,duration:.3 },1.22);
    } else if (index === 2) {
      tl.fromTo(all('.desk-event'),{ x:-25,y:10,autoAlpha:.2 },{ x:0,y:0,autoAlpha:1,duration:.45,stagger:.08 },0)
        .fromTo(q('.desk-personal-focus'),{ y:12,autoAlpha:0 },{ y:0,autoAlpha:1,duration:.3 },.25)
        .fromTo(q('.desk-event-route > span'),{ x:0,autoAlpha:0 },{ x:36,autoAlpha:1,duration:.4,ease:'none' },.38)
        .to(q('.desk-event-route > span'),{ autoAlpha:0,duration:.1 },.75)
        .fromTo(q('.desk-notification'),{ x:45,y:15,rotation:2,scale:.97,autoAlpha:.1 },{ x:0,y:0,rotation:0,scale:1,autoAlpha:1,duration:.6 },.55)
        .fromTo(all('.desk-calendar-strip > div > *'),{ y:18,autoAlpha:.2 },{ y:0,autoAlpha:1,duration:.3,stagger:.04 },.78)
        .fromTo(q('.desk-calendar-strip button'),{ scale:.92 },{ scale:1,duration:.35 },1.18);
    } else {
      tl.fromTo(q('.desk-evidence'),{ x:-30,y:18,rotation:-2,autoAlpha:.2 },{ x:0,y:0,rotation:0,autoAlpha:1,duration:.6 },0)
        .fromTo(all('.desk-question-bubble'),{ x:20,y:10,scale:.97,autoAlpha:.1 },{ x:0,y:0,scale:1,autoAlpha:1,duration:.3 },.18)
        .fromTo(all('.desk-answer-text'),{ y:9,autoAlpha:0 },{ y:0,autoAlpha:1,duration:.22 },.55)
        .fromTo(all('.desk-answer-text p > span'),{ clipPath:'inset(0 0 100% 0)',autoAlpha:.1 },{ clipPath:'inset(0 0 0% 0)',autoAlpha:1,duration:.35,stagger:.07,ease:'none' },.66)
        .fromTo(q('.desk-evidence mark'),{ backgroundColor:'#ffffff' },{ backgroundColor:'#d7ebbd',duration:.4 },.88)
        .fromTo(all('.desk-answer-actions > button'),{ y:12,autoAlpha:0 },{ y:0,autoAlpha:1,duration:.28,stagger:.07 },1.12)
        .fromTo(q('.desk-evidence-check'),{ y:8,autoAlpha:0 },{ y:0,autoAlpha:1,duration:.25 },1.3);
    }
    return tl;
  }
  function stopReplay() { replayContext?.revert(); replayContext = null; }
  function stopAction() { actionContext?.revert(); actionContext = null; flight?.remove(); flight = null; }
  function show(index,instant) {
    stopReplay(); stopAction(); manualContext?.revert(); manualContext = null;
    const previous = active, fromAnchor = { ...anchors[previous] }; select(index); measure();
    if (!gsap) { placeToken(index); return; }
    manualContext = gsap.context(() => {
      gsap.set(panels,{ autoAlpha:0,x:0,y:0,rotationY:0,scale:1 }); gsap.set(panels[index],{ autoAlpha:1 });
      gsap.set(copies,{ autoAlpha:0,y:0 }); gsap.set(copies[index],{ autoAlpha:1 });
      if (instant) placeToken(index);
      else gsap.timeline({ defaults:{ ease:'power3.out',immediateRender:false } })
        .fromTo(panels[index],{ y:15,autoAlpha:.25 },{ y:0,autoAlpha:1,duration:.3 },0)
        .fromTo(copies[index],{ y:7,autoAlpha:.2 },{ y:0,autoAlpha:1,duration:.22 },0)
        .fromTo(token,{ x:fromAnchor.x,y:fromAnchor.y },{ x:anchors[index].x,y:anchors[index].y,duration:.6,ease:'power3.inOut' },0)
        .add(choreography(index),.08);
    },stage);
    if (innerWidth <= 600) document.dispatchEvent(new Event('tail:layout-change'));
  }
  const localTransition = (element,keyboard) => {
    if (!gsap || reduced || keyboard) return;
    actionContext = gsap.context(() => {
      gsap.fromTo(element,{ y:7,autoAlpha:.3 },{ y:0,autoAlpha:1,duration:.22,ease:'power3.out' });
    },stage);
  };
  function flyEvent(button,value,keyboard) {
    if (!gsap || reduced || keyboard) return;
    const origin = localRect(button.querySelector('.desk-event-icon') || button), destination = anchors[2];
    flight = document.createElement('span'); flight.className = 'desk-flight'; flight.setAttribute('aria-hidden','true');
    flight.innerHTML = `<svg class="ico"><use href="${value === 'coupon' ? '#i-clock' : '#i-file'}"/></svg>`;
    canvas.append(flight); const current = flight;
    actionContext.add(() => gsap.timeline({ onComplete:() => { current.remove(); if (flight === current) flight = null; } })
      .fromTo(current,{ x:origin.x,y:origin.y,rotation:-8,scale:1,autoAlpha:1 },{ x:destination.x - 6,y:destination.y + 3,rotation:0,scale:.75,duration:.52,ease:'power3.inOut' })
      .to(current,{ autoAlpha:0,duration:.12 }));
  }
  function traceSource(keyboard) {
    const button = localRect(stage.querySelector('[data-desk-source]')), paper = localRect(stage.querySelector('.desk-evidence'));
    const quote = localRect(stage.querySelector('.desk-evidence blockquote'));
    const path = stage.querySelector('.desk-answer-link path'), x = paper.x + paper.width + 18;
    path.setAttribute('d',`M${button.x} ${button.y + button.height / 2}H${x}V${quote.y + quote.height / 2}H${paper.x + paper.width}`);
    if (!gsap || reduced || keyboard || innerWidth <= 600) return;
    const length = path.getTotalLength();
    actionContext.add(() => gsap.fromTo(path,{ strokeDasharray:length,strokeDashoffset:length },{ strokeDashoffset:0,duration:.55,ease:'power3.inOut' }));
  }
  function toggleGroup(selector,key,value) {
    stage.querySelectorAll(selector).forEach(element => {
      const chosen = element.dataset[key] === value;
      element.classList.toggle('is-active',chosen); element.setAttribute('aria-hidden',String(!chosen)); element.inert = !chosen;
    });
  }
  const navigate = event => {
    const button = event.target.closest('button'); if (!button || !stage.contains(button)) return;
    const keyboard = event.detail === 0;
    if (button.hasAttribute('data-workspace-step')) {
      stopReplay(); stopAction();
      const index = Number(button.dataset.workspaceStep), trigger = main?.scrollTrigger;
      if (trigger) {
        const time = main.labels[`workspace-${index}`];
        const top = trigger.start + time / main.duration() * (trigger.end - trigger.start);
        window.scrollTo({ top,behavior:keyboard ? 'instant' : 'smooth' });
        if (keyboard) { trigger.getTween()?.pause(); main.time(time); select(index); }
      } else {
        const instant = keyboard || reduced || !productVisible;
        pendingIntro = !instant ? false : !keyboard && !reduced; show(index,instant);
      }
      return;
    }
    if (button.hasAttribute('data-desk-replay')) {
      stopReplay(); stopAction();
      if (reduced || keyboard || !gsap) { if (!main) show(active,true); return; }
      replayContext = gsap.context(() => { gsap.timeline().add(choreography(active)); },stage); return;
    }
    stopAction();
    if (button.dataset.deskExposure) {
      const value = button.dataset.deskExposure, arc = stage.querySelector('.desk-allocation-bond');
      const previous = parseFloat(getComputedStyle(arc).strokeDashoffset), next = value === 'business' ? -30 : -50;
      arc.setAttribute('stroke-dashoffset',String(next)); stage.querySelector('.desk-exposure').dataset.exposure = value;
      stage.querySelectorAll('[data-desk-exposure]').forEach(b => b.setAttribute('aria-pressed',String(b === button)));
      localTransition(stage.querySelector('.desk-allocation-result'),keyboard);
      actionContext?.add(() => gsap.fromTo(arc,{ strokeDashoffset:previous },{ strokeDashoffset:next,duration:.55,ease:'power3.inOut' }));
    } else if (button.dataset.deskMetric) {
      const value = button.dataset.deskMetric, before = [...stage.querySelectorAll('.desk-metric.is-active .desk-bar-reveal i')].map(bar => bar.offsetHeight);
      stage.querySelectorAll('[data-desk-metric]').forEach(b => b.setAttribute('aria-pressed',String(b === button)));
      stage.querySelectorAll('[data-document-metric]').forEach(row => row.classList.toggle('is-selected',row.dataset.documentMetric === value));
      toggleGroup('[data-metric]','metric',value); localTransition(stage.querySelector(`[data-metric="${value}"]`),keyboard);
      const bars = [...stage.querySelectorAll(`[data-metric="${value}"] .desk-bar-reveal i`)], after = bars.map(bar => bar.offsetHeight);
      actionContext?.add(() => gsap.fromTo(bars,{ scaleY:index => before[index] / after[index],transformOrigin:'bottom' },{ scaleY:1,duration:.5,stagger:.055,ease:'power3.inOut' }));
    } else if (button.dataset.deskEvent) {
      const value = button.dataset.deskEvent;
      stage.querySelectorAll('.desk-event').forEach(b => { const chosen = b.dataset.deskEvent === value; b.classList.toggle('is-active',chosen); b.setAttribute('aria-pressed',String(chosen)); });
      toggleGroup('[data-event-detail]','eventDetail',value); localTransition(stage.querySelector(`[data-event-detail="${value}"]`),keyboard);
      flyEvent(button,value,keyboard);
    } else if (button.dataset.deskQuestion) {
      const value = button.dataset.deskQuestion;
      stage.querySelectorAll('[data-desk-question]').forEach(b => b.setAttribute('aria-pressed',String(b === button)));
      toggleGroup('[data-answer]','answer',value); localTransition(stage.querySelector(`[data-answer="${value}"]`),keyboard);
    } else if (button.hasAttribute('data-desk-source')) {
      const open = button.getAttribute('aria-expanded') !== 'true';
      button.setAttribute('aria-expanded',String(open)); detail.hidden = !open;
      stage.querySelector('.desk-evidence').classList.toggle('is-open',open); panels[3].classList.toggle('is-source-open',open);
      if (open) { localTransition(detail,keyboard); traceSource(keyboard); }
      if (innerWidth <= 600) document.dispatchEvent(new Event('tail:layout-change'));
    } else if (button.hasAttribute('data-desk-save')) {
      const saved = button.getAttribute('aria-pressed') !== 'true'; button.setAttribute('aria-pressed',String(saved));
      button.querySelector('span').textContent = saved ? 'В плане наблюдения' : 'Следить за долгом';
      button.querySelector('use').setAttribute('href',saved ? '#i-check' : '#i-bell');
    }
  };
  const visibility = () => {
    if (!document.hidden) return; stopReplay(); stopAction();
    if (main) main.scrollTrigger?.getTween()?.pause(); else { pendingIntro = false; show(active,true); }
  };
  const resized = () => { if (!main) { measure(); placeToken(active); } };
  measure(); select(0); placeToken(0);
  stage.addEventListener('click',navigate); document.addEventListener('visibilitychange',visibility);
  window.addEventListener('scroll',stopReplay,{ passive:true });
  window.addEventListener('resize',resized,{ passive:true });
  if (gsap && ScrollTrigger && desktop && !reduced) {
    mainContext = gsap.context(() => {
      gsap.set(panels,{ autoAlpha:0 }); gsap.set(panels[0],{ autoAlpha:1 }); gsap.set(copies,{ autoAlpha:0 }); gsap.set(copies[0],{ autoAlpha:1 });
      main = gsap.timeline({ defaults:{ ease:'power3.out',immediateRender:false },scrollTrigger:{
        id:'tail-workspace',trigger:stage,pin:true,start:'top 96px',end:() => `+=${Math.round(innerHeight * 5.6)}`,scrub:.4,invalidateOnRefresh:true,onRefreshInit:measure,
      },onUpdate() {
        const time = this.time(), next = time < starts[1] ? 0 : time < starts[2] ? 1 : time < starts[3] ? 2 : 3;
        if (next !== active) select(next);
      } });
      panels.forEach((panel,index) => {
        const start = starts[index];
        if (index) main.to(panels[index - 1],{ x:-28,y:-8,autoAlpha:0,scale:.985,duration:.35 },start - .38)
          .to(copies[index - 1],{ y:-8,autoAlpha:0,duration:.25 },start - .35)
          .fromTo(panel,{ x:40,y:18,autoAlpha:0,scale:.985 },{ x:0,y:0,autoAlpha:1,scale:1,duration:.55 },start - .15)
          .fromTo(copies[index],{ y:10,autoAlpha:0 },{ y:0,autoAlpha:1,duration:.3 },start)
          .to(token,{ x:() => anchors[index].x,y:() => anchors[index].y,duration:.8,ease:'power3.inOut' },start - .25);
        main.add(choreography(index),start).addLabel(`workspace-${index}`,checkpoints[index]);
      });
      main.to({},{ duration:1.6 },checkpoints[3]);
    },stage);
  } else {
    show(0,true);
    if (gsap && !reduced && 'IntersectionObserver' in window) {
      observer = new IntersectionObserver(entries => {
        if (disposed) return; productVisible = entries[0].intersectionRatio >= .25;
        if (productVisible && pendingIntro) { pendingIntro = false; if (!document.body.classList.contains('keyboard-input')) show(active,false); }
      },{ threshold:[0,.25] }); observer.observe(stage.querySelector('.desk-window'));
    } else productVisible = true;
  }
  return () => {
    disposed = true; observer?.disconnect(); stopReplay(); stopAction(); manualContext?.revert(); mainContext?.revert();
    stage.removeEventListener('click',navigate); document.removeEventListener('visibilitychange',visibility); window.removeEventListener('scroll',stopReplay); window.removeEventListener('resize',resized);
    detailHome.insertBefore(detail,detailNext); token.style.removeProperty('transform'); select(0);
  };
}
