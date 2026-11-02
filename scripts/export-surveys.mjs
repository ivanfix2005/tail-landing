import { openStore } from '../server/store.mjs';
const store = openStore(process.env.DATABASE_PATH || './data/tail.sqlite');
try { process.stdout.write(JSON.stringify(store.listSurveys(), null, 2) + '\n'); }
finally { store.close(); }
