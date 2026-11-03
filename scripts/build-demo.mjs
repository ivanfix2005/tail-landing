import { cp, mkdir, readFile, writeFile, stat, readdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { resolve, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const sourceRoot = fileURLToPath(new URL('../public/', import.meta.url));
const output = resolve(process.argv[2] || '.runtime/demo-public');
if (await stat(output).catch(() => null)) throw Error('Choose a new output directory; existing files are preserved.');
await mkdir(output, { recursive: true });
await cp(sourceRoot, output, { recursive: true });
const replace = (text, before, after) => {
  if (!text.includes(before) || text.indexOf(before) !== text.lastIndexOf(before)) throw Error('Demo source changed: ' + before.slice(0, 70));
  return text.replace(before, after);
};

let app = (await readFile(join(output, 'app.js'), 'utf8')).replaceAll('\r\n', '\n');
const start = app.indexOf('  if (!normalized.consent)');
const end = app.indexOf('\n});\n\ninitializeInteractions();', start);
if (start < 0 || end < start) throw Error('Survey submission boundary changed.');
app = app.slice(0, start) + `  finishSurveyProgress(steps);
  survey.classList.add('is-complete');
  survey.innerHTML = '<div class="survey-success" role="status"><span class="success-icon">' + icon('check', 30) + '</span><h3>Вы посмотрели анкету.</h3><p>Это демонстрация. Ваши ответы никуда не отправлялись и не сохранялись.</p><a href="#example" class="text-link">Вернуться к разбору ' + icon('up') + '</a></div>';
  document.dispatchEvent(new Event('tail:layout-change'));
` + app.slice(end);
app = replace(app, "'Отправить ответы'", "'Завершить демонстрацию'");
const consentStart = app.indexOf('    + `<div class="privacy-note">');
const consentEnd = app.indexOf('</label>`;', consentStart);
if (consentStart < 0 || consentEnd < consentStart) throw Error('Survey consent boundary changed.');
app = app.slice(0, consentStart) + '    + `<div class="privacy-note">${icon(\'check\')}<p>Демонстрация анкеты: ответы остаются только в памяти этой вкладки до её закрытия или перезагрузки. Не вводите личные данные.</p></div>`;' + app.slice(consentEnd + '</label>`;'.length);
app = replace(app, 'survey.innerHTML = `<form class="survey-main">', 'survey.innerHTML = `<p class="demo-disclosure" role="note">Демоверсия · ответы не отправляются</p><form class="survey-main">');
await writeFile(join(output, 'app.js'), app);

// Deliberately contains no network, telemetry, cookies or persistent form storage.
await writeFile(join(output, 'analytics.js'), `export function uuid() { return crypto.randomUUID(); }
export function goal() {}
export function initializeAnalytics() {
  document.addEventListener('click', event => {
    if (!event.target.closest('[data-cookie-settings]')) return;
    if (document.querySelector('.cookie-panel')) return;
    const panel = document.createElement('aside');
    panel.className = 'cookie-panel'; panel.setAttribute('role', 'dialog'); panel.setAttribute('aria-label', 'О демонстрации');
    panel.innerHTML = '<div><h2>Демонстрация ТЭЙЛ</h2><p>Отправка опроса и Яндекс Метрика отключены. Ответы не передаются команде и исчезнут после перезагрузки страницы. При открытии сайта хостинг получает технические сведения, необходимые для загрузки страницы.</p><a href="/privacy/">Подробнее</a></div><div class="cookie-actions"><button type="button" class="button cookie-decline">Закрыть</button></div>';
    panel.querySelector('button').addEventListener('click', () => panel.remove()); document.body.append(panel);
  });
}
`);

let home = await readFile(join(output, 'index.html'), 'utf8');
home = home.replaceAll('Поделиться опытом', 'Посмотреть анкету')
  .replace('Ваши ситуации помогут выбрать, что делать первым.', 'В этой демонстрации можно пройти все шаги без отправки ответов.')
  .replace('Ваш опыт поможет понять, какой помощи в инвестициях не хватает.', 'В этой демонстрации можно пройти все шаги без отправки ответов.')
  .replace('Политика обработки данных', 'О данных в демо')
  .replace('Согласие на опрос', 'О демо-анкете')
  .replace('Согласие на аналитику', 'Об аналитике')
  .replace('Настройки cookie', 'О демоверсии');
home = replace(home, '<p class="intro-caption hero-reveal">', '<p class="intro-caption hero-reveal"><strong>Демоверсия · ответы не отправляются.</strong><br>');
home = home.replace('Что будет с моими ответами в опросе?', 'Сохраняются ли ответы в этой демонстрации?');
// The FAQ is rendered in HTML, so remove the live-storage claim there too.
home = home.replace(/(<summary[^>]*>[\s\S]*?Сохраняются ли ответы в этой демонстрации\?[\s\S]*?<\/summary>)([\s\S]*?)(<\/details>)/, '$1<div class="faq-answer"><p>Нет. Анкета показывает шаги и варианты ответов, но ничего не отправляет на сервер. После перезагрузки страницы введённые ответы исчезнут.</p></div>$3');
await writeFile(join(output, 'index.html'), home);
await writeFile(join(output, 'demo.css'), '.demo-disclosure{padding:12px 16px;margin:0 0 18px;border:1px solid #b8e6c4;border-radius:12px;background:#eaf8ed;color:#116c36;font:600 14px/1.6 Manrope,sans-serif}.intro-caption strong{color:#14753a}');
home = replace(home, '<link rel="stylesheet" href="/atmosphere.css">', '<link rel="stylesheet" href="/atmosphere.css">\n  <link rel="stylesheet" href="/demo.css">');
await writeFile(join(output, 'index.html'), home);

const demoText = `<p class="legal-version">Демонстрационная версия · 3 ноября 2026 года</p>
<section><h2>Ответы опроса</h2><p>На этой публичной демонстрации отправка ответов отключена. Анкету можно пройти для знакомства с интерфейсом. Введённые значения находятся только в памяти текущей вкладки, не сохраняются в браузере и не передаются команде ТЭЙЛ. После закрытия или перезагрузки страницы они исчезают. Квитанции отправки не выдаются. Не вводите личные данные.</p></section>
<section><h2>Аналитика и хостинг</h2><p>Код этой демонстрации не подключает Яндекс Метрику, не записывает cookie и не сохраняет ответы в localStorage. Для загрузки сайта инфраструктура хостинга получает технические сведения соединения, в том числе IP-адрес и сведения о браузере. Это публичное демо не заявляет хранение технических данных исключительно в РФ.</p></section>
<section><h2>Внешние ссылки</h2><p>Ссылки на документы компаний, GitHub и Telegram ведут на сторонние сайты. При переходе действуют правила соответствующего сервиса. В этой версии нет подключения к брокеру и доступа к вашим счетам.</p></section>
<p>Исходный код и инструкция запуска: <a href="https://github.com/ivanfix2005/tail-landing" target="_blank" rel="noopener noreferrer">GitHub ТЭЙЛ</a>.</p>`;
for (const [path, title] of [['privacy', 'О данных в демонстрации'], ['consent/survey', 'Опрос в демонстрации'], ['consent/analytics', 'Аналитика в демонстрации']]) {
  const file = join(output, path, 'index.html');
  const original = await readFile(file, 'utf8');
  const bodyStart = original.indexOf('<h1>'), bodyEnd = original.indexOf('</main>', bodyStart);
  if (bodyStart < 0 || bodyEnd < bodyStart) throw Error('Legal page structure changed.');
  await writeFile(file, original.slice(0, bodyStart) + '<h1>' + title + '</h1>\n' + demoText + '\n' + original.slice(bodyEnd));
}
// One content version for the whole module graph: publishing a changed child
// module must also invalidate the entry module that imports it.
async function listFiles(directory) {
  const files = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await listFiles(path)); else files.push(path);
  }
  return files.sort();
}
const files = await listFiles(output), hash = createHash('sha256');
for (const file of files) hash.update(file.slice(output.length)).update(await readFile(file));
const version = hash.digest('hex').slice(0, 12);
for (const file of files) {
  if (!/\.(html|js)$/.test(file)) continue;
  let text = await readFile(file, 'utf8');
  text = file.endsWith('.html')
    ? text.replace(/((?:src|href)=["'])(\/(?!\/)[^"'?]+\.(?:js|css))(["'])/g, `$1$2?v=${version}$3`)
    : text.replace(/(["'])(\.\.?\/[^"'\n?]+\.js)\1/g, `$1$2?v=${version}$1`);
  await writeFile(file, text);
}
console.log('Static demo created without API or response storage: ' + output);
