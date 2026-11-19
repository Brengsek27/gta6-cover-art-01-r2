import { createServer } from 'node:http';
import { createReadStream, statSync } from 'node:fs';
import { resolve, extname, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('./app', import.meta.url));
const port = Number(process.env.PORT || process.argv[process.argv.indexOf('--port') + 1]) || 8080;
const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.jpg': 'image/jpeg', '.png': 'image/png', '.json': 'application/json', '.svg': 'image/svg+xml' };
createServer((request, response) => {
  try {
    const pathname = decodeURIComponent(new URL(request.url || '/', 'http://localhost').pathname);
    const file = resolve(root, '.' + (pathname.endsWith('/') ? pathname + 'index.html' : pathname));
    if (!file.startsWith(resolve(root) + sep)) { response.writeHead(403).end(); return; }
    const stat = statSync(file);
    if (!stat.isFile()) { response.writeHead(404).end(); return; }
    response.writeHead(200, { 'content-type': types[extname(file)] || 'application/octet-stream', 'cache-control': 'no-store' });
    createReadStream(file).pipe(response);
  } catch { response.writeHead(404).end('Not found'); }
}).listen(port, '127.0.0.1', () => console.log(`Vice Heat Studio: http://127.0.0.1:${port}`));
