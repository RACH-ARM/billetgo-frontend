/**
 * Génère og-default.jpg à partir du SVG via Puppeteer (déjà installé dans le backend).
 * Usage : node scripts/generate-og-image.mjs
 */
import { readFileSync, writeFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const publicDir = resolve(__dirname, '../public');

// Essaie d'importer puppeteer depuis le backend voisin
let puppeteer;
try {
  puppeteer = (await import('../../billetgab-backend/node_modules/puppeteer/lib/esm/puppeteer/puppeteer.js')).default;
} catch {
  try {
    puppeteer = (await import('puppeteer')).default;
  } catch {
    console.error('Puppeteer introuvable. Lance : cd ../billetgab-backend && npm install');
    process.exit(1);
  }
}

const svgContent = readFileSync(resolve(publicDir, 'og-default.svg'), 'utf8');
const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><style>*{margin:0;padding:0;box-sizing:border-box;}body{width:1200px;height:630px;overflow:hidden;}</style></head><body>${svgContent}</body></html>`;

console.log('Lancement de Puppeteer...');
const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
const page = await browser.newPage();
await page.setViewport({ width: 1200, height: 630, deviceScaleFactor: 1 });
await page.setContent(html, { waitUntil: 'networkidle0' });

const screenshot = await page.screenshot({ type: 'jpeg', quality: 92, clip: { x: 0, y: 0, width: 1200, height: 630 } });
writeFileSync(resolve(publicDir, 'og-default.jpg'), screenshot);

await browser.close();
console.log('✓ og-default.jpg généré dans public/');
