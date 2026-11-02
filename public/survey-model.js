import { content } from './content.js';

export const SURVEY_VERSION = 3;
export const CONSENT_VERSION = 'survey-2026-10-21';
export const ANALYTICS_VERSION = 'analytics-2026-10-21';
export const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
export const scalarFields = [...content.textFields, 'caseStatus', 'newsRelevance', 'serviceChoiceStatus', 'servicePaid'];

export function emptyAnswers() {
  return { instruments: [], ...Object.fromEntries(scalarFields.map(key => [key, ''])), consent: false };
}

export function hasCase(answers) {
  return content.caseStatuses.slice(0, 2).includes(answers.caseStatus);
}

export function surveySteps(answers) {
  return ['Не было', 'Не помню'].includes(answers.caseStatus)
    ? ['portfolio', 'case', 'news', 'services']
    : ['portfolio', 'case', 'process', 'news', 'services'];
}

export function normalizeAnswers(answers) {
  const result = emptyAnswers();
  result.instruments = [...new Set(answers.instruments)];
  for (const key of scalarFields) result[key] = answers[key].trim();
  result.consent = answers.consent === true;
  if (!hasCase(result)) {
    for (const key of ['lastCase', 'desiredAnswer', 'researchProcess', 'outcome', 'timeSpent']) result[key] = '';
  }
  if (result.newsRelevance !== 'Да') result.newsCase = '';
  if (result.serviceChoiceStatus !== 'Да') { result.serviceChoice = ''; result.servicePaid = ''; }
  if (result.servicePaid !== 'Да') { result.paidFor = ''; result.paidAmount = ''; }
  return result;
}

export function validateStep(answers, step) {
  const fields = {
    portfolio: ['decisionProcess'], case: ['lastCase', 'desiredAnswer'],
    process: ['researchProcess', 'outcome', 'timeSpent'], news: ['similarCases', 'newsCase'],
    services: ['serviceChoice', 'paidFor', 'paidAmount'],
  };
  if (fields[step].some(key => answers[key].length > 2000)) return 'Сократите ответ с дополнением до 2000 символов.';
  if (step === 'portfolio') {
    if (!answers.instruments.length) return 'Выберите инструменты или вариант «Сейчас вложений нет».';
    if (!answers.decisionProcess.trim()) return 'Выберите, как принимаете решения, или добавьте свой ответ.';
  }
  if (step === 'case') {
    if (!content.caseStatuses.includes(answers.caseStatus)) return 'Укажите, был ли у вас такой случай.';
    if (answers.caseStatus === content.caseStatuses[0] && (!answers.lastCase.trim() || !answers.desiredAnswer.trim())) return 'Укажите последний случай и ответ, который хотели получить.';
  }
  if (step === 'process' && answers.caseStatus === content.caseStatuses[0] && (!answers.researchProcess.trim() || !answers.outcome.trim())) return 'Выберите, как вы разбирались и чем это закончилось, или добавьте свой ответ.';
  if (step === 'news') {
    if (!content.yesNo.includes(answers.newsRelevance)) return 'Укажите, проверяли ли вы связь новости со своими бумагами.';
    if (answers.newsRelevance === 'Да' && !answers.newsCase.trim()) return 'Выберите вариант случая с новостью или опишите его своими словами.';
  }
  if (step === 'services') {
    if (!content.yesNo.includes(answers.serviceChoiceStatus)) return 'Укажите, выбирали ли вы аналитический сервис или человека.';
    if (answers.serviceChoiceStatus === 'Да') {
      if (!answers.serviceChoice.trim()) return 'Расскажите, как вы выбирали помощь.';
      if (!content.yesNo.includes(answers.servicePaid)) return 'Укажите, была ли фактическая оплата.';
      if (answers.servicePaid === 'Да' && !answers.paidFor.trim()) return 'Расскажите, за что вы заплатили. Если не помните, так и напишите.';
    }
  }
  return null;
}

export function validateSubmission(input) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) return { error: 'Ожидается объект с ответами.' };
  const allowed = new Set(['id', 'demoCase', 'surveyVersion', 'consentVersion', 'instruments', 'consent', ...scalarFields]);
  if (Object.keys(input).some(key => !allowed.has(key))) return { error: 'Неизвестные поля опроса.' };
  if (!UUID.test(input.id ?? '') || !Object.hasOwn(content.cases, input.demoCase)) return { error: 'Некорректный идентификатор ответа или сценария.' };
  if (input.surveyVersion !== SURVEY_VERSION || input.consentVersion !== CONSENT_VERSION) return { error: 'Обновите страницу: версия опроса изменилась.' };
  if (!Array.isArray(input.instruments) || input.instruments.length > content.instruments.length || input.instruments.some(value => !content.instruments.includes(value))) return { error: 'Некорректные инструменты.' };
  if (input.instruments.includes('Сейчас вложений нет') && input.instruments.length > 1) return { error: 'Вариант «Сейчас вложений нет» выбирается отдельно.' };
  if (scalarFields.some(key => typeof input[key] !== 'string' || input[key].length > 2000)) return { error: 'Некорректный ответ или превышен лимит 2000 символов.' };
  const answers = normalizeAnswers(input);
  for (const step of surveySteps(answers)) {
    const error = validateStep(answers, step);
    if (error) return { error };
  }
  if (!answers.consent) return { error: 'Подтвердите отправку ответов команде ТЭЙЛ.' };
  return { value: { ...answers, id: input.id, demoCase: input.demoCase, surveyVersion: SURVEY_VERSION, consentVersion: CONSENT_VERSION } };
}
