import { createServer, request as httpRequest } from 'node:http';
import { createReadStream, existsSync, statSync } from 'node:fs';
import { extname, join, normalize, resolve, sep } from 'node:path';

const host = '127.0.0.1';
const port = 4300;
const apiTargetHost = '127.0.0.1';
const apiTargetPort = 3000;
const distRoot = resolve('dist/erp-shell/browser');

const mimeTypes = new Map([
  ['.css', 'text/css; charset=utf-8'],
  ['.html', 'text/html; charset=utf-8'],
  ['.js', 'text/javascript; charset=utf-8'],
  ['.json', 'application/json; charset=utf-8'],
  ['.svg', 'image/svg+xml'],
  ['.ico', 'image/x-icon'],
  ['.png', 'image/png'],
  ['.jpg', 'image/jpeg'],
  ['.jpeg', 'image/jpeg'],
  ['.webp', 'image/webp'],
  ['.woff', 'font/woff'],
  ['.woff2', 'font/woff2'],
]);

function sendNotFound(response) {
  response.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' });
  response.end('Not found');
}

function serveFile(filePath, response) {
  if (!existsSync(filePath) || !statSync(filePath).isFile()) {
    sendNotFound(response);
    return;
  }

  response.writeHead(200, {
    'content-type': mimeTypes.get(extname(filePath)) ?? 'application/octet-stream',
  });
  createReadStream(filePath).pipe(response);
}

function resolveStaticPath(requestPath) {
  const normalizedPath = normalize(decodeURIComponent(requestPath.split('?')[0] ?? '/'));
  const relativePath = normalizedPath === sep ? 'index.html' : normalizedPath.replace(/^[/\\]+/, '');
  const candidatePath = resolve(join(distRoot, relativePath));

  if (!candidatePath.startsWith(distRoot)) {
    return null;
  }

  if (existsSync(candidatePath) && statSync(candidatePath).isFile()) {
    return candidatePath;
  }

  return join(distRoot, 'index.html');
}

function proxyApi(request, response) {
  const targetPath = request.url?.replace(/^\/api/, '') || '/';
  const proxyRequest = httpRequest(
    {
      hostname: apiTargetHost,
      port: apiTargetPort,
      path: targetPath,
      method: request.method,
      headers: {
        ...request.headers,
        host: `${apiTargetHost}:${apiTargetPort}`,
      },
    },
    (proxyResponse) => {
      response.writeHead(proxyResponse.statusCode ?? 502, proxyResponse.headers);
      proxyResponse.pipe(response);
    },
  );

  proxyRequest.on('error', () => {
    response.writeHead(502, { 'content-type': 'application/json; charset=utf-8' });
    response.end(JSON.stringify({ message: 'PostgREST proxy target is unavailable.' }));
  });

  request.pipe(proxyRequest);
}

const server = createServer((request, response) => {
  if (request.url?.startsWith('/api')) {
    proxyApi(request, response);
    return;
  }

  const filePath = resolveStaticPath(request.url ?? '/');
  if (!filePath) {
    sendNotFound(response);
    return;
  }

  serveFile(filePath, response);
});

server.listen(port, host);
