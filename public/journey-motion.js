// A scroll-driven radar. No idle loop and no geometry reads during scrolling.
export function mountJourney({ ScrollTrigger, reduced, fine }) {
  const root = document.querySelector('.journey-route');
  if (!root || reduced || !fine || innerWidth < 1101) return () => {};
  const sweep = root.querySelector('.radar-sweep'), orbit = root.querySelector('.radar-orbit');
  const face = root.querySelector('.radar-face'), waves = [...root.querySelectorAll('.radar-wave')];
  const blips = [...root.querySelectorAll('.radar-blip')], title = root.querySelector('.companion-title');
  const names = ['Знакомство', 'Возможности', 'Компании', 'Календарь', 'Разбор', 'Помощник', 'Ваш опыт', 'Вопросы'];
  const number = root.querySelector('.companion-number');
  const chapters = ['.intro-section', '#story', '#coverage', '#company-chart', '#example', '#personalities', '#survey', '#faq']
    .map(selector => document.querySelector(selector)).filter(Boolean);
  let tops = [], chapter = -1, viewport = innerHeight, timer = 0, disposed = false;
  let pulses = [];
  const stopPulses = () => { pulses.forEach(effect => effect.cancel()); pulses = []; };
  function signal() {
    stopPulses();
    if (document.body.classList.contains('keyboard-input')) return;
    const easing = 'cubic-bezier(0.23, 1, 0.32, 1)';
    waves.forEach((wave, index) => pulses.push(wave.animate([
      { transform: 'scale(.7)', opacity: .6 }, { transform: 'scale(1.17)', opacity: 0 },
    ], { duration: 900, delay: index * 110, easing })));
    pulses.push(face.animate([{ transform: 'scale(.94)' }, { transform: 'scale(1.06)', offset: .45 }, { transform: 'scale(1)' }], { duration: 700, easing }));
  }
  function measure() {
    viewport = innerHeight;
    tops = chapters.map(node => node.getBoundingClientRect().top + scrollY);
  }
  function paint(self) {
    if (disposed || document.hidden) return;
    const progress = Math.max(0, Math.min(1, self.progress));
    sweep.style.transform = `rotate(${(progress * 900).toFixed(2)}deg)`;
    orbit.style.transform = `rotate(${(progress * 540).toFixed(2)}deg)`;
    blips.forEach((blip, index) => { blip.style.opacity = String(.25 + .75 * Math.max(0, Math.sin(progress * 28 - index * 1.7))); });
    const frontier = self.scroll() + viewport * .4;
    let next = 0;
    tops.forEach((top, index) => { if (frontier >= top) next = index; });
    if (next !== chapter) { chapter = next; number.textContent = String(next + 1).padStart(2, '0'); title.textContent = names[next]; root.classList.toggle('is-on-dark', chapters[next].classList.contains('workspace-section')); signal(); }
  }
  measure();
  const trigger = ScrollTrigger.create({ start: 0, end: () => Math.max(1, ScrollTrigger.maxScroll(window)), onUpdate: paint, onRefresh: self => { measure(); paint(self); } });
  const refresh = () => { clearTimeout(timer); timer = setTimeout(() => { if (!disposed) trigger.refresh(); }, 140); };
  const resume = () => { if (document.hidden) stopPulses(); else paint(trigger); };
  document.addEventListener('tail:layout-change', refresh);
  document.addEventListener('visibilitychange', resume);
  ScrollTrigger.addEventListener('refresh', measure);
  root.classList.add('is-ready'); paint(trigger);
  return () => { disposed = true; stopPulses(); clearTimeout(timer); trigger.kill(); root.classList.remove('is-ready', 'is-on-dark');
    document.removeEventListener('tail:layout-change', refresh); document.removeEventListener('visibilitychange', resume); ScrollTrigger.removeEventListener('refresh', measure);
  };
}
