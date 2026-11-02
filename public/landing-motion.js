// Local GSAP bundles: no third-party request is needed to play the demo.
export async function initializeLandingMotion() {
  const story = document.querySelector('.story-section');
  if (!story) return;

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
    if (!gsap || !ScrollTrigger) return;
    gsap.registerPlugin(ScrollTrigger);
    media = gsap.matchMedia();

    media.add({
      all: 'all',
      desktop: '(min-width: 901px) and (min-height: 710px)',
      reduced: '(prefers-reduced-motion: reduce)',
      fine: '(hover: hover) and (pointer: fine)',
    }, context => {
      const { desktop, reduced, fine } = context.conditions;
      let removeParallax = () => {};
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
        gsap.set(layers, { autoAlpha: 0, y: 30, scale: 0.98 });
        gsap.set(layers[0], { autoAlpha: 1, y: 0, scale: 1 });
        gsap.set(markers, { scaleX: 0 });
        gsap.set(pointer, { x: visual.clientWidth * 0.71, y: visual.clientHeight * 0.73, autoAlpha: 0 });

        // One timeline owns the story. The wrapper is pinned; only its children move.
        const timeline = gsap.timeline({
          defaults: { ease: 'power3.out' },
          scrollTrigger: {
            id: 'tail-story', trigger: '.story-pin', pin: true,
            start: 'top 112px', end: () => `+=${Math.round(window.innerHeight * 2.8)}`,
            scrub: 0.5, anticipatePin: 1, invalidateOnRefresh: true,
          },
          onUpdate() {
            const time = this.time();
            const next = time < 1.1 ? 0 : time < 2.35 ? 1 : time < 3.6 ? 2 : 3;
            if (next !== active) select(next);
          },
        });
        const arrivals = [0, 1.35, 2.6, 3.85];
        [0, 1.75, 3.3, 4.25].forEach((time, index) => timeline.addLabel(`scene-${index}`, time));
        for (let index = 1; index < layers.length; index++) {
          const start = arrivals[index] - 0.4;
          timeline.to(layers[index - 1], { autoAlpha: 0, y: -18, scale: 0.985, duration: 0.22 }, start)
            .fromTo(layers[index], { autoAlpha: 0, y: 30, scale: 0.98 }, {
              autoAlpha: 1, y: 0, scale: 1, duration: 0.4,
            }, start + 0.12);
        }
        timeline.to(note, { autoAlpha: 0, y: -10, duration: 0.22 }, 0.9)
          .to(pointer, { autoAlpha: 1, duration: 0.15 }, 0.3)
          .to(pointer, {
            x: () => visual.clientWidth * 0.65,
            y: () => visual.clientHeight * 0.77,
            duration: 0.5,
          }, 0.3)
          .fromTo(ripple, { autoAlpha: 0.55, scale: 0.7 }, { autoAlpha: 0, scale: 1.8, duration: 0.24 }, 0.84)
          .to(pointer, {
            x: () => visual.clientWidth * 0.72,
            y: () => visual.clientHeight * 0.83,
            duration: 0.55,
          }, 1.65)
          .fromTo(ripple, { autoAlpha: 0.55, scale: 0.7 }, { autoAlpha: 0, scale: 1.8, duration: 0.24 }, 2.14)
          .to(pointer, {
            x: () => visual.clientWidth * 0.76,
            y: () => visual.clientHeight * 0.57,
            duration: 0.5,
          }, 2.55)
          .to(markers, { scaleX: 1, duration: 0.38, stagger: 0.08, ease: 'none' }, 2.78)
          .to(pointer, { autoAlpha: 0, duration: 0.2 }, 3.45)
          .to({}, { duration: 0.65 }, 3.85);
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
        removeParallax();
        manualTween?.kill();
        scrollTimeline = null;
        document.body.classList.remove('scroll-story-desktop');
        select(active);
      };
    });

    document.fonts.ready.then(() => ScrollTrigger.refresh());
    const layoutChanged = () => ScrollTrigger.refresh(true);
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
