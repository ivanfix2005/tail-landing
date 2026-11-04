import { annualDividends } from './market-data.js';
import { mountJourney } from './journey-motion.js';

export function mountMarketExperience({ gsap, ScrollTrigger, reduced, fine }) {
  const cleanups = [];
  const section = document.querySelector('.market-section');
  const phone = section.querySelector('.market-phone');
  let fitFrame = 0, disposed = false;
  const fitPhone = () => {
    fitFrame = 0;
    if (disposed) return;
    if (!matchMedia('(min-width:901px)').matches || !CSS.supports('zoom','1')) { phone.style.removeProperty('zoom'); return; }
    const available = Math.max(280, innerHeight - document.querySelector('.landing-header').offsetHeight - 48);
    // Retain the original 750px fit reference so a shorter phone is not enlarged again.
    const fitHeight = Math.max(phone.offsetHeight, 750);
    const scale = Math.min(.96, Math.max(.5, (available - 2) / fitHeight)).toFixed(3);
    if (phone.style.zoom !== scale) phone.style.zoom = scale;
  };
  const scheduleFit = () => { if (!disposed && !fitFrame) fitFrame = requestAnimationFrame(fitPhone); };
  fitPhone(); document.fonts.ready.then(fitPhone);
  addEventListener('resize', scheduleFit, { passive:true });
  document.addEventListener('tail:layout-change', scheduleFit);
  cleanups.push(() => { disposed = true; cancelAnimationFrame(fitFrame); removeEventListener('resize',scheduleFit); document.removeEventListener('tail:layout-change',scheduleFit); phone.style.removeProperty('zoom'); });
  const years = [...document.querySelectorAll('[data-chart-year]')];
  const dots = [...document.querySelectorAll('[data-chart-dot]')];
  function chooseYear(event) {
    const index = Number(event.currentTarget.dataset.chartYear);
    const value = annualDividends[index];
    document.getElementById('chart-year').textContent = value.year;
    document.getElementById('chart-total').textContent = value.total.toLocaleString('ru-RU');
    document.getElementById('chart-parts').textContent = `${value.parts} ₽ · два решения`;
    const source = document.getElementById('chart-source');
    source.href = value.source;
    source.textContent = `Источник за ${value.year} ↗`;
    years.forEach((button, number) => {
      button.classList.toggle('is-active', number === index);
      button.setAttribute('aria-pressed', String(number === index));
      dots[number].classList.toggle('is-active', number === index);
      dots[number].setAttribute('r', number === index ? '7' : '4');
    });
    document.dispatchEvent(new Event('tail:layout-change'));
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
    document.dispatchEvent(new Event('tail:layout-change'));
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

  cleanups.push(mountJourney({ ScrollTrigger, reduced, fine }));

  return () => { cleanups.forEach(cleanup => cleanup()); };
}
