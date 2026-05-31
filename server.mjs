import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { existsSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const HOST = process.env.HOST || '127.0.0.1';
const PORT = Number(process.env.PORT || '3000');

const site = {
  title: 'LinsaFTW',
  description: 'Juan Cruz Linsalata, known as LinsaFTW. Minecraft infrastructure developer from Argentina, founder of ArkFlame Studios, creator of FlameCord, ExploitFixer, VeloFlame and related server security tools.'
};

const mime = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.webmanifest': 'application/manifest+json; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
  '.webp': 'image/webp'
};

function notFound(res) {
  res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
  res.end('Not found');
}

function parsePage(raw) {
  if (!raw.startsWith('---')) return { meta: {}, content: raw };
  const end = raw.indexOf('\n---', 3);
  if (end === -1) return { meta: {}, content: raw };
  const fm = raw.slice(3, end).trim();
  const content = raw.slice(end + 4).trimStart();
  const meta = {};
  for (const line of fm.split('\n')) {
    const index = line.indexOf(':');
    if (index === -1) continue;
    const key = line.slice(0, index).trim();
    let value = line.slice(index + 1).trim();
    value = value.replace(/^['"]|['"]$/g, '');
    meta[key] = value;
  }
  return { meta, content };
}

async function renderPage(filePath) {
  const raw = await readFile(filePath, 'utf8');
  const { meta, content } = parsePage(raw);
  const layoutRaw = await readFile(path.join(__dirname, '_layouts', 'default.html'), 'utf8');
  const header = await readFile(path.join(__dirname, '_includes', 'header.html'), 'utf8');
  const footer = await readFile(path.join(__dirname, '_includes', 'footer.html'), 'utf8');
  const pageTitle = meta.title || site.title;
  const description = meta.description || site.description;
  const pageUrl = meta.url || '/' + path.relative(__dirname, filePath).replaceAll(path.sep, '/');
  const pageId = meta.page_id || '';
  const ogType = meta.og_type || 'website';
  const year = String(new Date().getFullYear());

  return layoutRaw
    .replaceAll('{% include header.html %}', header)
    .replaceAll('{% include footer.html %}', footer)
    .replaceAll('{{ content }}', content)
    .replaceAll('{{ page.title | default: site.title }}', pageTitle)
    .replaceAll('{{ page.description | default: site.description }}', description)
    .replaceAll("{{ page.og_type | default: 'website' }}", ogType)
    .replaceAll("{{ page.page_id | default: '' }}", pageId)
    .replaceAll('{{ page.url }}', pageUrl)
    .replaceAll('{{ site.title }}', site.title)
    .replaceAll('{{ site.description }}', site.description)
    .replaceAll('{{ \'now\' | date: "%Y" }}', year)
    .replaceAll("{{ 'now' | date: \"%Y\" }}", year);
}

async function serveFile(res, filePath) {
  const data = await readFile(filePath);
  const ext = path.extname(filePath).toLowerCase();
  res.writeHead(200, { 'Content-Type': mime[ext] || 'application/octet-stream' });
  res.end(data);
}

createServer(async (req, res) => {
  try {
    const url = new URL(req.url || '/', `http://${HOST}:${PORT}`);
    let pathname = decodeURIComponent(url.pathname);
    if (pathname === '/') pathname = '/index.html';

    const safePath = path.normalize(path.join(__dirname, pathname));
    if (!safePath.startsWith(__dirname)) return notFound(res);

    if (!existsSync(safePath) || !statSync(safePath).isFile()) return notFound(res);

    if (safePath.endsWith('.html')) {
      const html = await renderPage(safePath);
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(html);
      return;
    }

    await serveFile(res, safePath);
  } catch (error) {
    res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end(error instanceof Error ? error.stack : String(error));
  }
}).listen(PORT, HOST, () => {
  console.log(`Local preview: http://${HOST}:${PORT}/`);
});
