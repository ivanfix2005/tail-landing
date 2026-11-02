import { DatabaseSync } from 'node:sqlite';
import { mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

export function openStore(filename) {
  const path = filename === ':memory:' ? filename : resolve(filename);
  if (path !== ':memory:') mkdirSync(dirname(path), { recursive: true });
  const database = new DatabaseSync(path);
  database.exec(`PRAGMA journal_mode=WAL; PRAGMA busy_timeout=5000;
    CREATE TABLE IF NOT EXISTS surveys (id TEXT PRIMARY KEY, payload TEXT NOT NULL, created_at TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS consents (id TEXT PRIMARY KEY, receipt_id TEXT NOT NULL, purpose TEXT NOT NULL, action TEXT NOT NULL, version TEXT NOT NULL, created_at TEXT NOT NULL);
    CREATE INDEX IF NOT EXISTS consents_receipt ON consents(receipt_id);`);
  const findSurvey = database.prepare('SELECT payload, created_at FROM surveys WHERE id = ?');
  const insertSurvey = database.prepare('INSERT INTO surveys (id, payload, created_at) VALUES (?, ?, ?)');
  const insertConsent = database.prepare('INSERT INTO consents (id, receipt_id, purpose, action, version, created_at) VALUES (?, ?, ?, ?, ?, ?)');
  return {
    saveSurvey(value, now = new Date()) {
      const payload = JSON.stringify(value), existing = findSurvey.get(value.id);
      if (existing) return { duplicate: true, conflict: existing.payload !== payload };
      database.exec('BEGIN IMMEDIATE');
      try {
        insertSurvey.run(value.id, payload, now.toISOString());
        insertConsent.run(value.id, value.id, 'survey', 'accepted', value.consentVersion, now.toISOString());
        database.exec('COMMIT');
      } catch (error) { database.exec('ROLLBACK'); throw error; }
      return { duplicate: false, conflict: false };
    },
    saveConsent(value, now = new Date()) {
      const existing = database.prepare('SELECT receipt_id, action, version FROM consents WHERE id = ?').get(value.id);
      if (existing) return existing.receipt_id === value.receiptId && existing.action === value.action && existing.version === value.version ? null : 'Идентификатор квитанции уже используется.';
      if (value.action === 'revoked' && !database.prepare("SELECT id FROM consents WHERE receipt_id = ? AND purpose = 'analytics' AND action = 'accepted'").get(value.receiptId)) return 'Не найдено исходное согласие.';
      insertConsent.run(value.id, value.receiptId, 'analytics', value.action, value.version, now.toISOString());
      return null;
    },
    listSurveys() { return database.prepare('SELECT payload, created_at FROM surveys ORDER BY created_at').all().map(row => ({ ...JSON.parse(row.payload), createdAt: row.created_at })); },
    prune(now = new Date()) {
      const surveyCutoff = new Date(now); surveyCutoff.setUTCFullYear(surveyCutoff.getUTCFullYear() - 1);
      const consentCutoff = new Date(now); consentCutoff.setUTCFullYear(consentCutoff.getUTCFullYear() - 3);
      database.prepare('DELETE FROM surveys WHERE created_at < ?').run(surveyCutoff.toISOString());
      database.prepare('DELETE FROM consents WHERE created_at < ?').run(consentCutoff.toISOString());
    },
    close() { database.close(); },
  };
}
