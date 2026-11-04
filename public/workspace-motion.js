// Explanatory choreography: one owner for scroll, one interruptible owner on compact views.
export function mountWorkspace({ gsap, ScrollTrigger, reduced = true, desktop = false }) {
  const stage = document.querySelector('[data-product-workspace]');
  if (!stage) return () => {};
  const panels = [...stage.querySelectorAll('[data-workspace-panel]')];
  const copies = [...stage.querySelectorAll('[data-workspace-copy]')];
  const buttons = [...stage.querySelectorAll('[data-workspace-step]')];
  const lengths = new Map([...stage.querySelectorAll('.portfolio-connection,.portfolio-beam')].map(path => [path,path.getTotalLength()]));
  const starts = [0,2.6,5.2,7.8], checkpoints = starts.map(time => time + 1.25);
  let active = 0, scrollTimeline, scrollContext, manualContext, observer;
  let productVisible = false, pendingIntro = true, disposed = false;
  function select(index) {
    active = index;
    panels.forEach((panel, number) => {
      const chosen = number === index;
      panel.classList.toggle('is-active',chosen); panel.setAttribute('aria-hidden',String(!chosen)); panel.inert = !chosen;
      copies[number].classList.toggle('is-active',chosen); copies[number].setAttribute('aria-hidden',String(!chosen));
      buttons[number].setAttribute('aria-pressed',String(chosen));
    });
  }
  function scene(index) {
    const panel = panels[index], q = selector => panel.querySelector(selector), all = selector => panel.querySelectorAll(selector);
    const tl = gsap.timeline({ defaults:{ ease:'power3.out', immediateRender:false } });
    if (index === 0) {
      tl.fromTo(all('.portfolio-position'), {
        x:number => number < 2 ? -38 : 38, y:number => number % 2 ? 18 : -18,
        rotationY:number => number < 2 ? 18 : -18, rotation:number => number % 2 ? 5 : -5, scale:.94, autoAlpha:.2,
      }, { x:0, y:0, rotationY:0, rotation:0, scale:1, autoAlpha:1, duration:.48, stagger:.065 },0)
        .fromTo(q('.portfolio-hub'),{ y:15, rotationY:-65, scale:.92, autoAlpha:.2 },{ y:0, rotationY:0, scale:1, autoAlpha:1, duration:.55 },.16);
      all('.portfolio-connection').forEach((path,number) => {
        const length = lengths.get(path);
        tl.fromTo(path,{ strokeDasharray:length, strokeDashoffset:length },{ strokeDashoffset:0, duration:.44, ease:'none' },.32 + number % 2 * .1);
      });
      all('.portfolio-beam').forEach((path,number) => {
        const length = lengths.get(path), time = .63 + number % 2 * .12;
        tl.set(path,{ strokeDasharray:`12 ${length + 12}`, opacity:1 },time)
          .fromTo(path,{ strokeDashoffset:0 },{ strokeDashoffset:-length, duration:.48, ease:'none' },time)
          .to(path,{ opacity:0, duration:.08 },time + .4);
      });
      all('.hub-pulse').forEach((ring,number) => tl.fromTo(ring,{ scale:.82, autoAlpha:.65 },{ scale:1.45, autoAlpha:0, duration:.3 },.94 + number * .12));
      tl.fromTo(q('.portfolio-insight'),{ y:8, autoAlpha:0, clipPath:'inset(0 6% 0 0)' },{ y:0, autoAlpha:1, clipPath:'inset(0 0% 0 0)', duration:.28 },1.04);
    } else if (index === 1) {
      tl.fromTo(all('.report-leaf'),{ y:18, rotation:0, scale:.97, autoAlpha:.2 },{ y:0, rotation:number => number ? 2 : -2, scale:1, autoAlpha:1, duration:.5, stagger:.06 },0)
        .fromTo(q('.report-sheet'),{ y:22, rotationX:18, rotation:-4, autoAlpha:.25 },{ y:0, rotationX:0, rotation:0, autoAlpha:1, duration:.62 },.08)
        .fromTo(all('.report-row'),{ x:12, autoAlpha:.2 },{ x:0, autoAlpha:1, duration:.28, stagger:.1 },.35)
        .fromTo(all('.report-row i'),{ scaleX:.18 },{ scaleX:1, duration:.5, stagger:.045 },.43);
      const travel = Math.max(70,q('.report-sheet').offsetHeight - 65);
      tl.fromTo(q('.report-scan'),{ y:-12, autoAlpha:0 },{ y:travel, autoAlpha:.8, duration:.6, ease:'none' },.42)
        .to(q('.report-scan'),{ autoAlpha:0, duration:.12 },.98)
        .fromTo(q('.report-annotation'),{ x:18, y:7, autoAlpha:0 },{ x:0, y:0, autoAlpha:1, duration:.32 },.99)
        .fromTo(q('.report-annotation .ico'),{ scale:.75, rotation:-25 },{ scale:1, rotation:0, duration:.25 },1.1);
    } else if (index === 2) {
      tl.fromTo(q('.signal-orbit'),{ rotation:-8, scale:.94, autoAlpha:.35 },{ rotation:0, scale:1, autoAlpha:1, duration:.4 },0)
        .fromTo(all('.signal-orbit > i'),{ scale:.75, autoAlpha:.2 },{ scale:1, autoAlpha:1, duration:.45, stagger:.06 },.02)
        .fromTo(q('.signal-scan'),{ rotation:-360 },{ rotation:0, duration:1.15, ease:'none' },.12);
      all('.signal-ripple').forEach((ring,number) => tl.fromTo(ring,{ scale:.65, autoAlpha:.6 },{ scale:1.28, autoAlpha:0, duration:.45 },.18 + number * .38));
      all('.signal-point').forEach((point,number) => tl.fromTo(point,{ scale:.5, autoAlpha:.1 },{ scale:1, autoAlpha:1, duration:.23 },number ? .66 : .3));
      all('.signal-list > div').forEach((row,number) => {
        const time = [.38,.75,1.04][number];
        tl.fromTo(row,{ x:24, autoAlpha:0 },{ x:0, autoAlpha:1, duration:.28 },time)
          .fromTo(row.querySelector('.signal-dot'),{ scale:.6 },{ scale:1, duration:.2 },time + .12);
      });
      tl.fromTo(q('.workspace-insight'),{ y:7, autoAlpha:0 },{ y:0, autoAlpha:1, duration:.25 },1.13);
    } else {
      tl.fromTo(q('.chat-question'),{ x:20, y:12, scale:.96, autoAlpha:.25 },{ x:0, y:0, scale:1, autoAlpha:1, duration:.28 },0)
        .set(q('.chat-response'),{ autoAlpha:0 },0)
        .fromTo(q('.chat-thinking'),{ y:5, autoAlpha:0 },{ y:0, autoAlpha:1, duration:.16 },.22)
        .fromTo(all('.chat-thinking i'),{ y:0 },{ y:-4, duration:.16, repeat:1, yoyo:true, stagger:.07, ease:'power2.inOut' },.27)
        .to(q('.chat-thinking'),{ autoAlpha:0, duration:.12 },.62)
        .fromTo(q('.chat-response'),{ y:8, autoAlpha:0 },{ y:0, autoAlpha:1, duration:.2 },.68)
        .fromTo(all('.chat-sentence'),{ clipPath:'inset(0 0 100% 0)', autoAlpha:.1 },{ clipPath:'inset(0 0 0% 0)', autoAlpha:1, duration:.32, stagger:.16, ease:'none' },.72)
        .fromTo(all('.chat-sources > span'),{ y:8, x:12, rotation:-4, autoAlpha:0 },{ y:0, x:0, rotation:0, autoAlpha:1, duration:.22, stagger:.07 },1)
        .fromTo(q('.expectation-note'),{ y:15, autoAlpha:0 },{ y:0, autoAlpha:1, duration:.25 },1.14)
        .fromTo(q('.expectation-note > svg:last-child'),{ scale:.7, rotation:-25, autoAlpha:0 },{ scale:1, rotation:0, autoAlpha:1, duration:.2 },1.22);
    }
    return tl;
  }
  function show(index, instant) {
    manualContext?.revert(); manualContext = null; select(index);
    if (!gsap) return;
    manualContext = gsap.context(() => {
      gsap.set(panels,{ autoAlpha:0, x:0, y:0, rotationY:0, scale:1 }); gsap.set(panels[index],{ autoAlpha:1 });
      gsap.set(copies,{ autoAlpha:0, y:0 }); gsap.set(copies[index],{ autoAlpha:1 });
      if (!instant && !reduced) gsap.timeline({ defaults:{ ease:'power3.out' } })
        .fromTo(panels[index],{ autoAlpha:.4, y:10 },{ autoAlpha:1, y:0, duration:.2 },0).add(scene(index),.04);
    },stage);
  }
  const navigate = event => {
    const button = event.target.closest('[data-workspace-step]'); if (!button) return;
    const index = Number(button.dataset.workspaceStep), trigger = scrollTimeline?.scrollTrigger;
    if (trigger) {
      const time = scrollTimeline.labels[`workspace-${index}`];
      const top = trigger.start + time / scrollTimeline.duration() * (trigger.end - trigger.start);
      window.scrollTo({ top, behavior:event.detail === 0 ? 'instant' : 'smooth' });
      if (event.detail === 0) { trigger.getTween()?.pause(); scrollTimeline.time(time); select(index); }
    } else {
      const instant = event.detail === 0 || reduced || !productVisible;
      pendingIntro = event.detail > 0 && !reduced && !productVisible; show(index,instant);
    }
  };
  const visibility = () => {
    if (document.hidden && !scrollTimeline) { pendingIntro = false; show(active,true); }
    else if (document.hidden) scrollTimeline.scrollTrigger?.getTween()?.pause();
  };
  stage.addEventListener('click',navigate); document.addEventListener('visibilitychange',visibility); select(0);
  if (gsap && desktop && !reduced) {
    scrollContext = gsap.context(() => {
      gsap.set(panels,{ autoAlpha:0 }); gsap.set(panels[0],{ autoAlpha:1 });
      gsap.set(copies,{ autoAlpha:0 }); gsap.set(copies[0],{ autoAlpha:1 });
      const timeline = gsap.timeline({ defaults:{ ease:'power3.out', immediateRender:false }, scrollTrigger:{
        id:'tail-workspace', trigger:stage, pin:true, start:'top 96px',
        end:() => `+=${Math.round(innerHeight * 5.6)}`, scrub:.4, invalidateOnRefresh:true,
      }, onUpdate() {
        const time = this.time(), next = time < starts[1] ? 0 : time < starts[2] ? 1 : time < starts[3] ? 2 : 3;
        if (next !== active) select(next);
      } });
      panels.forEach((panel,index) => {
        const start = starts[index];
        if (index) timeline.to(panels[index - 1],{ autoAlpha:0, x:-18, y:-8, rotationY:-8, scale:.985, duration:.22 },start - .25)
          .to(copies[index - 1],{ autoAlpha:0, y:-8, duration:.18 },start - .25)
          .fromTo(panel,{ autoAlpha:0, x:28, y:18, rotationY:9, scale:.975 },{ autoAlpha:1, x:0, y:0, rotationY:0, scale:1, duration:.4 },start - .08)
          .fromTo(copies[index],{ autoAlpha:0, y:10 },{ autoAlpha:1, y:0, duration:.3 },start)
          .fromTo(stage.querySelector('.workspace-window'),{ rotationY:1.2, rotationX:.6 },{ rotationY:0, rotationX:0, duration:.5 },start - .08);
        timeline.add(scene(index).timeScale(1.3),start).addLabel(`workspace-${index}`,checkpoints[index]);
      });
      timeline.to({},{ duration:1.25 },checkpoints[3]); scrollTimeline = timeline;
    },stage);
  } else {
    show(0,true);
    if (gsap && !reduced && 'IntersectionObserver' in window) {
      observer = new IntersectionObserver(entries => {
        if (disposed) return;
        productVisible = entries[0].intersectionRatio >= .25;
        if (productVisible && pendingIntro) { pendingIntro = false; if (!document.body.classList.contains('keyboard-input')) show(active,false); }
      },{ threshold:[0,.25] }); observer.observe(stage.querySelector('.workspace-window'));
    } else productVisible = true;
  }
  return () => {
    disposed = true; observer?.disconnect(); stage.removeEventListener('click',navigate); document.removeEventListener('visibilitychange',visibility);
    manualContext?.revert(); scrollContext?.revert(); select(0);
  };
}
