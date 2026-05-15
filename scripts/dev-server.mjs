import { createReadStream, existsSync, statSync } from 'node:fs';
import { createServer } from 'node:http';
import { extname, join, normalize, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const publicDir = resolve(root, process.env.SERVE_DIR ?? 'src');
const port = Number(process.env.PORT ?? 3000);

const mimeTypes = new Map([
  ['.html', 'text/html; charset=utf-8'],
  ['.css', 'text/css; charset=utf-8'],
  ['.js', 'text/javascript; charset=utf-8'],
  ['.json', 'application/json; charset=utf-8'],
  ['.svg', 'image/svg+xml']
]);

function safePath(urlPath) {
  const decoded = decodeURIComponent(urlPath.split('?')[0]);
  const normalized = normalize(decoded).replace(/^([/\\])+/, '');
  const requested = resolve(publicDir, normalized || 'index.html');
  if (!requested.startsWith(publicDir)) return null;
  if (existsSync(requested) && statSync(requested).isDirectory()) {
    return join(requested, 'index.html');
  }
  return requested;
}

createServer((request, response) => {
  const requestedPath = safePath(request.url ?? '/');
  const filePath = requestedPath && existsSync(requestedPath)
    ? requestedPath
    : resolve(publicDir, 'index.html');

  response.setHeader('Content-Type', mimeTypes.get(extname(filePath)) ?? 'application/octet-stream');
  createReadStream(filePath)
    .on('error', () => {
      response.writeHead(404);
      response.end('Not found');
    })
    .pipe(response);
}).listen(port, () => {
  console.log(`Last Train Home running at http://localhost:${port}`);
});
