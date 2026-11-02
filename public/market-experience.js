import { annualDividends } from './market-data.js';

export function mountMarketExperience({ gsap, ScrollTrigger, reduced, fine }) {
  const cleanups = [];
  const section = document.querySelector('.market-section');
  const years = [...document.querySelectorAll('[data-chart-year]')];
  const dots = [...document.querySelectorAll('[data-chart-dot]')];
  function chooseYear(event) {
    const index = Number(event.currentTarget.dataset.chartYear);
    const value = annualDividends[index];
    document.getElementById('chart-year').textContent = value.year;
    document.getElementById('chart-total').textContent = value.total.toLocaleString('ru-RU');
    document.getElementById('chart-parts').textContent = `${value.parts} ₽ · два решения`;
    years.forEach((button, number) => {
      button.classList.toggle('is-active', number === index);
      button.setAttribute('aria-pressed', String(number === index));
      dots[number].classList.toggle('is-active', number === index);
    });
  }
  years.forEach(button => {
    button.addEventListener('click', chooseYear);
    cleanups.push(() => button.removeEventListener('click', chooseYear));
  });
  const tabs = [...document.querySelectorAll('[data-market-tab]')];
  const panes = [...document.querySelectorAll('[data-phone-pane]')];
  const chooseTab = event => {
    const name = event.currentTarget.dataset.marketTab;
    tabs.forEach(tab => {
      tab.classList.toggle('is-active', tab.dataset.marketTab === name);
      tab.setAttribute('aria-pressed', String(tab.dataset.marketTab === name));
    });
    panes.forEach(pane => { pane.hidden = pane.dataset.phonePane !== name; });
  };
  tabs.forEach(tab => {
    tab.addEventListener('click', chooseTab);
    cleanups.push(() => tab.removeEventListener('click', chooseTab));
  });

  const coverage = document.querySelector('.coverage-section');
  const pause = coverage.querySelector('.marquee-toggle');
  const toggleMarquee = () => {
    const paused = coverage.classList.toggle('is-paused');
    pause.setAttribute('aria-pressed', String(paused));
    pause.innerHTML = `${paused ? 'Продолжить ленту' : 'Остановить ленту'} <span aria-hidden="true">${paused ? '▷' : 'Ⅱ'}</span>`;
  };
  pause.addEventListener('click', toggleMarquee);
  const observer = new IntersectionObserver(entries => {
    coverage.classList.toggle('is-visible', entries[0].isIntersecting);
  });
  observer.observe(coverage);
  cleanups.push(() => { observer.disconnect(); pause.removeEventListener('click', toggleMarquee); });

  if (!reduced) {
    const scene = gsap.timeline({
      defaults: { ease: 'power3.out' },
      scrollTrigger: { trigger: '.market-visual', start: 'top 78%', once: true },
    });
    scene.fromTo('.market-phone', { y: 40, rotation: -2, opacity: 0 }, {
      y: 0, rotation: 0, opacity: 1, duration: 0.9,
    }).fromTo('.chart-ink', { clipPath: 'inset(0 100% 0 0)' }, {
      clipPath: 'inset(0 0% 0 0)', duration: 1.1, ease: 'power2.inOut',
    }, 0.38).fromTo('.market-popover', { y: 26, scale: 0.97, opacity: 0 }, {
      y: 0, scale: 1, opacity: 1, duration: 0.65, stagger: 0.12,
    }, 0.65);
    const finishForKeyboard = event => {
      if (event.target.matches(':focus-visible')) scene.progress(1).pause();
    };
    section.addEventListener('focusin', finishForKeyboard);
    cleanups.push(() => section.removeEventListener('focusin', finishForKeyboard));
  }

  const guide = document.querySelector('.journey-guide');
  if (fine && !reduced && matchMedia('(min-width: 1101px)').matches) {
    const stops = [
      { selector: '.intro-section', label: 'компании', next: '#coverage', y: -65 },
      { selector: '#coverage', label: 'разбор', next: '#story', y: -25 },
      { selector: '#story', label: 'экран компании', next: '#company-chart', y: 45 },
      { selector: '#company-chart', label: 'главное в ТЭЙЛ', next: '#approach', y: -20 },
      { selector: '#approach', label: 'проверить самим', next: '#example', y: 35 },
      { selector: '#example', label: 'ваш опыт', next: '#survey', y: -30 },
      { selector: '#survey', label: 'вопросы', next: '.landing-faq', y: 30 },
      { selector: '.landing-faq', label: 'в начало', next: '#top', y: 0 },
    ];
    let destination = '#coverage';
    const setGuide = item => {
      destination = item.next;
      guide.setAttribute('aria-label', `Дальше — ${item.label}`);
      guide.querySelector('.journey-label').textContent = `Дальше — ${item.label}`;
      if (document.activeElement !== guide) gsap.to(guide, { y: item.y, rotation: 0, duration: 0.65, ease: 'power3.out', overwrite: true });
    };
    guide.classList.add('is-available');
    stops.forEach(item => ScrollTrigger.create({
      trigger: item.selector, start: 'top 65%', end: 'bottom 65%',
      onToggle: self => { if (self.isActive) setGuide(item); },
    }));
    const goNext = event => document.querySelector(destination)?.scrollIntoView({
      block: 'start', behavior: event.detail === 0 ? 'instant' : 'smooth',
    });
    guide.addEventListener('click', goNext);
    cleanups.push(() => { guide.removeEventListener('click', goNext); guide.classList.remove('is-available'); });
  }

  return () => { cleanups.forEach(cleanup => cleanup()); };
}
