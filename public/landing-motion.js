import { mountMarketExperience } from './market-experience.js';
// Local GSAP bundles: no third-party request is needed to play the example.
export async function initializeLandingMotion() {
  const story = document.querySelector('.story-section');
  if (!story) return;
  const initialHash = location.hash;
  let userInteracted = false;
  const markInteraction = () => { userInteracted = true; };
  ['pointerdown', 'keydown', 'wheel', 'touchstart'].forEach(name => addEventListener(name, markInteraction, { once: true, passive: true }));

  const layers = [...story.querySelectorAll('[data-story-scene]')];
  const copies = [...story.querySelectorAll('[data-story-copy]')];
  const navigation = [...story.querySelectorAll('[data-story-step]')];
  const counter = story.querySelector('#story-current-step');
  let active = 0;
  let scrollTimeline;
  let gsap;
  let manualTween;
  let media;
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');

  function select(index) {
    active = index;
    layers.forEach((layer, number) => {
      const selected = number === index;
      layer.classList.toggle('is-active', selected);
      layer.setAttribute('aria-hidden', String(!selected));
      layer.inert = !selected;
      copies[number].classList.toggle('is-active', selected);
      copies[number].setAttribute('aria-hidden', String(!selected));
      navigation[number].classList.toggle('is-active', selected);
      navigation[number].setAttribute('aria-pressed', String(selected));
    });
    counter.textContent = String(index + 1).padStart(2, '0');
  }

  function showManual(index, instant = false) {
    const previous = active;
    manualTween?.kill();
    select(index);
    if (!gsap) return;
    gsap.set(layers, { autoAlpha: 0, y: 0, scale: 1 });
    if (instant || reducedMotion.matches || previous === index) {
      gsap.set(layers[index], { autoAlpha: 1 });
    } else {
      // A short, interruptible state response on touch; keyboard changes are instant.
      manualTween = gsap.fromTo(layers[index], { autoAlpha: 0, y: 8 }, {
        autoAlpha: 1, y: 0, duration: 0.2, ease: 'power3.out', overwrite: true,
      });
    }
  }

  function goToStep(event) {
    const button = event.target.closest('[data-story-step], [data-story-goto]');
    if (!button) return;
    const index = Number(button.dataset.storyStep ?? button.dataset.storyGoto);
    if (!Number.isInteger(index) || !layers[index]) return;
    // Keep focus outside a panel that is about to become inert.
    if (button.hasAttribute('data-story-goto')) navigation[index].focus({ preventScroll: true });
    const trigger = scrollTimeline?.scrollTrigger;
    if (trigger) {
      // Buttons land after the entrance; scrolling can still explore the transition itself.
      const time = scrollTimeline.labels[`scene-${index}`];
      const target = trigger.start + (time / scrollTimeline.duration()) * (trigger.end - trigger.start);
      window.scrollTo({ top: target, behavior: event.detail === 0 ? 'instant' : 'smooth' });
      if (event.detail === 0) {
        trigger.getTween()?.pause();
        scrollTimeline.time(time);
        select(index);
      }
    } else {
      showManual(index, event.detail === 0);
    }
  }

  document.body.classList.add('story-enhanced');
  select(0);
  story.addEventListener('click', goToStep);

  try {
    gsap = window.gsap;
    const ScrollTrigger = window.ScrollTrigger;
    if (!gsap || !ScrollTrigger) {
      mountMarketExperience({ reduced: true, fine: false });
      return;
    }
    gsap.registerPlugin(ScrollTrigger);
    media = gsap.matchMedia();

    media.add({
      all: 'all',
      desktop: '(min-width: 901px) and (min-height: 710px)',
      guideWide: '(min-width: 1101px)',
      reduced: '(prefers-reduced-motion: reduce)',
      fine: '(hover: hover) and (pointer: fine)',
    }, context => {
      const { desktop, reduced, fine } = context.conditions;
      let removeParallax = () => {};
      let removeMarketExperience = () => {};
      scrollTimeline = null;
      document.body.classList.toggle('scroll-story-desktop', desktop && !reduced);

      if (!reduced) {
        const intro = gsap.timeline({ defaults: { ease: 'power3.out' } });
        intro.fromTo('.intro-copy .hero-reveal', { y: 22, autoAlpha: 0 }, {
          y: 0, autoAlpha: 1, duration: 0.7, stagger: 0.065,
        }).fromTo('.hero-device', { y: 38, rotateX: 4, scale: 0.98, autoAlpha: 0 }, {
          y: 0, rotateX: 0, scale: 1, autoAlpha: 1, duration: 0.95,
        }, 0.22).fromTo('.hero-float', { y: 24, autoAlpha: 0 }, {
          y: 0, autoAlpha: 1, duration: 0.7, stagger: 0.08,
        }, 0.65);
      }

      if (desktop && !reduced) {
        const visual = story.querySelector('.story-visual');
        const pointer = story.querySelector('.demo-pointer');
        const ripple = pointer.querySelector('.pointer-ripple');
        const note = story.querySelector('.story-floating-note');
        const markers = [...story.querySelectorAll('.source-marker')];
        const targets = [story.querySelector('.story-open'), story.querySelector('.story-source-button'), story.querySelector('.story-history-button')];
        // offset coordinates ignore the entrance transforms on hidden cards. The SVG
        // pointer's tip is at (4, 3) in its 24px viewBox, so that tip lands in the control.
        const pointAt = target => {
          let x = target.offsetWidth / 2, y = target.offsetHeight / 2;
          for (let element = target; element && element !== visual; element = element.offsetParent) {
            x += element.offsetLeft; y += element.offsetTop;
          }
          return { x: x - 4.33, y: y - 3.5 };
        };
        let targetPoints = targets.map(pointAt);
        gsap.set(layers, { autoAlpha: 0, y: 30, scale: 0.98 });
        gsap.set(layers[0], { autoAlpha: 1, y: 0, scale: 1 });
        gsap.set(markers, { scaleX: 0 });
        gsap.set(pointer, { x: targetPoints[0].x + 45, y: targetPoints[0].y + 30, autoAlpha: 0 });

        // One timeline owns the story. The wrapper is pinned; only its children move.
        const timeline = gsap.timeline({
          defaults: { ease: 'power3.out' },
          scrollTrigger: {
            id: 'tail-story', trigger: '.story-pin', pin: true,
            start: 'top 100px', end: () => `+=${Math.round(window.innerHeight * 3.2)}`,
            scrub: 0.5, anticipatePin: 1, invalidateOnRefresh: true,
            onRefreshInit: () => { targetPoints = targets.map(pointAt); },
          },
          onUpdate() {
            const time = this.time();
            const next = time < 1.3 ? 0 : time < 2.75 ? 1 : time < 4.25 ? 2 : 3;
            if (next !== active) select(next);
          },
        });
        const arrivals = [0, 1.5, 2.95, 4.45];
        [0.88, 2.33, 3.99, 4.85].forEach((time, index) => timeline.addLabel(`scene-${index}`, time));
        for (let index = 1; index < layers.length; index++) {
          const start = arrivals[index] - 0.32;
          timeline.to(layers[index - 1], { autoAlpha: 0, y: -18, scale: 0.985, duration: 0.22 }, start)
            .fromTo(layers[index], { autoAlpha: 0, y: 30, scale: 0.98 }, {
              autoAlpha: 1, y: 0, scale: 1, duration: 0.4,
            }, start + 0.12);
        }
        timeline.to(note, { autoAlpha: 0, y: -10, duration: 0.22 }, 1.1)
          .to(pointer, { autoAlpha: 1, duration: 0.15 }, 0.25);
        // Each click is a visual response on a real control, immediately before
        // the associated state change. No synthetic clicks or outbound requests.
        [0.35, 1.8, 3.45].forEach((start, index) => {
          timeline.to(pointer, { x: () => targetPoints[index].x, y: () => targetPoints[index].y, duration: 0.5 }, start)
            .fromTo(ripple, { autoAlpha: 0.55, scale: 0.7 }, { autoAlpha: 0, scale: 1.8, duration: 0.24 }, start + 0.65)
            .to(targets[index], { scale: 0.98, duration: 0.1 }, start + 0.65)
            .to(targets[index], { scale: 1, duration: 0.12 }, start + 0.75);
        });
        timeline.to(pointer, { autoAlpha: 0, duration: 0.1 }, 1.18)
          .set(pointer, { x: () => targetPoints[1].x + 30, y: () => targetPoints[1].y + 20 }, 1.55)
          .to(pointer, { autoAlpha: 1, duration: 0.12 }, 1.8)
          .to(pointer, { autoAlpha: 0, duration: 0.1 }, 2.63)
          .set(pointer, { x: () => targetPoints[2].x + 30, y: () => targetPoints[2].y + 20 }, 3.08)
          .to(pointer, { autoAlpha: 1, duration: 0.12 }, 3.45);
        timeline.to(markers, { scaleX: 1, duration: 0.32, ease: 'none' }, 2.9)
          .to(pointer, { autoAlpha: 0, duration: 0.15 }, 4.22)
          .to({}, { duration: 0.6 }, 4.45);
        scrollTimeline = timeline;
      } else {
        showManual(active, true);
      }

      // Create later-page triggers after the story's spacer has been laid out.
      if (!reduced) {
        document.querySelectorAll('.section-intro.reveal, .principle-card.reveal, .hands-on-copy.reveal').forEach(element => {
          gsap.fromTo(element, { y: 22, autoAlpha: 0 }, {
            y: 0, autoAlpha: 1, duration: 0.65, ease: 'power3.out',
            scrollTrigger: { trigger: element, start: 'top 92%', once: true },
          });
        });
      }

      removeMarketExperience = mountMarketExperience({ gsap, ScrollTrigger, reduced, fine });

      if (fine && !reduced) {
        const showcase = document.querySelector('.hero-showcase');
        const cards = [...showcase.querySelectorAll('.float-parallax')];
        const movers = cards.map((card, index) => ({
          x: gsap.quickTo(card, 'x', { duration: 0.5, ease: 'power3.out' }),
          y: gsap.quickTo(card, 'y', { duration: 0.5, ease: 'power3.out' }),
          distance: index ? -8 : 12,
        }));
        let bounds;
        const enter = () => { bounds = showcase.getBoundingClientRect(); };
        const move = event => {
          if (!bounds) enter();
          const x = Math.max(-0.5, Math.min(0.5, (event.clientX - bounds.left) / bounds.width - 0.5));
          const y = Math.max(-0.5, Math.min(0.5, (event.clientY - bounds.top) / bounds.height - 0.5));
          movers.forEach(mover => { mover.x(x * mover.distance); mover.y(y * mover.distance); });
        };
        const leave = () => movers.forEach(mover => { mover.x(0); mover.y(0); });
        showcase.addEventListener('pointerenter', enter);
        showcase.addEventListener('pointermove', move);
        showcase.addEventListener('pointerleave', leave);
        removeParallax = () => {
          showcase.removeEventListener('pointerenter', enter);
          showcase.removeEventListener('pointermove', move);
          showcase.removeEventListener('pointerleave', leave);
          movers.forEach(mover => { mover.x.tween.kill(); mover.y.tween.kill(); });
        };
      }

      return () => {
        removeMarketExperience();
        removeParallax();
        manualTween?.kill();
        scrollTimeline = null;
        document.body.classList.remove('scroll-story-desktop');
        select(active);
      };
    });

    document.fonts.ready.then(() => {
      ScrollTrigger.refresh();
      // Pinned spacing and the compact product scenes change the first layout.
      // Restore an incoming section link once that layout has settled.
      requestAnimationFrame(() => requestAnimationFrame(() => {
        if (!initialHash || location.hash !== initialHash || userInteracted) return;
        try { document.getElementById(decodeURIComponent(initialHash.slice(1)))?.scrollIntoView({ behavior: 'instant', block: 'start' }); }
        catch { /* An invalid fragment does not affect the page. */ }
      }));
    });
    // Changes in the form/FAQ happen below all pinned content. Refreshing while
    // a user scrolls to them can restore an old scroll offset and cause a jump.
    const layoutChanged = () => {
      if (story.getBoundingClientRect().bottom > 0) ScrollTrigger.refresh(true);
    };
    document.addEventListener('tail:layout-change', layoutChanged);
    // A restored bfcache page keeps its context; a real navigation cleans it up.
    window.addEventListener('pagehide', event => {
      if (event.persisted) return;
      media.revert();
      story.removeEventListener('click', goToStep);
      document.removeEventListener('tail:layout-change', layoutChanged);
    }, { once: true });
  } catch (error) {
    media?.revert();
    scrollTimeline = null;
    document.body.classList.remove('scroll-story-desktop');
    console.warn('Анимация недоступна; учебный разбор можно переключать кнопками.', error);
    // The four buttons and the rest of the page remain usable if motion cannot load.
    showManual(active, true);
  }
}
