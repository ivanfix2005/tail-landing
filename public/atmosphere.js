// Product-shaped margin notes. Decorative, noninteractive, with no market values.
const drawing = content => `<svg viewBox="0 0 200 240" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">${content}</svg>`;
const motifs = {
  portfolio: drawing(`<path class="edge-wire" d="M38 73H163V123H91V186H164"/><circle class="edge-node" cx="163" cy="73" r="4"/><circle class="edge-node" cx="91" cy="123" r="4"/><g transform="rotate(-7 72 67)"><rect class="edge-paper" x="14" y="36" width="115" height="58" rx="9"/><rect class="edge-solid" x="25" y="49" width="20" height="20" rx="4"/><path class="edge-light" d="M29 64l4-6 4 3 4-8"/><text x="54" y="62">АКЦИИ</text><path class="edge-rule" d="M54 74h53"/></g><g transform="rotate(5 122 159)"><rect class="edge-paper" x="61" y="135" width="126" height="59" rx="9"/><path class="edge-stroke" d="M75 149h15v20H75zM78 154h9m-9 5h6"/><text x="100" y="160">ОБЛИГАЦИИ</text><path class="edge-rule" d="M100 171h64"/></g><path class="edge-rule" d="M21 216h83m-83 7h42"/>`),
  report: drawing(`<rect class="edge-back" x="26" y="32" width="133" height="178" rx="8" transform="rotate(-10 92 120)"/><path class="edge-paper" d="M54 23h81l34 34v147a8 8 0 0 1-8 8H54a8 8 0 0 1-8-8V31a8 8 0 0 1 8-8Z"/><path class="edge-stroke" d="M134 24v34h34"/><text x="62" y="80">ОТЧЁТНОСТЬ</text><path class="edge-rule" d="M62 94h83m-83 9h62m-62 10h83"/><rect class="edge-wash" x="59" y="127" width="95" height="23" rx="3"/><text x="65" y="142">Денежный поток</text><path class="edge-rule" d="M62 165h45m-45 10h76"/><circle class="edge-seal" cx="151" cy="196" r="18"/><path class="edge-check" d="m143 196 5 5 11-13"/>`),
  calendar: drawing(`<g transform="rotate(6 100 120)"><rect class="edge-back" x="24" y="39" width="155" height="170" rx="12"/><rect class="edge-paper" x="15" y="28" width="155" height="170" rx="12"/><path class="edge-stroke" d="M15 67h155M48 17v24m87-24v24"/><text x="35" y="55">КАЛЕНДАРЬ</text><g class="edge-calendar-cells"><path d="M34 88h16v14H34zM65 88h16v14H65zM96 88h16v14H96zM127 88h16v14h-16zM34 119h16v14H34zM65 119h16v14H65zM96 119h16v14H96zM127 119h16v14h-16zM34 150h16v14H34zM65 150h16v14H65zM96 150h16v14H96zM127 150h16v14h-16z"/></g><rect class="edge-solid" x="92" y="115" width="24" height="22" rx="4"/><path class="edge-light" d="m98 126 4 4 8-9"/></g><path class="edge-rule" d="M48 223h97"/>`),
  coupons: drawing(`<g transform="rotate(-9 91 80)"><path class="edge-paper" d="M18 42h154v20a10 10 0 0 0 0 20v20H18V82a10 10 0 0 0 0-20Z"/><path class="edge-perforation" d="M128 47v50"/><text class="edge-currency" x="37" y="84">₽</text><text x="70" y="69">ДИВИДЕНДЫ</text><path class="edge-rule" d="M70 82h42"/></g><g transform="rotate(7 105 159)"><path class="edge-back" d="M31 128h154v20a10 10 0 0 0 0 20v20H31v-20a10 10 0 0 0 0-20Z"/><path class="edge-perforation" d="M142 133v50"/><text class="edge-currency" x="49" y="170">₽</text><text x="82" y="156">КУПОНЫ</text><path class="edge-rule" d="M82 168h42"/></g><path class="edge-wire" d="M15 217h90l17-17"/>`),
  signals: drawing(`<path class="edge-wire" d="M32 28v175h146M31 64h137M31 121h137M31 178h137"/><circle class="edge-solid" cx="32" cy="64" r="6"/><circle class="edge-amber" cx="32" cy="121" r="6"/><circle class="edge-node" cx="32" cy="178" r="6"/><text x="50" y="53">НОВЫЕ ДАННЫЕ</text><path class="edge-rule" d="M50 74h102m-102 9h62"/><text x="50" y="111">ПРОВЕРИТЬ</text><path class="edge-rule" d="M50 132h78m-78 9h102"/><text x="50" y="168">ЕСТЬ ВОПРОС</text><path class="edge-rule" d="M50 189h65"/><path class="edge-stroke" d="m160 196 18 7-18 7"/>`),
  dialogue: drawing(`<path class="edge-back" d="M31 29h133a9 9 0 0 1 9 9v48a9 9 0 0 1-9 9h-14l-19 15V95H31a9 9 0 0 1-9-9V38a9 9 0 0 1 9-9Z"/><text x="38" y="57">МОЙ ВОПРОС</text><path class="edge-rule" d="M38 70h105m-105 9h63"/><path class="edge-paper" d="M42 126h136a9 9 0 0 1 9 9v62a9 9 0 0 1-9 9H74l-22 16v-16H42a9 9 0 0 1-9-9v-62a9 9 0 0 1 9-9Z"/><text x="49" y="153">ОСНОВАНИЯ</text><path class="edge-rule" d="M49 168h121m-121 10h87"/><path class="edge-check" d="m153 191 5 5 12-14"/>`),
  history: drawing(`<path class="edge-wire" d="M41 28v181"/><circle class="edge-node" cx="41" cy="49" r="5"/><circle class="edge-node" cx="41" cy="114" r="5"/><circle class="edge-solid" cx="41" cy="180" r="7"/><path class="edge-stroke" d="M60 34h109v35H60zM60 99h122v35H60z"/><path class="edge-rule" d="M72 47h70m-70 9h43m-43 56h88m-88 9h62"/><rect class="edge-back" x="59" y="162" width="125" height="41" rx="6"/><text x="72" y="186">ПОДТВЕРЖДЕНО</text><path class="edge-rule" d="M57 223h114"/>`),
  checklist: drawing(`<rect class="edge-paper" x="29" y="22" width="145" height="190" rx="10" transform="rotate(5 100 117)"/><text x="49" y="56">ВАШ ОПЫТ</text><g class="edge-stroke"><rect x="49" y="77" width="15" height="15" rx="3"/><rect x="49" y="119" width="15" height="15" rx="3"/><rect x="49" y="161" width="15" height="15" rx="3"/></g><path class="edge-check" d="m51 84 5 5 10-14"/><path class="edge-rule" d="M77 81h74m-74 10h51m-51 33h63m-63 10h74m-74 33h74m-74 10h40"/><path class="edge-solid" d="m168 133 9 4-24 58-10 8 1-13Z"/>`),
  questions: drawing(`<path class="edge-paper" d="M24 39h140a12 12 0 0 1 12 12v103a12 12 0 0 1-12 12h-37l-29 24v-24H24a12 12 0 0 1-12-12V51a12 12 0 0 1 12-12Z"/><path class="edge-question" d="M77 82a22 22 0 0 1 43 5c0 18-23 17-23 35"/><circle class="edge-solid" cx="97" cy="140" r="3"/><path class="edge-wire" d="M155 184h29v28H86"/>`),
};
const pairs = { hero: ['portfolio','report'], coverage: ['portfolio','signals'], market: ['coupons','calendar'], example: ['report','history'], survey: ['dialogue','checklist'], faq: ['questions','dialogue'], footer: ['history','report'] };
const workspacePairs = [['portfolio','history'],['report','report'],['signals','signals'],['dialogue','checklist']];
export function initializeAtmosphere() {
  const sizeCanvas = () => document.documentElement.style.setProperty('--ambient-viewport-width', `${document.documentElement.clientWidth}px`);
  sizeCanvas(); addEventListener('resize', sizeCanvas, { passive: true });
  const scenes = [['.intro-section','hero'], ['[data-product-workspace]','workspace'], ['#coverage','coverage'], ['#company-chart','market'], ['#example','example'], ['#survey','survey'], ['#faq','faq'], ['.landing-footer','footer']];
  for (const [selector, tone] of scenes) {
    const host = document.querySelector(selector);
    if (!host || host.querySelector(':scope > .section-atmosphere')) continue;
    host.classList.add('atmosphere-scene');
    const layer = document.createElement('div'); layer.className = `section-atmosphere ambient-${tone}`; layer.setAttribute('aria-hidden','true'); layer.inert = true;
    layer.innerHTML = ['left','right'].map((side,index) => {
      const art = tone === 'workspace' ? workspacePairs.map((pair,scene) => `<div class="ambient-topic" data-ambient-topic="${scene}">${motifs[pair[index]]}</div>`).join('') : motifs[pairs[tone][index]];
      return `<div class="ambient-rail ambient-${side}"><div class="ambient-fragment" data-ambient-reveal><span class="ambient-leader"></span><div class="ambient-art">${art}</div></div></div>`;
    }).join(''); host.prepend(layer);
  }
  const fragments = [...document.querySelectorAll('[data-ambient-reveal]')], preference = matchMedia('(prefers-reduced-motion: reduce)'); let observer;
  function observe() {
    observer?.disconnect(); const enabled = !preference.matches && 'IntersectionObserver' in window;
    document.body.classList.toggle('has-atmosphere-motion',enabled);
    if (!enabled) { fragments.forEach(node => node.classList.add('is-revealed')); return; }
    observer = new IntersectionObserver(entries => {
      for (const entry of entries) if (entry.isIntersecting) { entry.target.classList.add('is-revealed'); observer.unobserve(entry.target); }
    }, { rootMargin:'60px 0px', threshold:0 }); fragments.forEach(node => observer.observe(node));
  }
  preference.addEventListener('change',observe);
  addEventListener('pagehide', event => { if (event.persisted) return; observer?.disconnect(); preference.removeEventListener('change',observe); removeEventListener('resize',sizeCanvas); }, {once:true});
  observe();
}
