import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, readdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';

test('public demo cannot submit answers or load live analytics, and preserves the live source', async t => {
  const directory = await mkdtemp(join(tmpdir(), 'tail-demo-test-'));
  t.after(() => rm(directory, { recursive: true, force: true }));
  const output = join(directory, 'public');
  const built = spawnSync(process.execPath, ['scripts/build-demo.mjs', output], { encoding: 'utf8' });
  assert.equal(built.status, 0, built.stderr);
  const app = await readFile(join(output, 'app.js'), 'utf8');
  const analytics = await readFile(join(output, 'analytics.js'), 'utf8');
  assert.doesNotMatch(app + analytics, /fetch\s*\(|\/api\/|localStorage|sessionStorage|document\.cookie/);
  assert.doesNotMatch(app, /Квитанция ответа|Ответы сохранены|Отправить ответы|name="consent"/);
  assert.match(app, /Завершить демонстрацию/);
  assert.match(app, /никуда не отправлялись и не сохранялись/);
  for (const path of ['privacy', 'consent/survey', 'consent/analytics']) {
    const html = await readFile(join(output, path, 'index.html'), 'utf8');
    assert.match(html, /отправка ответов отключена/);
    assert.doesNotMatch(html, /192\.144\.14\.178|до 3 лет|на территории РФ|survey-2026-10-21/);
  }
  const home = await readFile(join(output, 'index.html'), 'utf8');
  assert.equal((home.match(/<details[ >]/g) || []).length, (await readFile('public/index.html', 'utf8')).match(/<details[ >]/g).length);
  assert.match(home, /Демоверсия · ответы не отправляются/);
  const version = home.match(/app\.js\?v=([a-f0-9]+)/)?.[1];
  assert.ok(version, 'The entry module must invalidate the browser cache on publication.');
  const market = await readFile(join(output, 'market-experience.js'), 'utf8');
  assert.ok(market.includes(`./journey-motion.js?v=${version}`), 'Dependent modules must use the same new publication version.');
  assert.ok(home.includes(`/atmosphere.css?v=${version}`));
  assert.match(home, /После перезагрузки страницы введённые ответы исчезнут/);
  assert.match(await readFile('public/app.js', 'utf8'), /fetch\('\/api\/survey'/);
  assert.ok(!(await readdir(output)).includes('server'));
  const repeated = spawnSync(process.execPath, ['scripts/build-demo.mjs', output], { encoding: 'utf8' });
  assert.notEqual(repeated.status, 0, 'Existing output must never be silently overwritten.');
});
