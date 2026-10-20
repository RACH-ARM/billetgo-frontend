import QRCode from 'qrcode';
import { blobToBase64 } from './ticketCanvas';

// Port frontend du vrai style de QR de la plateforme — voir
// billetgab-backend/src/lib/qrGradient.ts (source de vérité pour les billets
// réels). Même dégradé de marque, même grille de modules, même logo centré.
// Le logo utilise directement /favicon.png (asset public, légère marge
// blanche en plus autour du "B" vs. le recadrage sharp côté serveur — sans
// impact visuel notable à cette taille) mais inliné en base64 dans le SVG :
// un <image href="/favicon.png"> relatif ne se résout pas une fois le SVG
// encodé en data: URI (pas d'URL de base à cette étape), donc le logo
// restait invisible (case blanche vide) sans cet inlining.
const QR_GRADIENT_TOP = '#7B2FBE';    // violet-neon
const QR_GRADIENT_BOTTOM = '#00E5FF'; // cyan-neon
const QR_QUIET_MODULES = 2;
const LOGO_FILL_RATIO = 0.92;
const LOGO_SRC = '/favicon.png';

let logoDataUrlPromise: Promise<string> | null = null;
function getLogoDataUrl(): Promise<string> {
  if (!logoDataUrlPromise) {
    logoDataUrlPromise = fetch(LOGO_SRC)
      .then((res) => res.blob())
      .then((blob) => blobToBase64(blob));
  }
  return logoDataUrlPromise;
}

export async function buildGradientQRDataUrl(qrPayload: string, targetPixelSize: number): Promise<string> {
  const qr = QRCode.create(qrPayload, { errorCorrectionLevel: 'H' });
  const size = qr.modules.size;
  const data = qr.modules.data;

  const totalModules = size + QR_QUIET_MODULES * 2;
  const moduleSize = Math.max(1, Math.round(targetPixelSize / totalModules));
  const actualSize = moduleSize * totalModules;

  const excludeRatio = 0.26;
  const excludeCount = Math.round(size * excludeRatio);
  const excludeStart = Math.floor((size - excludeCount) / 2);
  const excludeEnd = excludeStart + excludeCount;

  let rects = '';
  for (let row = 0; row < size; row++) {
    for (let col = 0; col < size; col++) {
      const isDark = data[row * size + col] === 1;
      const inExcludedZone = row >= excludeStart && row < excludeEnd && col >= excludeStart && col < excludeEnd;
      if (!isDark || inExcludedZone) continue;
      const x = (col + QR_QUIET_MODULES) * moduleSize;
      const y = (row + QR_QUIET_MODULES) * moduleSize;
      rects += `<rect x="${x}" y="${y}" width="${moduleSize}" height="${moduleSize}" fill="url(#qrGrad)"/>`;
    }
  }

  const logoPixels = Math.round(excludeCount * moduleSize * LOGO_FILL_RATIO);
  const logoOffset = Math.round((actualSize - logoPixels) / 2);
  const logoDataUrl = await getLogoDataUrl();

  const svg = `<svg width="${actualSize}" height="${actualSize}" viewBox="0 0 ${actualSize} ${actualSize}" shape-rendering="crispEdges" xmlns="http://www.w3.org/2000/svg">` +
    `<defs><linearGradient id="qrGrad" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="0" y2="${actualSize}">` +
    `<stop offset="0%" stop-color="${QR_GRADIENT_TOP}"/>` +
    `<stop offset="100%" stop-color="${QR_GRADIENT_BOTTOM}"/>` +
    `</linearGradient></defs>` +
    `<rect width="${actualSize}" height="${actualSize}" fill="#FFFFFF"/>` +
    rects +
    `<image href="${logoDataUrl}" x="${logoOffset}" y="${logoOffset}" width="${logoPixels}" height="${logoPixels}"/>` +
    `</svg>`;

  return `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svg)))}`;
}
