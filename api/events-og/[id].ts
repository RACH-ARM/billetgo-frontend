import { readFileSync } from 'fs';
import { join } from 'path';
import type { IncomingMessage, ServerResponse } from 'http';

const BOT_UA = /facebookexternalhit|twitterbot|whatsapp|linkedinbot|slackbot|discordbot|telegrambot|bingbot|googlebot|applebot|pinterestbot|vkshare|xing-contenttabreceiver/i;

function esc(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function serveIndexHtml(res: ServerResponse): void {
  try {
    const html = readFileSync(join(process.cwd(), 'dist', 'index.html'), 'utf-8');
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.end(html);
  } catch {
    res.setHeader('Location', '/');
    res.statusCode = 302;
    res.end();
  }
}

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  const url = new URL(req.url ?? '/', 'https://billetgab.com');
  const parts = url.pathname.split('/').filter(Boolean);
  const id = parts[parts.length - 1];

  const ua = (req.headers['user-agent'] ?? '');

  if (!BOT_UA.test(ua)) {
    return serveIndexHtml(res);
  }

  try {
    const resp = await fetch(`https://api.billetgab.com/api/v1/events/${id}`);
    if (!resp.ok) {
      return serveIndexHtml(res);
    }
    const json = await resp.json() as { data?: Record<string, unknown> };
    const event = json.data ?? {};

    const title = esc(String(event.title ?? 'BilletGab'));
    const raw = String(event.description ?? 'Réservez vos billets sur BilletGab');
    const description = esc(raw.slice(0, 200));
    const image = String(event.coverImageUrl ?? 'https://billetgab.com/og-default.jpg');
    const pageUrl = `https://billetgab.com/events/${id}`;

    const html = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8" />
  <title>${title} — BilletGab</title>
  <meta name="description" content="${description}" />

  <meta property="og:type" content="website" />
  <meta property="og:site_name" content="BilletGab" />
  <meta property="og:url" content="${pageUrl}" />
  <meta property="og:title" content="${title}" />
  <meta property="og:description" content="${description}" />
  <meta property="og:image" content="${image}" />
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="630" />

  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${title}" />
  <meta name="twitter:description" content="${description}" />
  <meta name="twitter:image" content="${image}" />
</head>
<body>
  <a href="${pageUrl}">${title} — BilletGab</a>
</body>
</html>`;

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.end(html);
  } catch {
    return serveIndexHtml(res);
  }
}
