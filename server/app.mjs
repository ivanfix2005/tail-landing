import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { resolve, extname, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { validateSubmission, ANALYTICS_VERSION, UUID } from '../public/survey-model.js';

const mime = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png', '.ttf': 'font/ttf' };
const routeFiles = { '/': 'index.html', '/privacy': 'privacy/index.html', '/consent/survey': 'consent/survey/index.html', '/consent/analytics': 'consent/analytics/index.html' };
class RequestError extends Error { constructor(status, message) { super(message); this.status = status; } }
async function readJson(request) {
  if (request.headers['content-type']?.split(';')[0].trim() !== 'application/json') throw new RequestError(415, 'Используйте application/json.');
  let size = 0; const chunks = [];
  for await (const chunk of request) {
    size += chunk.length;
    if (size > 32768) throw new RequestError(413, 'Слишком большой запрос.');
    chunks.push(chunk);
  }
  try { return JSON.parse(Buffer.concat(chunks).toString('utf8')); } catch { throw new RequestError(400, 'Некорректный JSON.'); }
}
export function createApp({ store, publicDirectory = new URL('../public/', import.meta.url), counterId = null, publicOrigin = '', maxPerMinute = 30 } = {}) {
  if (!store) throw Error('A data store is required.');
  const root = resolve(publicDirectory instanceof URL ? fileURLToPath(publicDirectory) : publicDirectory);
  const rates = new Map();
  const server = createServer(async (request, response) => {
    response.setHeader('X-Content-Type-Options', 'nosniff');
    response.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    response.setHeader('X-Frame-Options', 'DENY');
    response.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self' https://mc.yandex.ru https://mc.yandex.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: https://*.yandex.ru https://*.yandex.com; font-src 'self'; connect-src 'self' https://*.yandex.ru https://*.yandex.com; frame-src https://*.yandex.ru; frame-ancestors 'none'; base-uri 'self'; form-action 'self'");
    const json = (status, value) => {
      response.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' }); response.end(JSON.stringify(value));
    };
    try {
      const url = new URL(request.url, 'http://localhost');
      if (request.method === 'POST' && ['/api/survey', '/api/consent'].includes(url.pathname)) {
        const origin = request.headers.origin;
        const expected = publicOrigin || `http://${request.headers.host}`;
        if (origin && origin !== expected) throw new RequestError(403, 'Недопустимый источник запроса.');
        const now = Date.now(), address = request.socket.remoteAddress;
        for (const [key, value] of rates) if (value.resetAt <= now) rates.delete(key);
        let bucket = rates.get(address);
        if (!bucket) { bucket = { count: 0, resetAt: now + 60000 }; rates.set(address, bucket); }
        if (++bucket.count > maxPerMinute) { response.setHeader('Retry-After', '60'); throw new RequestError(429, 'Слишком много отправок. Подождите минуту.'); }
        const input = await readJson(request);
        if (url.pathname === '/api/survey') {
          const parsed = validateSubmission(input);
          if (parsed.error) throw new RequestError(400, parsed.error);
          const saved = store.saveSurvey(parsed.value);
          if (saved.conflict) throw new RequestError(409, 'Этот ответ уже сохранён с другим содержанием. Обновите страницу для нового ответа.');
          return json(200, { ok: true, id: parsed.value.id, duplicate: saved.duplicate });
        }
        if (!input || typeof input !== 'object' || Array.isArray(input) || Object.keys(input).some(key => !['id', 'receiptId', 'action', 'version'].includes(key)) || !UUID.test(input.id ?? '') || !UUID.test(input.receiptId ?? '') || !['accepted', 'revoked'].includes(input.action) || input.version !== ANALYTICS_VERSION) throw new RequestError(400, 'Некорректная квитанция согласия.');
        const error = store.saveConsent(input);
        if (error) throw new RequestError(409, error);
        return json(200, { ok: true });
      }
      if (!['GET', 'HEAD'].includes(request.method)) { response.setHeader('Allow', 'GET, HEAD'); throw new RequestError(405, 'Метод не поддерживается.'); }
      if (url.pathname === '/api/health') return json(200, { ok: true });
      if (url.pathname === '/api/config') return json(200, { counterId: /^\d+$/.test(String(counterId ?? '')) ? Number(counterId) : null });
      if (url.pathname.startsWith('/api/')) throw new RequestError(404, 'Не найдено.');
      let pathname;
      try { pathname = decodeURIComponent(url.pathname); } catch { throw new RequestError(400, 'Некорректный адрес.'); }
      const relative = routeFiles[pathname.replace(/\/$/, '') || '/'] ?? pathname.slice(1);
      const file = resolve(root, relative);
      if (!file.startsWith(root + sep) || relative.split(/[\\/]/).some(part => part.startsWith('.'))) throw new RequestError(404, 'Не найдено.');
      let bytes;
      try { bytes = await readFile(file); } catch (error) { if (['ENOENT', 'EISDIR'].includes(error.code)) throw new RequestError(404, 'Не найдено.'); throw error; }
      const type = mime[extname(file)];
      if (!type) throw new RequestError(404, 'Не найдено.');
      response.writeHead(200, { 'Content-Type': type, 'Content-Length': bytes.length, 'Cache-Control': extname(file) === '.html' ? 'no-store' : 'no-cache' });
      response.end(request.method === 'HEAD' ? undefined : bytes);
    } catch (error) {
      if (!error.status) console.error('Request failed:', error.code ?? error.name);
      if (!response.headersSent) json(error.status ?? 500, { ok: false, error: error.status ? error.message : 'Не удалось сохранить данные. Попробуйте позже.' });
      else response.end();
    }
  });
  server.requestTimeout = 20000;
  server.headersTimeout = 10000;
  return server;
}
