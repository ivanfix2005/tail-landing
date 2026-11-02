// Native controls; short, interruptible feedback; instant keyboard/reduced motion.
let inputMethod = 'pointer';
const reduce = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
const canMove = () => inputMethod !== 'keyboard' && !reduce();
const ease = 'cubic-bezier(0.23, 1, 0.32, 1)';
const animations = new WeakMap();
const accordionStops = new WeakMap();
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
export function updateSurveyPresentation(host, step, index, count, changed, backwards) {
  document.querySelectorAll('[data-survey-theme]').forEach(node => {
    node.classList.toggle('is-current', node.dataset.surveyTheme === step);
    node.hidden = count === 4 && node.dataset.surveyTheme === 'process';
  });
  const number = document.querySelector('.research-stage-number'); if (number) number.textContent = String(index + 1).padStart(2, '0');
  const label = document.querySelector('.research-stage-label'); if (label) label.textContent = `Тема ${index + 1} из ${count}`;
  if (changed && canMove()) enter(host.querySelector('.survey-question-content'), backwards ? -8 : 8);
  if (changed) document.dispatchEvent(new Event('tail:layout-change'));
}
export function initializeInteractions() {
  document.addEventListener('pointerdown', () => { inputMethod = 'pointer'; document.body.classList.remove('keyboard-input'); }, { passive: true });
  document.addEventListener('keydown', () => { inputMethod = 'keyboard'; document.body.classList.add('keyboard-input'); });
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
