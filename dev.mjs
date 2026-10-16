// Local preview server. Run `node dev.mjs` or `node dev.mjs --port=8174`.
import { createServer } from 'node:http';
import { createReadStream } from 'node:fs';
import { realpath, stat } from 'node:fs/promises';
import { dirname, extname, isAbsolute, relative, resolve, sep } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = dirname(fileURLToPath(import.meta.url));
const HOST = '127.0.0.1';
const MIME = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8', '.mjs': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8', '.map': 'application/json; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8', '.svg': 'image/svg+xml',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
  '.gif': 'image/gif', '.webp': 'image/webp', '.ico': 'image/x-icon',
  '.mp3': 'audio/mpeg', '.wav': 'audio/wav', '.ogg': 'audio/ogg', '.mp4': 'video/mp4',
  '.woff': 'font/woff', '.woff2': 'font/woff2', '.ttf': 'font/ttf', '.otf': 'font/otf',
  '.wasm': 'application/wasm', '.vert': 'text/plain; charset=utf-8', '.frag': 'text/plain; charset=utf-8',
};
const inside = (root, path) => {
  const tail = relative(root, path);
  return tail === '' || (!isAbsolute(tail) && tail !== '..' && !tail.startsWith('..' + sep));
};

export async function createPreviewServer(root = ROOT) {
  root = await realpath(root);
  // npm's file:../p5.brush dependency is a symlink outside this checkout.
  // Expose only its public dist mount; other escaping symlinks remain forbidden.
  const brushDist = await realpath(resolve(root, 'node_modules/p5.brush/dist')).catch(() => null);
  return createServer(async (request, response) => {
    const headers = { 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' };
    const end = (status, text, extra = {}) => {
      response.writeHead(status, { ...headers, 'Content-Type': 'text/plain; charset=utf-8', ...extra });
      response.end(request.method === 'HEAD' ? undefined : text);
    };
    if (request.method !== 'GET' && request.method !== 'HEAD') {
      end(405, 'Method not allowed\n', { Allow: 'GET, HEAD' }); return;
    }
    let url, pathname;
    try {
      url = new URL(request.url, `http://${HOST}`);
      pathname = decodeURIComponent(url.pathname);
      if (pathname.includes('\0') || pathname.includes('\\')) throw new Error('Invalid path');
    } catch { end(400, 'Invalid request path\n'); return; }
    if (pathname === '/') {
      const query = new URLSearchParams(url.search);
      if (!query.has('lang')) query.set('lang', 'zh');
      end(302, 'Open the preview\n', { Location: '/preview.html?' + query }); return;
    }
    if (pathname === '/favicon.ico') { response.writeHead(204, headers).end(); return; }
    if (pathname.split('/').some(part => part.startsWith('.'))) {
      end(403, 'Forbidden\n'); return;
    }
    const file = resolve(root, '.' + pathname);
    if (!inside(root, file)) { end(403, 'Forbidden\n'); return; }
    try {
      const physical = await realpath(file);
      const linkedBrushAsset = pathname.startsWith('/node_modules/p5.brush/dist/') &&
        brushDist && inside(brushDist, physical);
      if (!inside(root, physical) && !linkedBrushAsset) { end(403, 'Forbidden\n'); return; }
      const info = await stat(physical);
      if (!info.isFile()) { end(404, 'Not found\n'); return; }
      response.writeHead(200, { ...headers,
        'Content-Type': MIME[extname(physical).toLowerCase()] ?? 'application/octet-stream',
        'Content-Length': info.size });
      if (request.method === 'HEAD') { response.end(); return; }
      const stream = createReadStream(physical);
      stream.on('error', error => response.destroy(error));
      response.on('close', () => stream.destroy());
      stream.pipe(response);
    } catch (error) {
      if (error.code === 'ENOENT' || error.code === 'ENOTDIR') end(404, 'Not found\n');
      else if (error.code === 'EACCES' || error.code === 'EPERM') end(403, 'Forbidden\n');
      else { console.error(error); end(500, 'Could not read file\n'); }
    }
  });
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const argument = process.argv.slice(2).find(value => value.startsWith('--port='));
  const port = Number(argument ? argument.slice(7) : process.env.PORT ?? 8174);
  if (!Number.isInteger(port) || port < 0 || port > 65535) {
    console.error('PORT / --port must be an integer from 0 to 65535.'); process.exitCode = 1;
  } else {
    const server = await createPreviewServer();
    server.on('error', error => {
      console.error(error.code === 'EADDRINUSE' ? `Port ${port} is in use; choose --port=<number>.` : error.message);
      process.exitCode = 1;
    });
    server.listen(port, HOST, () => {
      console.log(`Seeky preview: http://${HOST}:${server.address().port}/preview.html?lang=zh`);
    });
    for (const signal of ['SIGINT', 'SIGTERM']) process.once(signal, () => server.close());
  }
}
