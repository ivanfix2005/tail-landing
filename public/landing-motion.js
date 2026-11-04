import { mountMarketExperience } from './market-experience.js';
import { mountWorkspace } from './workspace-motion.js';
export async function initializeLandingMotion() {
  const workspace = document.querySelector('.workspace-section'); if (!workspace) return;
  const initialHash = location.hash; let userInteracted = false;
  const markInteraction = () => { userInteracted = true; };
  ['pointerdown', 'keydown', 'wheel', 'touchstart'].forEach(name => addEventListener(name, markInteraction, { once: true, passive: true }));
  const gsap = window.gsap, ScrollTrigger = window.ScrollTrigger;
  if (!gsap || !ScrollTrigger) { mountWorkspace({ reduced: true }); mountMarketExperience({ reduced: true, fine: false }); return; }
  gsap.registerPlugin(ScrollTrigger); const media = gsap.matchMedia();
  media.add({ all: 'all', desktop: '(min-width: 901px) and (min-height: 860px)', guideWide: '(min-width: 1101px)', reduced: '(prefers-reduced-motion: reduce)', fine: '(hover: hover) and (pointer: fine)' }, context => {
    const { desktop, reduced, fine } = context.conditions;
    if (!reduced) gsap.timeline({ defaults: { ease: 'power3.out' } })
      .fromTo('.intro-copy .hero-reveal', { y: 22, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: .7, stagger: .065 })
      .fromTo('.hero-device', { y: 38, rotateX: 4, scale: .98, autoAlpha: 0 }, { y: 0, rotateX: 0, scale: 1, autoAlpha: 1, duration: .95 }, .22)
      .fromTo('.hero-float', { y: 24, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: .7, stagger: .08 }, .65);
    // The workspace owns the only pin. Create triggers in document order.
    const removeWorkspace = mountWorkspace({ gsap, ScrollTrigger, reduced, desktop });
    const removeMarket = mountMarketExperience({ gsap, ScrollTrigger, reduced, fine });
    return () => { removeWorkspace(); removeMarket(); };
  });
  document.fonts.ready.then(() => {
    ScrollTrigger.refresh();
    requestAnimationFrame(() => requestAnimationFrame(() => {
      if (!initialHash || location.hash !== initialHash || userInteracted) return;
      try { document.getElementById(decodeURIComponent(initialHash.slice(1)))?.scrollIntoView({ behavior: 'instant', block: 'start' }); } catch { /* Invalid fragment. */ }
    }));
  });
  const layoutChanged = () => { if (workspace.getBoundingClientRect().bottom > 0) ScrollTrigger.refresh(true); };
  document.addEventListener('tail:layout-change', layoutChanged);
  addEventListener('pagehide', event => { if (event.persisted) return; media.revert(); document.removeEventListener('tail:layout-change', layoutChanged); }, { once: true });
}
