import { readdir, readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { spawnSync } from 'node:child_process';

let checked = 0;
async function visit(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = resolve(directory, entry.name);
    if (entry.isDirectory()) await visit(path);
    else if (/\.(?:mjs|js)$/.test(entry.name)) {
      const result = spawnSync(process.execPath, ['--check', path], { encoding: 'utf8' });
      if (result.status) throw Error(result.stderr);
      checked++;
    } else if (entry.name.endsWith('.html')) {
      const html = await readFile(path, 'utf8');
      if (!html.includes('lang="ru"') || !html.includes('/app.js') || /_next|self\.__next_f/.test(html)) throw Error('Invalid restored page: ' + path);
    }
  }
}
for (const directory of ['public', 'server', 'scripts', 'tests']) await visit(resolve(directory));
console.log(`Syntax and restored pages checked: ${checked} JavaScript modules.`);
