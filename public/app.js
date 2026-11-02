import { content } from './content.js';
import { emptyAnswers, hasCase, surveySteps, normalizeAnswers, validateStep, SURVEY_VERSION, CONSENT_VERSION } from './survey-model.js';
import { initializeAnalytics, goal, uuid } from './analytics.js';
import { initializeLandingMotion } from './landing-motion.js';

const escape = value => String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
const icon = (name, size = 18) => `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${({ right: '<path d="M5 12h14m-7-7 7 7-7 7"/>', left: '<path d="m12 19-7-7 7-7M19 12H5"/>', down: '<path d="m6 9 6 6 6-6"/>', plus: '<path d="M5 12h14M12 5v14"/>', check: '<path d="m20 6-11 11-5-5"/>', up: '<path d="M7 7h10v10M7 17 17 7"/>' })[name]}</svg>`;
let activeCase = Object.keys(content.cases)[0];

const scenarioButtons = document.querySelectorAll('.case-switch button');
function showCase(key) {
  activeCase = key;
  const item = content.cases[key];
  scenarioButtons.forEach((button, index) => {
    const selected = Object.keys(content.cases)[index] === key;
    button.setAttribute('aria-pressed', String(selected));
    button.classList.toggle('active', selected);
  });
  const dossier = document.querySelector('.dossier');
  dossier.querySelector('.issue-label').textContent = item.issue + ' · ' + item.instrumentType;
  dossier.querySelector('.dossier-head h3').textContent = item.company;
  const tag = dossier.querySelector('.status-tag');
  tag.textContent = item.status;
  tag.classList.toggle('neutral', key === 'record-date');
  dossier.querySelector('.case-title').textContent = item.title;
  dossier.querySelector('.finding-mark.fact').closest('.finding').querySelector('p').textContent = item.fact;
  dossier.querySelector('.finding-mark.unknown').closest('.finding').querySelector('p').textContent = item.unknown;
  dossier.querySelector('.watch-next p').textContent = item.watch;
  const details = dossier.querySelector('.demo-details');
  details.open = false;
  details.querySelector('.demo-details-content').innerHTML = `
    <h4>Фрагмент источника</h4><blockquote>${escape(item.source)}</blockquote>
    <h4>Что заявлено</h4><p>${escape(item.statement)}</p>
    <h4>Связь с другими бумагами</h4><p>${escape(item.other)}</p>
    <h4>Хронология</h4><ol class="timeline">${item.history.map(line => {
      const [time, text] = line.split(' · ');
      return `<li><span class="timeline-dot"></span><strong>${escape(time)}</strong><p>${escape(text)}</p></li>`;
    }).join('')}</ol><div class="verified-source-links">${item.sources.map(source => `<a href="${escape(source.url)}" target="_blank" rel="noopener noreferrer">${escape(source.label)} ${icon('up')}</a>`).join('')}</div><p class="source-note">Реальные публичные документы. Исторический срез; не данные вашего счёта.</p>`;
}
scenarioButtons.forEach((button, index) => button.addEventListener('click', () => showCase(Object.keys(content.cases)[index])));
if (scenarioButtons.length) showCase(activeCase);

const survey = document.getElementById('survey-app');
const answers = emptyAnswers();
const drafts = {};
const openComments = new Set();
let stepIndex = 0;
let started = false;
let sending = false;
let receiptId = '';
function markStarted() { if (!started) { started = true; goal('survey_start'); } }
function setAnswer(name, value) { markStarted(); answers[name] = value; survey.querySelector('.form-error')?.remove(); }
function selectField(name, help = '') {
  const draft = drafts[name] ?? { selection: '', comment: '' };
  const id = 'survey-' + name;
  return `<div class="answer-field">
    <label class="answer-label" for="${id}">${escape(content.questions[name])}</label>
    ${help ? `<p class="field-help" id="${id}-help">${escape(help)}</p>` : ''}
    <div class="select-wrap"><select id="${id}" name="${name}" ${help ? `aria-describedby="${id}-help"` : ''}>
      <option value="">Выберите вариант</option>${content.options[name].map(option => `<option ${draft.selection === option ? 'selected' : ''} value="${escape(option)}">${escape(option)}</option>`).join('')}
    </select>${icon('down')}</div>
    <button type="button" class="own-answer-toggle" data-comment="${name}" aria-expanded="${openComments.has(name)}" aria-controls="${id}-own">${icon('plus', 14)}<span class="comment-label">${openComments.has(name) ? 'Свернуть свой ответ' : 'Добавить свой ответ'}</span><span>необязательно</span></button>
    <div class="own-answer" id="${id}-own" ${openComments.has(name) ? '' : 'hidden'}><label for="${id}-comment">Ваш ответ или дополнение</label>
      <textarea id="${id}-comment" name="${name}Comment" rows="3" maxlength="${2000 - (draft.selection ? draft.selection.length + 13 : 0)}" placeholder="Можно уточнить выбранный вариант или ответить своими словами">${escape(draft.comment)}</textarea>
    </div></div>`;
}
function choices(name, values, label) {
  return `<fieldset><legend>${escape(label)}</legend><div class="choices">${values.map(value => `<label class="choice ${answers[name] === value ? 'selected' : ''}"><input type="radio" name="${name}" value="${escape(value)}" ${answers[name] === value ? 'checked' : ''}><span>${escape(value)}</span></label>`).join('')}</div></fieldset>`;
}
function fields(step) {
  if (step === 'portfolio') return `<fieldset><legend class="sr-only">${content.questions.instruments}</legend><p class="field-help">Можно выбрать несколько.</p><div class="choices instrument-choices">${content.instruments.map(value => `<label class="choice ${answers.instruments.includes(value) ? 'selected' : ''}"><input type="checkbox" name="instruments" value="${escape(value)}" ${answers.instruments.includes(value) ? 'checked' : ''}><span>${escape(value)}</span></label>`).join('')}</div></fieldset>${selectField('decisionProcess', 'Выберите вариант или добавьте свой ответ.')}`;
  if (step === 'case') return choices('caseStatus', content.caseStatuses, content.questions.caseStatus) + (hasCase(answers) ? selectField('lastCase') + selectField('desiredAnswer') : answers.caseStatus ? '<p class="survey-branch-note">Подробности пропустим и перейдём к похожим ситуациям и выбору помощи.</p>' : '');
  if (step === 'process') return selectField('researchProcess', 'Если способов было несколько, их можно перечислить в своём ответе.') + selectField('outcome', 'Если хотите, дополните: как вы поняли, что можно остановиться?') + selectField('timeSpent', 'Необязательно. Если не помните, можно пропустить.');
  if (step === 'news') return selectField('similarCases', 'Необязательно. Можно пропустить.') + choices('newsRelevance', content.yesNo, content.questions.newsRelevance) + (answers.newsRelevance === 'Да' ? selectField('newsCase', 'Детали можно добавить своими словами.') : '');
  return choices('serviceChoiceStatus', content.yesNo, content.questions.serviceChoiceStatus)
    + (answers.serviceChoiceStatus === 'Да' ? selectField('serviceChoice') + choices('servicePaid', content.yesNo, 'Вы фактически платили за эту помощь?') + (answers.servicePaid === 'Да' ? selectField('paidFor') + selectField('paidAmount', 'Необязательно. Точную сумму и валюту можно указать в своём ответе.') : '') : '')
    + `<div class="privacy-note">${icon('check')}<p>Сохраняем ответы и время отправки для исследования. Контакты и данные брокерского счёта не нужны. Не указывайте личные данные в свободном тексте.</p></div>
      <label class="consent"><input type="checkbox" name="consent" ${answers.consent ? 'checked' : ''}><span>Даю <a href="/consent/survey" target="_blank" rel="noopener noreferrer">отдельное согласие на обработку ответов опроса</a> для исследования продукта ТЭЙЛ. <a href="/privacy" target="_blank" rel="noopener noreferrer">Политика обработки персональных данных</a>.</span></label>`;
}
function renderSurvey({ focus = false } = {}) {
  if (!survey) return;
  const steps = surveySteps(answers), step = steps[stepIndex];
  survey.innerHTML = `<form class="survey-main"><div class="survey-question-content"><h3 tabindex="-1">${content.stepTitles[step]}</h3><p class="survey-step-description">${content.stepDescriptions[step]}</p>${fields(step)}</div>
    <div class="form-actions"><div class="survey-progress"><span aria-live="polite" aria-atomic="true">Шаг ${stepIndex + 1} из ${steps.length}</span><div class="progress-line" aria-hidden="true"><span style="width:${(stepIndex + 1) / steps.length * 100}%"></span></div></div>
    <div class="survey-navigation"><button type="button" class="survey-nav-back" aria-label="Назад" ${stepIndex === 0 || sending ? 'disabled' : ''}>${icon('left', 20)}</button><button type="submit" class="survey-nav-next" ${sending ? 'disabled' : ''}>${sending ? 'Сохраняем…' : stepIndex === steps.length - 1 ? 'Отправить ответы' : 'Далее'}${icon('right')}</button></div></div></form>`;
  if (focus) {
    survey.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth', block: 'start' });
    survey.querySelector('h3').focus({ preventScroll: true });
  }
}
function showError(message) {
  survey.querySelector('.form-error')?.remove();
  const paragraph = document.createElement('p');
  paragraph.className = 'form-error'; paragraph.setAttribute('role', 'alert'); paragraph.textContent = message;
  survey.querySelector('.survey-question-content').append(paragraph);
}
function updateDraft(name, key, value) {
  drafts[name] ??= { selection: '', comment: '' };
  drafts[name][key] = value;
  const { selection, comment } = drafts[name];
  setAnswer(name, selection.trim() && comment.trim() ? `${selection.trim()}\nСвой ответ: ${comment.trim()}` : selection.trim() || comment.trim());
}
function toggleComment(name) {
  const button = survey.querySelector(`[data-comment="${name}"]`);
  const open = !openComments.has(name);
  if (open) openComments.add(name); else openComments.delete(name);
  button.setAttribute('aria-expanded', String(open));
  button.querySelector('.comment-label').textContent = open ? 'Свернуть свой ответ' : 'Добавить свой ответ';
  document.getElementById('survey-' + name + '-own').hidden = !open;
}
survey?.addEventListener('input', event => {
  if (event.target.tagName === 'TEXTAREA') updateDraft(event.target.name.slice(0, -7), 'comment', event.target.value);
});
survey?.addEventListener('change', event => {
  const target = event.target, name = target.name;
  if (target.tagName === 'SELECT') {
    updateDraft(name, 'selection', target.value);
    const textarea = survey.querySelector(`[name="${name}Comment"]`);
    textarea.maxLength = 2000 - (target.value ? target.value.length + 13 : 0);
    if (target.value.startsWith('Друг') && !openComments.has(name)) toggleComment(name);
  } else if (name === 'instruments') {
    const none = 'Сейчас вложений нет';
    const values = target.checked ? target.value === none ? [none] : [...answers.instruments.filter(value => value !== none), target.value] : answers.instruments.filter(value => value !== target.value);
    setAnswer(name, values);
    survey.querySelectorAll('[name="instruments"]').forEach(input => { input.checked = values.includes(input.value); input.closest('label').classList.toggle('selected', input.checked); });
  } else if (name === 'consent') setAnswer(name, target.checked);
  else if (target.type === 'radio') {
    const value = target.value;
    setAnswer(name, value); renderSurvey();
    [...survey.querySelectorAll('input[type="radio"]')].find(input => input.name === name && input.value === value)?.focus({ preventScroll: true });
  }
});
survey?.addEventListener('click', event => {
  const commentButton = event.target.closest('[data-comment]');
  if (commentButton) toggleComment(commentButton.dataset.comment);
  if (event.target.closest('.survey-nav-back') && !sending && stepIndex > 0) { stepIndex--; renderSurvey({ focus: true }); }
});
survey?.addEventListener('submit', async event => {
  event.preventDefault();
  if (sending) return;
  const steps = surveySteps(answers);
  const error = validateStep(answers, steps[stepIndex]);
  if (error) return showError(error);
  if (stepIndex < steps.length - 1) { stepIndex++; return renderSurvey({ focus: true }); }
  const normalized = normalizeAnswers(answers);
  for (let index = 0; index < steps.length; index++) {
    const invalid = validateStep(normalized, steps[index]);
    if (invalid) { stepIndex = index; renderSurvey({ focus: true }); return showError(invalid); }
  }
  if (!normalized.consent) return showError('Подтвердите отправку ответов команде ТЭЙЛ.');
  receiptId ||= uuid();
  sending = true; renderSurvey();
  try {
    const response = await fetch('/api/survey', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...normalized, id: receiptId, demoCase: activeCase, surveyVersion: SURVEY_VERSION, consentVersion: CONSENT_VERSION }), signal: AbortSignal.timeout(15000) });
    const result = await response.json();
    if (!response.ok || !result.ok) throw Error(result.error || 'Не удалось сохранить ответ.');
    goal('survey_complete');
    survey.classList.add('is-complete');
    survey.innerHTML = `<div class="survey-success" role="status"><span class="success-icon">${icon('check', 30)}</span><h3>Спасибо за честный ответ.</h3><p>Ответы сохранены. Теперь присоединяйтесь к бета-тестерам: в чате можно обсудить идею и узнать о доступе к продукту.</p><p class="survey-receipt">Квитанция ответа: <code>${receiptId}</code>. Сохраните её для обращения об удалении ответа.</p><a href="#example" class="text-link">Попробовать демо-разбор ${icon('up')}</a></div>`;
    const offer = document.createElement('section');
    offer.id = 'beta-offer'; offer.className = 'beta-offer container'; offer.dataset.analyticsSection = 'beta';
    offer.innerHTML = `<div class="beta-discount" aria-hidden="true">−50<span>%</span></div><div class="beta-copy"><span class="beta-eyebrow">Опрос пройден. Давайте пробовать дальше.</span><h2>Попробуйте ТЭЙЛ в числе первых</h2><p>Вступайте в закрытый чат бета-тестеров, обсуждайте разборы и узнавайте о доступе к продукту. Для участников — скидка 50% на будущую подписку.</p><span class="beta-note">Сервис готовится к запуску. О бета-доступе и условиях скидки сообщим в чате.</span></div><a class="button primary beta-button" data-analytics-goal="beta_chat_click" href="${content.telegramUrl}" target="_blank" rel="noopener noreferrer">Вступить в чат бета-тестеров ${icon('up')}</a>`;
    document.getElementById('survey').after(offer);
    document.dispatchEvent(new Event('tail:layout-change'));
    offer.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth', block: 'center' });
  } catch (error) {
    sending = false; renderSurvey();
    showError(error.name === 'TimeoutError' ? 'Сервер не ответил вовремя. Попробуйте отправить ещё раз.' : error.message || 'Нет связи с сервером. Попробуйте ещё раз.');
  }
});

renderSurvey();
initializeAnalytics();
initializeLandingMotion();
