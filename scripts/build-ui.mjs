import { build } from 'esbuild';
import { mkdir, readFile } from 'node:fs/promises';
await mkdir('public/components', { recursive: true });
const licenses = await Promise.all([
  ['Stageshow', 'ui/stageshow-kit/LICENSE'],
  ['React', 'node_modules/react/LICENSE'],
  ['React DOM', 'node_modules/react-dom/LICENSE'],
  ['Lucide React', 'node_modules/lucide-react/LICENSE'],
].map(async ([name, path]) => `${name}\n${await readFile(path, 'utf8')}`));
await build({
  entryPoints: ['ui/benefits.tsx'], bundle: true, format: 'esm', platform: 'browser',
  target: ['chrome110', 'safari17'], outfile: 'public/components/benefits.js',
  minify: true, legalComments: 'eof', jsx: 'automatic',
  banner: { js: `/*! Third-party notices\n${licenses.join('\n\n')}\n*/` },
  define: { 'process.env.NODE_ENV': '"production"' },
});
console.log('Stageshow benefit components built locally.');
