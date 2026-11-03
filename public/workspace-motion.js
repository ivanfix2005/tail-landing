// One explanatory scene, with a manual equivalent on compact/reduced-motion views.
export function mountWorkspace({ gsap, ScrollTrigger, reduced = true, desktop = false }) {
  const stage = document.querySelector('[data-product-workspace]');
  if (!stage) return () => {};
  const panels = [...stage.querySelectorAll('[data-workspace-panel]')];
  const copies = [...stage.querySelectorAll('[data-workspace-copy]')];
  const buttons = [...stage.querySelectorAll('[data-workspace-step]')];
  let active = 0, scrollTimeline, manualTween;
  function select(index) {
    active = index;
    stage.dataset.workspaceScene = String(index);
    panels.forEach((panel, number) => {
      const chosen = number === index;
      panel.classList.toggle('is-active', chosen);
      panel.setAttribute('aria-hidden', String(!chosen)); panel.inert = !chosen;
      copies[number].classList.toggle('is-active', chosen);
      copies[number].setAttribute('aria-hidden', String(!chosen));
      buttons[number].setAttribute('aria-pressed', String(chosen));
    });
  }
  function show(index, instant) {
    manualTween?.kill(); select(index);
    if (!gsap) return;
    gsap.set(panels, { autoAlpha: 0, y: 0, rotationY: 0 });
    gsap.set(copies, { autoAlpha: 0, y: 0 }); gsap.set(copies[index], { autoAlpha: 1 });
    if (instant || reduced) gsap.set(panels[index], { autoAlpha: 1 });
    else manualTween = gsap.fromTo(panels[index], { autoAlpha: 0, y: 10 }, { autoAlpha: 1, y: 0, duration: .22, ease: 'power3.out', overwrite: true });
  }
  const navigate = event => {
    const button = event.target.closest('[data-workspace-step]'); if (!button) return;
    const index = Number(button.dataset.workspaceStep), trigger = scrollTimeline?.scrollTrigger;
    if (trigger) {
      const time = scrollTimeline.labels[`workspace-${index}`];
      const top = trigger.start + time / scrollTimeline.duration() * (trigger.end - trigger.start);
      window.scrollTo({ top, behavior: event.detail === 0 ? 'instant' : 'smooth' });
      if (event.detail === 0) { trigger.getTween()?.pause(); scrollTimeline.time(time); select(index); }
    } else show(index, event.detail === 0);
  };
  stage.addEventListener('click', navigate); select(0);
  if (gsap && desktop && !reduced) {
    gsap.set(panels, { autoAlpha: 0 }); gsap.set(panels[0], { autoAlpha: 1 });
    gsap.set(copies, { autoAlpha: 0 }); gsap.set(copies[0], { autoAlpha: 1 });
    const timeline = gsap.timeline({ defaults: { ease: 'power3.out' }, scrollTrigger: {
      id: 'tail-workspace', trigger: stage, pin: true, start: 'top 96px',
      end: () => `+=${Math.round(innerHeight * 5.6)}`, scrub: .4, invalidateOnRefresh: true,
    }, onUpdate() {
      const time = this.time(), next = time < 2.3 ? 0 : time < 4.8 ? 1 : time < 7.3 ? 2 : 3;
      if (next !== active) select(next);
    } });
    timeline.fromTo(panels[0].querySelectorAll('.portfolio-position'), { y: 20, rotation: index => index % 2 ? 4 : -4 }, { y: 0, rotation: 0, duration: .65, stagger: .06 }, 0)
      .fromTo(panels[0].querySelector('.portfolio-links'), { clipPath: 'inset(0 100% 0 0)' }, { clipPath: 'inset(0 0% 0 0)', duration: .7, ease: 'none' }, .1)
      .fromTo(panels[0].querySelector('.portfolio-hub'), { y: 12, scale: .94 }, { y: 0, scale: 1, duration: .5 }, .3)
      .addLabel('workspace-0', .85);
    // Long settled intervals give each completed screen room to be read.
    [2.1, 4.6, 7.1].forEach((time, number) => {
      const next = number + 1;
      timeline.to(panels[number], { autoAlpha: 0, y: -16, rotationY: -3, duration: .24 }, time)
        .to(copies[number], { autoAlpha: 0, y: -8, duration: .18 }, time)
        .fromTo(panels[next], { autoAlpha: 0, y: 25, rotationY: 4 }, { autoAlpha: 1, y: 0, rotationY: 0, duration: .45 }, time + .14)
        .fromTo(copies[next], { autoAlpha: 0, y: 10 }, { autoAlpha: 1, y: 0, duration: .3 }, time + .16)
        .fromTo(panels[next].querySelectorAll('[data-workspace-arrive]'), { autoAlpha: .2, y: 20 }, { autoAlpha: 1, y: 0, duration: .55, stagger: .12 }, time + .24);
    });
    timeline.fromTo(panels[1].querySelectorAll('.report-row i'), { scaleX: .18 }, { scaleX: 1, duration: .7, stagger: .045 }, 2.55)
      .fromTo(panels[1].querySelector('.report-sheet'), { rotation: -3 }, { rotation: 0, duration: .65 }, 2.4).addLabel('workspace-1', 3.55)
      .fromTo(panels[2].querySelector('.signal-scan'), { rotation: -160 }, { rotation: 70, duration: 1.1, ease: 'none' }, 4.92)
      .fromTo(panels[2].querySelectorAll('.signal-point'), { scale: .5, opacity: .2 }, { scale: 1, opacity: 1, duration: .4, stagger: .2 }, 5.15).addLabel('workspace-2', 6.1)
      .fromTo(panels[3].querySelector('.chat-response'), { clipPath: 'inset(0 0 100% 0)' }, { clipPath: 'inset(0 0 0% 0)', duration: .75, ease: 'none' }, 7.6)
      .fromTo(panels[3].querySelector('.chat-sources'), { y: 9, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: .3 }, 8.1)
      .addLabel('workspace-3', 8.5).to({}, { duration: 1.1 }, 8.5);
    scrollTimeline = timeline;
  } else show(0, true);
  return () => { stage.removeEventListener('click', navigate); manualTween?.kill(); scrollTimeline?.scrollTrigger?.kill(); scrollTimeline?.kill(); };
}
