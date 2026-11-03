// Decorative brand geometry. No market data, controls or scroll positions are
// changed; only visible, bounded fragments animate on the compositor.
export function initializeAtmosphere() {
  // clientWidth excludes the scrollbar; 100vw would create an 8px side overflow
  // when a full-width layer is centred inside the narrower content container.
  const sizeCanvas = () => document.documentElement.style.setProperty('--ambient-viewport-width', `${document.documentElement.clientWidth}px`);
  sizeCanvas();
  addEventListener('resize', sizeCanvas, { passive: true });
  const scenes = [
    ['.intro-section', 'hero'], ['#coverage', 'coverage'], ['#story', 'story'],
    ['.story-pin', 'pinned'], ['#company-chart', 'market'], ['#approach', 'benefits'],
    ['#example', 'example'], ['#survey', 'survey'], ['#faq', 'faq'], ['.landing-footer', 'footer'],
  ];
  for (const [selector, tone] of scenes) {
    const host = document.querySelector(selector);
    if (!host || host.querySelector(':scope > .section-atmosphere')) continue;
    host.classList.add('atmosphere-scene');
    const layer = document.createElement('div');
    layer.className = `section-atmosphere ambient-${tone}`;
    layer.setAttribute('aria-hidden', 'true');
    layer.inert = true;
    layer.innerHTML = `
      <div class="ambient-fragment ambient-fragment-left" data-ambient-reveal><div class="ambient-float">
        <span class="ambient-dotmesh"></span><span class="ambient-pane ambient-pane-back"></span><span class="ambient-pane ambient-pane-front"></span>
      </div></div>
      <div class="ambient-fragment ambient-fragment-right" data-ambient-reveal><div class="ambient-float">
        <span class="ambient-arc ambient-arc-back"></span><span class="ambient-arc ambient-arc-front"></span><span class="ambient-pearl"></span><span class="ambient-spark"></span>
      </div></div>
      <div class="ambient-ticks" data-ambient-reveal><span></span><span></span><span></span></div>`;
    host.prepend(layer);
  }
  const fragments = [...document.querySelectorAll('[data-ambient-reveal]')];
  const preference = matchMedia('(prefers-reduced-motion: reduce)');
  let observer;
  function visibilityChanged() {
    document.body.classList.toggle('ambient-paused', document.hidden || preference.matches);
  }
  function observe() {
    observer?.disconnect();
    visibilityChanged();
    const enabled = !preference.matches && 'IntersectionObserver' in window;
    document.body.classList.toggle('has-atmosphere-motion', enabled);
    if (!enabled) {
      fragments.forEach(fragment => fragment.classList.add('is-revealed'));
      return;
    }
    observer = new IntersectionObserver(entries => {
      for (const entry of entries) {
        entry.target.classList.toggle('is-ambient-visible', entry.isIntersecting);
        if (entry.isIntersecting) entry.target.classList.add('is-revealed');
      }
    }, { rootMargin: '80px 0px', threshold: 0 });
    fragments.forEach(fragment => observer.observe(fragment));
  }
  preference.addEventListener('change', observe);
  document.addEventListener('visibilitychange', visibilityChanged);
  addEventListener('pageshow', visibilityChanged);
  addEventListener('pagehide', event => {
    document.body.classList.add('ambient-paused');
    if (event.persisted) return;
    observer?.disconnect();
    preference.removeEventListener('change', observe);
    removeEventListener('resize', sizeCanvas);
    document.removeEventListener('visibilitychange', visibilityChanged);
    removeEventListener('pageshow', visibilityChanged);
  }, { once: true });
  observe();
}
