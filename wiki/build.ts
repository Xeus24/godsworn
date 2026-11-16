/**
 * Builds the static wiki into `wiki/dist/` (run `npm run wiki`, then
 * `npm run wiki:serve`). Fails on broken links, duplicate pages or render
 * errors so the wiki never ships dead links.
 */
import { copyFileSync, cpSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildSite } from './core/site';
import { SECTIONS } from './sections';

const here = dirname(fileURLToPath(import.meta.url));
const out = join(here, 'dist');
const started = Date.now();

const result = buildSite(SECTIONS);
if (result.broken.length) {
  console.error(`${result.broken.length} problems:\n  ${result.broken.slice(0, 50).join('\n  ')}${result.broken.length > 50 ? '\n  …' : ''}`);
  process.exit(1);
}

rmSync(out, { recursive: true, force: true });
for (const p of result.pages) {
  const file = join(out, p.path);
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, p.html);
}
cpSync(join(here, 'assets'), join(out, 'assets'), { recursive: true });
for (const a of result.assets) writeFileSync(join(out, a.path), a.html);
copyFileSync(join(here, '..', 'public', 'favicon.svg'), join(out, 'favicon.svg'));
writeFileSync(join(out, 'search-index.json'), JSON.stringify(result.search));

console.log(`Wiki: ${result.pages.length} pages, ${result.search.length} searchable, in ${Date.now() - started} ms → wiki/dist/`);
