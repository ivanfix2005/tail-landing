import { ANALYTICS_VERSION } from './survey-model.js';

const storageKey = 'tail-analytics-consent';
const allowedGoals = new Set(['section_hero', 'section_example', 'section_approach', 'section_survey', 'section_beta', 'section_faq', 'section_footer', 'survey_start', 'survey_complete', 'beta_chat_click']);
let counterId = null;
let analyticsActive = false;
let currentConsent = null;
let cleanupTracking = () => {};

export function uuid() {
  if (typeof crypto.randomUUID === 'function') return crypto.randomUUID();
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  bytes[6] = (bytes[6] & 15) | 64; bytes[8] = (bytes[8] & 63) | 128;
  const hex = [...bytes].map(value => value.toString(16).padStart(2, '0')).join('');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}
export function goal(name) {
  if (analyticsActive && allowedGoals.has(name)) window.ym?.(counterId, 'reachGoal', name);
}
function readChoice() {
  try {
    const choice = JSON.parse(localStorage.getItem(storageKey));
    if (choice?.version !== ANALYTICS_VERSION || !['accepted', 'rejected'].includes(choice.decision) || typeof choice.at !== 'number' || choice.at > Date.now() || Date.now() - choice.at > 180 * 86400000 || (choice.decision === 'accepted' && !choice.receiptId)) return null;
    return choice;
  } catch { return null; }
}
async function consentReceipt(receiptId, action) {
  const response = await fetch('/api/consent', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: uuid(), receiptId, action, version: ANALYTICS_VERSION }), signal: AbortSignal.timeout(15000), keepalive: true });
  if (!response.ok) throw Error('Не удалось сохранить выбор. Попробуйте ещё раз.');
}
function stopAnalytics() {
  cleanupTracking(); analyticsActive = false;
  if (counterId) window.ym?.(counterId, 'destruct');
  document.getElementById('tail-metrika')?.remove();
  for (const cookie of document.cookie.split(';').map(value => value.trim().split('=')[0]).filter(name => name.startsWith('_ym'))) {
    document.cookie = `${cookie}=; Max-Age=0; Path=/; SameSite=Lax`;
    const parts = location.hostname.split('.');
    for (let index = 0; index < parts.length; index++) document.cookie = `${cookie}=; Max-Age=0; Path=/; Domain=${parts.slice(index).join('.')}; SameSite=Lax`;
  }
}
function startAnalytics() {
  if (!counterId || analyticsActive || document.getElementById('tail-metrika')) return;
  window.ym ??= Object.assign((...args) => { (window.ym.a ??= []).push(args); }, { l: Date.now() });
  const script = document.createElement('script');
  script.id = 'tail-metrika'; script.async = true; script.src = `https://mc.yandex.ru/metrika/tag.js?id=${counterId}`;
  script.onload = () => {
    if (currentConsent?.decision !== 'accepted') return;
    window.ym(counterId, 'init', { defer: true, webvisor: false, clickmap: false, trackLinks: false, accurateTrackBounce: true, disableYtm: true, ecommerce: false, sendTitle: false });
    analyticsActive = true;
    let referrer = ''; try { if (document.referrer) referrer = new URL(document.referrer).origin; } catch {}
    window.ym(counterId, 'hit', location.origin + location.pathname, { referer: referrer, title: location.pathname === '/' ? 'ТЭЙЛ' : document.title });
    const pending = new Map(), seen = new Set();
    const timer = setInterval(() => {
      for (const section of document.querySelectorAll('[data-analytics-section]')) {
        if (seen.has(section)) continue;
        const rect = section.getBoundingClientRect();
        const visible = document.visibilityState === 'visible' && rect.height > 0 && Math.max(0, Math.min(rect.bottom, innerHeight) - Math.max(rect.top, 0)) >= 0.5 * Math.min(rect.height, innerHeight);
        if (!visible) { pending.delete(section); continue; }
        if (!pending.has(section)) pending.set(section, performance.now());
        if (performance.now() - pending.get(section) >= 1000) { goal('section_' + section.dataset.analyticsSection); seen.add(section); }
      }
    }, 250);
    cleanupTracking = () => clearInterval(timer);
  };
  script.onerror = () => script.remove();
  document.head.append(script);
}
function showPanel() {
  if (document.querySelector('.cookie-panel')) return;
  const panel = document.createElement('aside');
  panel.className = 'cookie-panel'; panel.setAttribute('role', 'dialog'); panel.setAttribute('aria-modal', 'false'); panel.setAttribute('aria-labelledby', 'cookie-title');
  panel.innerHTML = `<div><h2 id="cookie-title">Согласие на cookies</h2><p>${counterId ? 'С вашего согласия Яндекс Метрика использует cookie и данные об устройстве, чтобы считать посещения и просмотры блоков. <a href="/consent/analytics" target="_blank" rel="noopener noreferrer">Согласие на cookies</a> · <a href="/privacy" target="_blank" rel="noopener noreferrer">Политика обработки данных</a>. Отказ не влияет на работу сайта.' : 'Сейчас статистика посещений не собирается. Техническое хранилище используется только для сохранения вашего выбора. <a href="/privacy">Политика обработки данных</a>.'}</p></div><div class="cookie-actions">${counterId ? '<button type="button" class="button cookie-decline" data-choice="rejected">Отклонить</button><button type="button" class="button primary" data-choice="accepted">Принять cookies</button>' : '<button type="button" class="button cookie-decline" data-choice="close">Закрыть</button>'}</div>`;
  if (currentConsent?.receiptId) {
    const receipt = document.createElement('p'); receipt.className = 'consent-receipt'; receipt.textContent = 'Квитанция согласия: ' + currentConsent.receiptId; panel.firstElementChild.append(receipt);
  }
  panel.addEventListener('click', async event => {
    const button = event.target.closest('[data-choice]');
    if (!button || button.disabled) return;
    if (button.dataset.choice === 'close') return panel.remove();
    const buttons = [...panel.querySelectorAll('button')]; buttons.forEach(item => { item.disabled = true; });
    panel.querySelector('.cookie-error')?.remove();
    try {
      const decision = button.dataset.choice;
      const receiptId = decision === 'accepted' ? uuid() : currentConsent?.receiptId;
      if (decision === 'accepted') await consentReceipt(receiptId, 'accepted');
      // Stop immediately on refusal, even if the revocation request fails.
      const previous = currentConsent;
      currentConsent = { version: ANALYTICS_VERSION, decision, at: Date.now(), ...(receiptId ? { receiptId } : {}) };
      try { localStorage.setItem(storageKey, JSON.stringify(currentConsent)); } catch {}
      if (decision === 'rejected') {
        stopAnalytics();
        if (previous?.decision === 'accepted' && receiptId) await consentReceipt(receiptId, 'revoked');
      } else startAnalytics();
      panel.remove();
    } catch (error) {
      const paragraph = document.createElement('p'); paragraph.className = 'cookie-error'; paragraph.setAttribute('role', 'alert'); paragraph.textContent = error.message; panel.append(paragraph);
    } finally { buttons.forEach(item => { item.disabled = false; }); }
  });
  document.body.append(panel);
}
export async function initializeAnalytics() {
  document.addEventListener('click', event => {
    if (event.target.closest('[data-cookie-settings]')) showPanel();
    const link = event.target.closest('[data-analytics-goal]'); if (link) goal(link.dataset.analyticsGoal);
  });
  try {
    const response = await fetch('/api/config', { signal: AbortSignal.timeout(5000) });
    if (response.ok) counterId = (await response.json()).counterId;
  } catch { /* The page and survey remain available without analytics. */ }
  currentConsent = readChoice();
  if (counterId && !currentConsent) showPanel();
  if (currentConsent?.decision === 'accepted') startAnalytics();
}
