import { cpSync, existsSync, mkdirSync, readFileSync, renameSync, statSync, writeFileSync } from 'node:fs';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { extname, join, normalize, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig, type Plugin } from 'vitest/config';

const pkg = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8')) as { version: string };

/**
 * Mirrors the game's autosaves into the project's `saves/` folder (dev and
 * preview servers only; a static host has no such endpoint and the game
 * quietly keeps just its browser copy).
 */
function saveToFolder(): Plugin {
  const dir = join(fileURLToPath(new URL('.', import.meta.url)), 'saves');
  const handler = (req: IncomingMessage, res: ServerResponse, next: () => void): void => {
    if (req.method !== 'POST' || !req.url?.startsWith('/__godsworn/save')) return next();
    const name = new URL(req.url, 'http://localhost').searchParams.get('name') ?? '';
    if (!/^[a-z0-9_-]{1,40}$/i.test(name)) {
      res.statusCode = 400;
      return void res.end('bad name');
    }
    const chunks: Buffer[] = [];
    let size = 0;
    req.on('data', (c: Buffer) => {
      size += c.length;
      if (size > 50 * 1024 * 1024) req.destroy();
      else chunks.push(c);
    });
    req.on('end', () => {
      try {
        mkdirSync(dir, { recursive: true });
        const file = join(dir, `${name}.json`);
        writeFileSync(`${file}.tmp`, Buffer.concat(chunks));
        renameSync(`${file}.tmp`, file);
        res.statusCode = 204;
      } catch {
        res.statusCode = 500;
      }
      res.end();
    });
  };
  return {
    name: 'godsworn-save-to-folder',
    configureServer: (server) => void server.middlewares.use(handler),
    configurePreviewServer: (server) => void server.middlewares.use(handler),
  };
}

/**
 * The wiki (built by `npm run wiki` into `wiki/dist/`) is served at `/wiki/`:
 * the dev server reads it straight from `wiki/dist/`, and a production build
 * copies it to `dist/wiki/` (so the preview server and the Mac app serve it too).
 */
function wikiAtSlashWiki(): Plugin {
  const root = fileURLToPath(new URL('.', import.meta.url));
  const wikiDist = join(root, 'wiki', 'dist');
  const types: Record<string, string> = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.json': 'application/json', '.svg': 'image/svg+xml' };
  return {
    name: 'godsworn-wiki',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const path = (req.url ?? '').split('?')[0]!;
        if (path === '/wiki') {
          res.statusCode = 302;
          res.setHeader('Location', '/wiki/');
          return void res.end();
        }
        if (!path.startsWith('/wiki/')) return next();
        let rel = decodeURIComponent(path.slice('/wiki/'.length));
        if (rel === '' || rel.endsWith('/')) rel += 'index.html';
        const file = normalize(join(wikiDist, rel));
        if (!file.startsWith(wikiDist + sep) || !existsSync(file) || !statSync(file).isFile()) {
          res.statusCode = 404;
          return void res.end(existsSync(wikiDist) ? 'not found' : 'The wiki is not built yet: run npm run wiki');
        }
        res.setHeader('Content-Type', types[extname(file)] ?? 'application/octet-stream');
        res.end(readFileSync(file));
      });
    },
    closeBundle() {
      if (!existsSync(wikiDist)) return void console.warn('wiki/dist is missing: the build has no /wiki/ (run npm run wiki)');
      cpSync(wikiDist, join(root, 'dist', 'wiki'), { recursive: true });
    },
  };
}

export default defineConfig({
  plugins: [saveToFolder(), wikiAtSlashWiki()],
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version),
  },
  test: {
    include: ['tests/**/*.test.ts'],
    environment: 'node',
  },
});
