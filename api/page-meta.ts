import { readFileSync } from 'fs';
import { join } from 'path';
import type { IncomingMessage, ServerResponse } from 'http';

// Même détection que api/events-og/[id].ts — robots sociaux + moteurs de
// recherche qui ne rendent pas forcément le JS avant de lire les balises.
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

// Contenu en miroir des balises <Helmet> de chaque page (voir le composant
// React correspondant) — à garder synchronisé si le titre/la description
// change côté page.
const PAGES: Record<string, { title: string; description: string; ogTitle: string; ogDescription: string; path: string }> = {
  home: {
    title: 'BilletGab — Inscriptions & billets en ligne au Gabon',
    description: "Achetez vos billets et inscrivez-vous aux meilleurs événements au Gabon : concerts, formations, conférences, ateliers, camps, sport et plus. Paiement sécurisé par Airtel Money et Moov Money.",
    ogTitle: 'BilletGab — Inscriptions & billets en ligne au Gabon',
    ogDescription: 'Achetez vos billets et inscrivez-vous aux meilleurs événements au Gabon. Paiement sécurisé par Airtel Money et Moov Money.',
    path: '/',
  },
  evenements: {
    title: 'Événements au Gabon — Billets en ligne | BilletGab',
    description: 'Découvrez tous les événements à Libreville et au Gabon : concerts, clubs, festivals, sport, théâtre. Achetez vos billets en ligne par Airtel Money ou Moov Money.',
    ogTitle: 'Événements au Gabon — BilletGab',
    ogDescription: 'Concerts, festivals, clubs, sport au Gabon. Billets en ligne, paiement Mobile Money.',
    path: '/evenements',
  },
  organisateurs: {
    title: 'Organisateurs — Créez et gérez vos événements au Gabon | BilletGab',
    description: 'Vendez vos billets en ligne au Gabon en quelques minutes. Tableau de bord, QR codes, paiement Airtel Money & Moov Money. Inscription gratuite.',
    ogTitle: 'Organisateurs — BilletGab',
    ogDescription: 'Vendez vos billets en ligne au Gabon. Paiement Mobile Money, QR codes, dashboard temps réel.',
    path: '/organisateurs',
  },
  'a-propos': {
    title: 'À propos — BilletGab, la billetterie événementielle du Gabon',
    description: "BilletGab est la billetterie pensée pour le Gabon. Notre mission : rendre l'accès aux événements simple, sécurisé et local.",
    ogTitle: 'À propos — BilletGab',
    ogDescription: 'La billetterie événementielle pensée pour le Gabon. Simple, sécurisée, locale.',
    path: '/a-propos',
  },
  contact: {
    title: 'Contact — BilletGab',
    description: 'Contactez BilletGab via WhatsApp, Instagram, TikTok ou Facebook. Support disponible du lundi au samedi de 08h à 20h (WAT).',
    ogTitle: 'Contact — BilletGab',
    ogDescription: 'Contactez BilletGab via WhatsApp, Instagram, TikTok ou Facebook.',
    path: '/contact',
  },
  'comment-ca-marche': {
    title: 'Comment ça marche — Acheter un billet sur BilletGab',
    description: 'Achetez un billet sur BilletGab en 3 étapes simples : choisissez votre événement, payez par Airtel Money ou Moov Money, recevez votre QR code.',
    ogTitle: 'Comment ça marche — BilletGab',
    ogDescription: 'Achetez un billet en 3 étapes : choisissez, payez par Mobile Money, recevez votre QR code.',
    path: '/comment-ca-marche',
  },
};

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  const url = new URL(req.url ?? '/', 'https://billetgab.com');
  const key = url.searchParams.get('page') ?? 'home';
  const ua = req.headers['user-agent'] ?? '';

  if (!BOT_UA.test(ua)) {
    return serveIndexHtml(res);
  }

  const page = PAGES[key] ?? PAGES.home;
  const pageUrl = `https://billetgab.com${page.path}`;
  const title = esc(page.title);
  const description = esc(page.description);
  const ogTitle = esc(page.ogTitle);
  const ogDescription = esc(page.ogDescription);

  const html = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8" />
  <title>${title}</title>
  <meta name="description" content="${description}" />
  <link rel="canonical" href="${pageUrl}" />

  <meta property="og:type" content="website" />
  <meta property="og:site_name" content="BilletGab" />
  <meta property="og:url" content="${pageUrl}" />
  <meta property="og:title" content="${ogTitle}" />
  <meta property="og:description" content="${ogDescription}" />
  <meta property="og:image" content="https://billetgab.com/og-default.jpg" />
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="630" />

  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${ogTitle}" />
  <meta name="twitter:description" content="${ogDescription}" />
  <meta name="twitter:image" content="https://billetgab.com/og-default.jpg" />
</head>
<body>
  <h1>${title}</h1>
  <p>${description}</p>
  <a href="${pageUrl}">Voir sur BilletGab</a>
</body>
</html>`;

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.end(html);
}
