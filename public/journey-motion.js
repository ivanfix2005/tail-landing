// A quiet market marker. Geometry is read only on refresh, never while scrolling.
export function mountJourney({ ScrollTrigger, reduced, fine }) {
  const root = document.querySelector('.journey-route');
  if (!root || reduced || !fine || innerWidth < 1101) return () => {};
  const rail = root.querySelector('.companion-progress');
  const marker = root.querySelector('.companion-marker');
  const bars = [...root.querySelectorAll('.companion-bar')];
  const number = root.querySelector('.companion-number');
  const chapters = ['.intro-section', '#story', '#company-chart', '#approach', '#example', '#survey', '#faq']
    .map(selector => document.querySelector(selector)).filter(Boolean);
  let tops = [], chapter = -1, viewport = innerHeight, timer = 0, disposed = false;
  function measure() {
    viewport = innerHeight;
    tops = chapters.map(node => node.getBoundingClientRect().top + scrollY);
  }
  function paint(self) {
    if (disposed || document.hidden) return;
    const progress = Math.max(0, Math.min(1, self.progress));
    rail.style.transform = `scaleY(${progress.toFixed(4)})`;
    marker.style.transform = `translateY(${(progress * 84).toFixed(2)}px)`;
    bars.forEach((bar, index) => { bar.style.transform = `scaleY(${(.45 + .55 * Math.min(1, progress * 1.5 + index * .12)).toFixed(3)})`; });
    const frontier = self.scroll() + viewport * .4;
    let next = 0;
    tops.forEach((top, index) => { if (frontier >= top) next = index; });
    if (next !== chapter) { chapter = next; number.textContent = String(next + 1).padStart(2, '0'); }
  }
  measure();
  const trigger = ScrollTrigger.create({ start: 0, end: () => Math.max(1, ScrollTrigger.maxScroll(window)), onUpdate: paint, onRefresh: self => { measure(); paint(self); } });
  const refresh = () => { clearTimeout(timer); timer = setTimeout(() => { if (!disposed) trigger.refresh(); }, 140); };
  const resume = () => { if (!document.hidden) paint(trigger); };
  document.addEventListener('tail:layout-change', refresh);
  document.addEventListener('visibilitychange', resume);
  ScrollTrigger.addEventListener('refresh', measure);
  root.classList.add('is-ready'); paint(trigger);
  return () => { disposed = true; clearTimeout(timer); trigger.kill(); root.classList.remove('is-ready');
    document.removeEventListener('tail:layout-change', refresh); document.removeEventListener('visibilitychange', resume); ScrollTrigger.removeEventListener('refresh', measure);
  };
}
