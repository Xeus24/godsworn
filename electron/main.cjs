// Godsworn desktop shell (macOS). Serves the built game from dist/ on a fixed
// loopback port so the page origin (and so localStorage) is stable across
// launches, and mirrors autosaves to ~/Library/Application Support/Godsworn/saves
// exactly as the Vite dev server mirrors them into ./saves.
const { app, BrowserWindow, Menu, shell } = require('electron');
const fs = require('node:fs');
const http = require('node:http');
const path = require('node:path');

const PORT = 47321;
const DIST = path.join(__dirname, '..', 'dist');
const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.webp': 'image/webp',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.mp3': 'audio/mpeg',
  '.ogg': 'audio/ogg',
  '.wav': 'audio/wav',
  '.ico': 'image/x-icon',
};

function startServer(saveDir) {
  const server = http.createServer((req, res) => {
    const url = new URL(req.url, `http://127.0.0.1:${PORT}`);
    if (req.method === 'POST' && url.pathname === '/__godsworn/save') {
      const name = url.searchParams.get('name') ?? '';
      if (!/^[a-z0-9_-]{1,40}$/i.test(name)) {
        res.statusCode = 400;
        return void res.end('bad name');
      }
      const chunks = [];
      let size = 0;
      req.on('data', (c) => {
        size += c.length;
        if (size > 50 * 1024 * 1024) req.destroy();
        else chunks.push(c);
      });
      req.on('end', () => {
        try {
          fs.mkdirSync(saveDir, { recursive: true });
          const file = path.join(saveDir, `${name}.json`);
          fs.writeFileSync(`${file}.tmp`, Buffer.concat(chunks));
          fs.renameSync(`${file}.tmp`, file);
          res.statusCode = 204;
        } catch {
          res.statusCode = 500;
        }
        res.end();
      });
      return;
    }
    if (req.method !== 'GET' && req.method !== 'HEAD') {
      res.statusCode = 405;
      return void res.end();
    }
    let rel = decodeURIComponent(url.pathname);
    if (rel.endsWith('/')) rel += 'index.html';
    const file = path.normalize(path.join(DIST, rel));
    if (!file.startsWith(DIST + path.sep)) {
      res.statusCode = 403;
      return void res.end();
    }
    fs.readFile(file, (err, data) => {
      if (err) {
        res.statusCode = 404;
        return void res.end('not found');
      }
      res.setHeader('Content-Type', MIME[path.extname(file)] ?? 'application/octet-stream');
      res.end(data);
    });
  });
  return new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(PORT, '127.0.0.1', () => resolve(server));
  });
}

function createWindow() {
  const win = new BrowserWindow({
    width: 1440,
    height: 920,
    minWidth: 960,
    minHeight: 640,
    backgroundColor: '#0b0b10',
    title: 'Godsworn',
    webPreferences: { contextIsolation: true, sandbox: true },
  });
  win.webContents.setWindowOpenHandler(({ url }) => {
    void shell.openExternal(url);
    return { action: 'deny' };
  });
  void win.loadURL(`http://127.0.0.1:${PORT}/`);
}

app.setName('Godsworn');
app.whenReady().then(async () => {
  try {
    await startServer(path.join(app.getPath('userData'), 'saves'));
  } catch (err) {
    // Port taken: most likely a second copy of the app is already running.
    console.error('Could not start the local game server:', err);
    app.quit();
    return;
  }
  Menu.setApplicationMenu(
    Menu.buildFromTemplate([
      { role: 'appMenu' },
      { role: 'editMenu' },
      { role: 'viewMenu' },
      { role: 'windowMenu' },
    ]),
  );
  createWindow();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});
app.on('window-all-closed', () => app.quit());
