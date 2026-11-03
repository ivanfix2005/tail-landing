import test from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { once } from 'node:events';
import { createApp } from '../server/app.mjs';
import { openStore } from '../server/store.mjs';
import { emptyAnswers, validateSubmission, CONSENT_VERSION, ANALYTICS_VERSION, SURVEY_VERSION } from '../public/survey-model.js';

function validAnswer(overrides = {}) {
  return { ...emptyAnswers(), id: randomUUID(), demoCase: 'recommendation', surveyVersion: SURVEY_VERSION, consentVersion: CONSENT_VERSION, instruments: ['Корпоративные облигации'], decisionProcess: 'Решаю самостоятельно', caseStatus: 'Не было', newsRelevance: 'Нет', serviceChoiceStatus: 'Нет', consent: true, ...overrides };
}
async function fixture(t, options = {}) {
  const directory = await mkdtemp(join(tmpdir(), 'tail-landing-test-'));
  const path = join(directory, 'test.sqlite');
  const store = openStore(path);
  const server = createApp({ store, ...options });
  server.listen(0, '127.0.0.1'); await once(server, 'listening');
  const origin = `http://127.0.0.1:${server.address().port}`;
  t.after(async () => { await new Promise(resolve => server.close(resolve)); store.close(); await rm(directory, { recursive: true, force: true }); });
  return { origin, store, path, post: (route, value, headers = {}) => fetch(origin + route, { method: 'POST', headers: { 'Content-Type': 'application/json', Origin: origin, ...headers }, body: JSON.stringify(value) }) };
}

test('all four pages and their local assets are served independently of the original host', async t => {
  const { origin } = await fixture(t);
  for (const route of ['/', '/privacy', '/consent/survey', '/consent/analytics', '/styles.css', '/landing.css', '/market.css', '/refined.css', '/interactive.css', '/atmosphere.css', '/atmosphere.js', '/components/benefits.js', '/components/benefits.css', '/journey-motion.js', '/interaction-motion.js', '/app.js', '/landing-motion.js', '/market-experience.js', '/market-data.js', '/company-logos/lkoh.png', '/company-logos/sber.png', '/company-logos/gazp.png', '/company-logos/ydex.png', '/company-logos/tatn.png', '/company-logos/gmkn.png', '/company-logos/x5.png', '/company-logos/nvtk.png', '/vendor/gsap.min.js', '/vendor/ScrollTrigger.min.js', '/content.js', '/analytics.js', '/survey-model.js', '/logo.svg', '/favicon.svg', '/fonts/manrope.ttf']) {
    const response = await fetch(origin + route);
    assert.equal(response.status, 200, route);
    assert.equal(response.headers.get('x-content-type-options'), 'nosniff');
    if (route.endsWith('.png')) assert.equal(response.headers.get('content-type'), 'image/png');
    const bytes = await response.arrayBuffer(); assert.ok(bytes.byteLength > 10);
  }
  assert.equal((await fetch(origin + '/progress.css')).status, 200);
  const home = await (await fetch(origin)).text();
  assert.match(home, /<h1\b[^>]*>\s*\S[\s\S]*?<\/h1>/); assert.doesNotMatch(home, /_next|self\.__next_f/);
  assert.match(home, /ЛУКОЙЛ/); assert.doesNotMatch(home, /ДЕМО-001|Северный ресурс/);
  assert.deepEqual(await (await fetch(origin + '/api/config')).json(), { counterId: null });
});

test('survey is persisted, returns a receipt, and exact retries create no duplicates', async t => {
  const { post, store, path } = await fixture(t);
  const value = validAnswer();
  const response = await post('/api/survey', value);
  assert.equal(response.status, 200); assert.deepEqual(await response.json(), { ok: true, id: value.id, duplicate: false });
  const retry = await post('/api/survey', value);
  assert.equal((await retry.json()).duplicate, true); assert.equal(store.listSurveys().length, 1);
  const secondConnection = openStore(path);
  try { assert.equal(secondConnection.listSurveys()[0].id, value.id); } finally { secondConnection.close(); }
  const changed = await post('/api/survey', { ...value, decisionProcess: 'Изменённый ответ' });
  assert.equal(changed.status, 409); assert.equal(store.listSurveys()[0].decisionProcess, value.decisionProcess);
});

test('conditional fields are cleared when their branches no longer apply', () => {
  const parsed = validateSubmission(validAnswer({ newsCase: 'Старое описание', lastCase: 'Старый случай', researchProcess: 'Скрытый ответ', serviceChoice: 'Уже скрыто', servicePaid: 'Да', paidFor: 'Скрытая оплата', paidAmount: '500' }));
  assert.ok(parsed.value);
  for (const field of ['newsCase', 'lastCase', 'researchProcess', 'serviceChoice', 'servicePaid', 'paidFor', 'paidAmount']) assert.equal(parsed.value[field], '', field);
});

test('recent cases and paid-service branches require substantive answers', () => {
  assert.ok(validateSubmission(validAnswer({ caseStatus: 'Был за последние три месяца' })).error);
  assert.ok(validateSubmission(validAnswer({ newsRelevance: 'Да' })).error);
  assert.ok(validateSubmission(validAnswer({ serviceChoiceStatus: 'Да', serviceChoice: 'Пробовал', servicePaid: 'Да' })).error);
  assert.ok(validateSubmission(validAnswer({ caseStatus: 'Был за последние три месяца', lastCase: 'Проверял новость', desiredAnswer: 'Понять риск', researchProcess: 'Читал документы', outcome: 'Разобрался', newsRelevance: 'Да', newsCase: 'Налоги', serviceChoiceStatus: 'Да', serviceChoice: 'Сравнил', servicePaid: 'Да', paidFor: 'Разбор' })).value);
});

test('server rejects missing consent, malformed fields, incompatible instruments, and unknown versions', async t => {
  const { post, store } = await fixture(t);
  for (const changes of [{ consent: false }, { instruments: [] }, { instruments: ['Сейчас вложений нет', 'ОФЗ'] }, { instruments: ['unknown'] }, { decisionProcess: 'a'.repeat(2001) }, { paidAmount: {} }, { caseStatus: 'unexpected' }, { id: '../x' }, { consentVersion: 'old' }, { surveyVersion: 0 }, { unexpected: 'field' }]) {
    assert.equal((await post('/api/survey', validAnswer(changes))).status, 400, JSON.stringify(changes).slice(0, 120));
  }
  assert.equal(store.listSurveys().length, 0);
});

test('responses and the database cannot be retrieved through public routes', async t => {
  const { origin, post } = await fixture(t); await post('/api/survey', validAnswer());
  for (const route of ['/api/survey', '/api/surveys', '/data/tail.sqlite', '/.env', '/server/store.mjs', '/%2e%2e%5cserver%5cstore.mjs']) assert.equal((await fetch(origin + route)).status, 404, route);
});

test('JSON endpoints reject cross-origin, wrong media type, malformed JSON and oversized requests', async t => {
  const { origin, post } = await fixture(t);
  assert.equal((await post('/api/survey', validAnswer(), { Origin: 'https://other.example' })).status, 403);
  assert.equal((await post('/api/survey', validAnswer(), { 'Content-Type': 'text/plain' })).status, 415);
  const malformed = await fetch(origin + '/api/survey', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{' }); assert.equal(malformed.status, 400);
  assert.equal((await post('/api/survey', { padding: 'a'.repeat(33000) })).status, 413);
});

test('analytics consent receipts support acceptance, retries and revocation', async t => {
  const { post } = await fixture(t);
  const receipt = { id: randomUUID(), receiptId: randomUUID(), action: 'accepted', version: ANALYTICS_VERSION };
  assert.equal((await post('/api/consent', receipt)).status, 200);
  assert.equal((await post('/api/consent', receipt)).status, 200);
  assert.equal((await post('/api/consent', { ...receipt, action: 'revoked', id: randomUUID() })).status, 200);
  assert.equal((await post('/api/consent', { ...receipt, action: 'revoked', receiptId: randomUUID(), id: randomUUID() })).status, 409);
});

test('retention deletes survey content after one year', t => {
  const store = openStore(':memory:'); t.after(() => store.close());
  store.saveSurvey(validateSubmission(validAnswer()).value, new Date('2024-01-01T00:00:00Z'));
  store.saveSurvey(validateSubmission(validAnswer()).value, new Date('2026-06-01T00:00:00Z'));
  store.prune(new Date('2026-11-03T00:00:00Z'));
  assert.equal(store.listSurveys().length, 1);
});

test('write requests are rate limited', async t => {
  const { post } = await fixture(t, { maxPerMinute: 1 });
  assert.equal((await post('/api/survey', validAnswer())).status, 200);
  const response = await post('/api/survey', validAnswer());
  assert.equal(response.status, 429); assert.equal(response.headers.get('retry-after'), '60');
});
