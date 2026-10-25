import { mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { join } from 'node:path';
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

export default defineConfig({
  plugins: [saveToFolder()],
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version),
  },
  test: {
    include: ['tests/**/*.test.ts'],
    environment: 'node',
  },
});
