import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { flushSync } from 'react-dom';
import { Stage } from './stageshow-kit/stage';
import { Window, Text, Bar } from './stageshow-kit/window';
import { Row } from './stageshow-kit/parts/Row';
import { Check } from './stageshow-kit/parts/Check';
import { Roll } from './stageshow-kit/motion/Roll';
import type { Act } from './stageshow-kit/act';
import './benefits.css';

const tokens = {
  '--ss-font': 'Manrope, Arial, sans-serif',
  '--ss-accent': '#1bb85a',
  '--ss-text': '#112b20',
  '--ss-text-secondary': '#496557',
  '--ss-text-tertiary': '#62796b',
  '--ss-radius-md': '12px',
};
const productIcon = (name: string, size = 18) => <svg width={size} height={size} className="tb-icon" aria-hidden="true"><use href={`#i-${name}`} /></svg>;

type Match = { selected: boolean; linked: boolean };
async function matchScript(a: Act<Match>) {
  await a.wait(500);
  await a.move('lkoh-event', { duration: 950 });
  await a.wait(250);
  await a.click('lkoh-event');
  await a.set({ selected: true });
  await a.wait(500);
  await a.set({ linked: true });
  await a.wait(2000);
}
function MatchScene() {
  return <Stage<Match> width={600} height={420} compact={{ below: 490, width: 300, height: 330 }}
    initial={{ selected: false, linked: false }} poster={{ selected: true, linked: true }} script={matchScript}
    play="once" accent="#19bd57" fidelity="realistic" tokens={tokens} className="tb-match"
    cursor={{ at: 'watchlist-next', style: 'arrow', ripple: true }}>
    {s => <>
      <Window title="События по вашим бумагам" className="tb-event-window" chrome="native" toolbar={<span className="tb-live">ЛУКОЙЛ · LKOH</span>}>
        <div className="tb-list-label">ПРИМЕР СПИСКА НАБЛЮДЕНИЯ</div>
        <Row data-target="lkoh-event" data-cursor="pointer" selected={s.selected} className="tb-event-row"
          lead={<img src="/company-logos/lkoh.png" alt="" width="38" height="38" />}
          title={<Text>ЛУКОЙЛ</Text>} subtitle={<Text>Рекомендован дивиденд</Text>}
          meta={<span className="tb-row-amount">397 ₽</span>} />
        <div className="tb-selected-explainer" data-on={s.selected || undefined}><Check on={s.selected} size={18} /><Text>Обыкновенная акция LKOH</Text></div>
        <Row data-target="watchlist-next" className="tb-context-row" lead={<img src="/company-logos/gazp.png" alt="" width="30" height="30" />} title={<Text>Газпром</Text>} meta={<Text>GAZP</Text>} />
        <Row className="tb-context-row" lead={<Bar w={28} h={28} r={8} />} title={<Bar w={110} h={7} />} meta={<Bar w={45} h={6} />} />
      </Window>
      <div className="tb-match-note" data-on={s.linked || undefined}><span className="tb-link-icon">{productIcon('bag', 21)}</span><div><span>Событие связано</span><strong>с вашей акцией</strong></div><Check on={s.linked} size={22} /></div>
    </>}
  </Stage>;
}

type Proof = { highlight: boolean; checked: boolean };
async function proofScript(a: Act<Proof>) {
  await a.wait(600);
  await a.set({ highlight: true });
  await a.wait(800);
  await a.set({ checked: true });
  await a.wait(2000);
}
function ProofScene() {
  return <Stage<Proof> width={480} height={198} compact={{ below: 410, width: 300, height: 205 }} initial={{ highlight: false, checked: false }}
    poster={{ highlight: true, checked: true }} script={proofScript} play="once" tokens={tokens} className="tb-proof">
    {s => <>
      <Window title="Первоисточник · 21.11.2025" chrome="hairline" className="tb-proof-window">
        <div className="tb-document-line">Совет директоров <strong data-on={s.highlight || undefined}>рекомендовал</strong></div>
        <div className="tb-proof-secondary">Собранию принять решение о выплате</div>
        <div className="tb-document-word">397 ₽ <span>на акцию</span></div>
        <Bar w={180} h={6} tone={2} />
      </Window>
      <div className="tb-proof-chip" data-on={s.checked || undefined}><Check on={s.checked} size={18} /><Text>Документ ЛУКОЙЛа</Text></div>
    </>}
  </Stage>;
}

type History = { arrived: boolean; settled: boolean };
async function historyScript(a: Act<History>) {
  await a.wait(600);
  await a.set({ arrived: true });
  await a.wait(900);
  await a.set({ settled: true });
  await a.wait(2000);
}
function HistoryScene() {
  return <Stage<History> width={480} height={182} compact={{ below: 410, width: 300, height: 195 }} initial={{ arrived: false, settled: false }}
    poster={{ arrived: true, settled: true }} script={historyScript} play="once" tokens={tokens} className="tb-history">
    {s => <div className="tb-history-track">
      <div className="tb-history-item tb-old"><span className="tb-date">21.11.2025</span><div><span className="tb-step-dot" /><Text>Рекомендовано</Text></div></div>
      <div className="tb-history-connector" data-on={s.arrived || undefined} />
      <div className="tb-history-item tb-new" data-on={s.arrived || undefined}><span className="tb-date">30.12.2025</span><div><Check on={s.settled} size={21} /><Text><Roll>{s.settled ? 'Утверждено' : 'Новое решение'}</Roll></Text></div></div>
    </div>}
  </Stage>;
}

function Benefits() {
  const [replay, setReplay] = useState(0);
  return <>
    <div className="tail-benefits-grid" key={replay}>
      <article className="tail-benefit tail-benefit-hero"><div className="tail-benefit-copy"><span className="benefit-number">01 / ВАШИ БУМАГИ</span><h3>В потоке новостей —<br /><em>ваша история.</em></h3><p>Событие связано с конкретной компанией и бумагой. Сразу видно, почему оно заслуживает внимания.</p></div><div className="benefit-picture" aria-hidden="true"><MatchScene /></div><div className="benefit-hero-foot"><span className="benefit-indicator" />Событие → компания → бумага</div></article>
      <article className="tail-benefit tail-benefit-proof"><div className="benefit-picture" aria-hidden="true"><ProofScene /></div><div className="tail-benefit-copy"><span className="benefit-number">02 / ПЕРВОИСТОЧНИК</span><h3>У каждого факта<br />есть основание.</h3><p>Не нужно верить на слово: откройте документ и проверьте формулировку.</p></div></article>
      <article className="tail-benefit tail-benefit-history"><div className="tail-benefit-copy"><span className="benefit-number">03 / ИЗМЕНЕНИЯ</span><h3>Картина меняется.<br />История остаётся.</h3><p>Новый документ меняет статус. Видно, что было известно до него.</p></div><div className="benefit-picture" aria-hidden="true"><HistoryScene /></div></article>
    </div>
    <div className="benefits-caption"><p>Концепция интерфейса на историческом кейсе ЛУКОЙЛа.</p><button type="button" onClick={() => setReplay(value => value + 1)}>{productIcon('clock', 15)} Посмотреть ещё раз</button></div>
  </>;
}

export function mountBenefits() {
  const host = document.getElementById('benefits-island');
  if (!host) return;
  const root = createRoot(host);
  flushSync(() => root.render(<Benefits />));
}
