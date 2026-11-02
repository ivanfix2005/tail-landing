import { openStore } from './store.mjs';
import { createApp } from './app.mjs';

const port = Number(process.env.PORT || 8790);
if (!Number.isInteger(port) || port < 1 || port > 65535) throw Error('Invalid PORT.');
const host = process.env.HOST || '127.0.0.1';
const store = openStore(process.env.DATABASE_PATH || './data/tail.sqlite');
store.prune();
const cleanup = setInterval(() => store.prune(), 3600000); cleanup.unref();
const server = createApp({ store, counterId: process.env.METRIKA_COUNTER_ID, publicOrigin: process.env.PUBLIC_ORIGIN });
server.listen(port, host, () => console.log(`ТЭЙЛ: http://${host}:${port}`));
function stop() { clearInterval(cleanup); server.close(() => { store.close(); process.exit(0); }); }
process.once('SIGINT', stop); process.once('SIGTERM', stop);
