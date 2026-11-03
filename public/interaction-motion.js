// Native controls; short, interruptible feedback; instant keyboard/reduced motion.
let inputMethod = 'pointer';
const reduce = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
const canMove = () => inputMethod !== 'keyboard' && !reduce();
const ease = 'cubic-bezier(0.23, 1, 0.32, 1)';
const animations = new WeakMap();
const accordionStops = new WeakMap();
let activeCandleMoment;
function stopCandleMoment() { activeCandleMoment?.(); activeCandleMoment = null; }
function formCandle(node, chart, previous) {
  stopCandleMoment();
  if (!canMove() || document.hidden) return;
  const effects = [];
  let frame = 0, flight, ring, stopped = false;
  node.classList.add('is-forming');
  const stop = () => {
    stopped = true; cancelAnimationFrame(frame); effects.forEach(effect => effect.cancel());
    node.classList.remove('is-forming'); flight?.remove(); ring?.remove();
  };
  activeCandleMoment = stop;
  // Read geometry once per validated answer, after branch layout has settled.
  frame = requestAnimationFrame(() => {
    if (stopped || !canMove() || document.hidden) return stop();
    const body = node.querySelector('.candle-body'), wick = node.querySelector('.candle-wick');
    const bounds = chart.getBoundingClientRect(), tip = body.getBoundingClientRect();
    const source = previous?.querySelector('.candle-body').getBoundingClientRect();
    const x = tip.left - bounds.left + tip.width / 2, y = tip.top - bounds.top;
    const sx = source ? source.left - bounds.left + source.width / 2 : x - 24;
    const sy = source ? source.top - bounds.top : bounds.height - 12;
    const play = (element, frames, duration, delay = 0, easing = ease) => {
      const effect = element.animate(frames, { duration, delay, easing, fill: 'both' }); effects.push(effect); return effect;
    };
    flight = document.createElement('i'); flight.className = 'candle-energy';
    ring = document.createElement('i'); ring.className = 'candle-arrival-ring';
    chart.append(flight, ring);
    const point = (px, py, scale = 1) => `translate3d(${px}px,${py}px,0) scale(${scale})`;
    play(flight, [
      { transform: point(sx, sy, .7), opacity: 0, offset: 0 },
      { transform: point(sx, sy, 1), opacity: 1, offset: .12 },
      { transform: point((sx + x) / 2, Math.min(sy, y) - 30, 1.2), opacity: 1, offset: .58 },
      { transform: point(x, y, .6), opacity: 0, offset: 1 },
    ], 650, 0, 'linear');
    play(body, [
      { transform: 'translateY(27px) scale(.55,.08)', opacity: 0, offset: 0 },
      { transform: 'translateY(10px) scale(.75,.4)', opacity: 1, offset: .24 },
      { transform: 'translateY(-7px) scale(.94,1.14)', opacity: 1, offset: .62 },
      { transform: 'translateY(2px) scale(1.03,.97)', opacity: 1, offset: .83 },
      { transform: 'translateY(0) scale(1)', opacity: 1, offset: 1 },
    ], 880, 100);
    play(wick, [
      { transform: 'translateY(18px) scaleY(.2)', opacity: 0 },
      { transform: 'translateY(-5px) scaleY(1.12)', opacity: 1, offset: .7 },
      { transform: 'translateY(0) scaleY(1)', opacity: 1 },
    ], 760, 170);
    play(ring, [
      { transform: point(x, y, .35), opacity: 0 },
      { transform: point(x, y, .8), opacity: .85, offset: .2 },
      { transform: point(x, y, 1.9), opacity: 0 },
    ], 460, 620);
    play(node.querySelector('small'), [{ transform: 'translateY(5px)', opacity: .4 }, { transform: 'translateY(0)', opacity: 1 }], 220, 500);
    // A compact echo remains visible while the main chart is above a phone viewport.
    const mini = hostLastCompletedCandle();
    if (mini) play(mini, [{ transform: 'translateY(8px) scaleY(.2)' }, { transform: 'translateY(-3px) scaleY(1.15)', offset: .65 }, { transform: 'none' }], 620, 100);
    Promise.all(effects.map(effect => effect.finished)).then(() => {
      if (activeCandleMoment === stop) { stop(); activeCandleMoment = null; }
    }).catch(() => {});
  });
}
function hostLastCompletedCandle() {
  return [...document.querySelectorAll('.survey-stages [data-state="done"] > span')].at(-1);
}
export const interactionScrollBehavior = () => canMove() ? 'smooth' : 'instant';
function enter(element, offset = 8) {
  animations.get(element)?.cancel();
  const animation = element.animate([{ opacity: .35, transform: `translateY(${offset}px)` }, { opacity: 1, transform: 'translateY(0)' }], { duration: 220, easing: ease });
  animations.set(element, animation);
}
const caseStates = {
  recommendation: ['397', '₽ / акция', 'Предложено советом директоров', 0],
  decision: ['397', '₽ / акция', 'Утверждено собранием', 1],
  'record-date': ['12.01', '2026', 'Дата реестра по дивиденду 397 ₽', 2],
};
export function updateCasePresentation(dossier, key, animate = false) {
  accordionStops.get(dossier.querySelector('.demo-details'))?.();
  const [value, unit, label, index] = caseStates[key]; dossier.dataset.case = key;
  dossier.querySelector('.case-metric-value').textContent = value;
  dossier.querySelector('.case-metric-unit').textContent = unit;
  dossier.querySelector('.case-metric-label').textContent = label;
  dossier.querySelector('.case-switch-indicator').style.transform = `translateX(${index * 100}%)`;
  document.querySelectorAll('[data-case-node]').forEach((node, number) => { node.classList.toggle('is-current', number === index); node.classList.toggle('is-past', number < index); });
  if (animate && canMove()) enter(dossier.querySelector('.case-panel'));
  document.dispatchEvent(new Event('tail:layout-change'));
}
export function updateSurveyPresentation(host, step, index, count, changed, backwards, completed = new Set()) {
  document.querySelectorAll('[data-survey-theme]').forEach(node => {
    node.classList.toggle('is-current', node.dataset.surveyTheme === step);
    node.hidden = count === 4 && node.dataset.surveyTheme === 'process';
  });
  const number = document.querySelector('.research-stage-number'); if (number) number.textContent = String(index + 1).padStart(2, '0');
  const label = document.querySelector('.research-stage-label'); if (label) label.textContent = `Тема ${index + 1} из ${count}`;
  const candles = [...document.querySelectorAll('[data-survey-candle]')];
  const visible = candles.filter(node => count !== 4 || node.dataset.surveyCandle !== 'process');
  candles.forEach(node => { node.hidden = !visible.includes(node); });
  const chart = document.querySelector('.survey-candles');
  const arrivals = [];
  if (chart) chart.style.setProperty('--candle-count', count);
  visible.forEach((node, position) => {
    node.querySelector('small').textContent = String(position + 1).padStart(2, '0');
    const nextState = completed.has(node.dataset.surveyCandle) ? 'done' : node.dataset.surveyCandle === step ? 'current' : 'pending';
    if (nextState === 'done' && node.dataset.state !== 'done') arrivals.push(node);
    node.dataset.state = nextState;
    node.style.setProperty('--candle-height', `${30 + position * 13}px`);
    node.style.setProperty('--candle-bottom', `${12 + position * 17}px`);
    node.classList.toggle('instant-candle', !canMove());
  });
  const done = visible.filter(node => completed.has(node.dataset.surveyCandle)).length;
  const status = document.querySelector('.candle-status');
  if (status) status.textContent = done === count ? 'Картина сложилась. Спасибо!' : done ? `${done} из ${count} шагов — уже яснее` : 'Первый шаг зажжёт первую свечу';
  if (chart) chart.dataset.complete = String(done === count);
  if (arrivals.length && chart) {
    const arrival = arrivals.at(-1), previous = visible[visible.indexOf(arrival) - 1];
    formCandle(arrival, chart, previous);
  }
  if (changed && canMove()) enter(host.querySelector('.survey-question-content'), backwards ? -8 : 8);
  if (changed) document.dispatchEvent(new Event('tail:layout-change'));
}
export function initializeInteractions() {
  document.addEventListener('pointerdown', () => { inputMethod = 'pointer'; document.body.classList.remove('keyboard-input'); }, { passive: true });
  document.addEventListener('keydown', () => { inputMethod = 'keyboard'; document.body.classList.add('keyboard-input'); stopCandleMoment(); });
  document.addEventListener('visibilitychange', () => { if (document.hidden) stopCandleMoment(); });
  matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change', () => { if (reduce()) stopCandleMoment(); });
  document.querySelectorAll('.faq-items details, .demo-details').forEach(details => {
    const summary = details.querySelector('summary'); let animation, desiredOpen = details.open;
    accordionStops.set(details, () => {
      animation?.cancel(); animation = null; desiredOpen = details.open;
      details.style.height = ''; details.style.overflow = ''; details.removeAttribute('data-changing');
    });
    const finish = () => {
      animation = null; details.open = desiredOpen; details.style.height = ''; details.style.overflow = ''; details.removeAttribute('data-changing');
      document.dispatchEvent(new Event('tail:layout-change'));
    };
    summary.addEventListener('click', event => {
      if (!canMove() || event.detail === 0) { animation?.cancel(); animation = null; details.style.height = ''; details.style.overflow = ''; details.removeAttribute('data-changing'); return; }
      event.preventDefault(); const from = details.getBoundingClientRect().height;
      desiredOpen = animation ? !desiredOpen : !details.open; animation?.cancel();
      details.style.height = ''; details.open = true;
      const to = desiredOpen ? details.getBoundingClientRect().height : summary.getBoundingClientRect().height + 2;
      details.dataset.changing = desiredOpen ? 'open' : 'closed'; details.style.overflow = 'hidden';
      animation = details.animate([{ height: `${from}px` }, { height: `${to}px` }], { duration: 200, easing: ease }); animation.onfinish = finish;
    });
    details.addEventListener('toggle', () => { if (!animation) { desiredOpen = details.open; document.dispatchEvent(new Event('tail:layout-change')); } });
  });
  const bubbles = [...document.querySelectorAll('.faq-bubble')], intro = document.querySelector('.faq-intro');
  if (intro && !reduce()) {
    const observer = new IntersectionObserver(entries => {
      if (!entries[0].isIntersecting) return;
      if (reduce()) { observer.disconnect(); return; }
      bubbles.forEach((bubble, index) => bubble.animate([{ opacity: 0, transform: 'translateY(12px)' }, { opacity: 1, transform: 'translateY(0)' }], { duration: 300, delay: index * 60, easing: ease, fill: 'backwards' })); observer.disconnect();
    }, { threshold: .25 }); observer.observe(intro);
  }
}
