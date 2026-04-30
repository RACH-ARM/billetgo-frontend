// ─── Helpers ──────────────────────────────────────────────────────────────────

export function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

export function loadImage(src: string, crossOrigin = false): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    if (crossOrigin) img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

function drawSparkle(ctx: CanvasRenderingContext2D, x: number, y: number, size: number, color: string, alpha: number) {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(x, y - size);
  ctx.lineTo(x + size * 0.18, y - size * 0.18);
  ctx.lineTo(x + size, y);
  ctx.lineTo(x + size * 0.18, y + size * 0.18);
  ctx.lineTo(x, y + size);
  ctx.lineTo(x - size * 0.18, y + size * 0.18);
  ctx.lineTo(x - size, y);
  ctx.lineTo(x - size * 0.18, y - size * 0.18);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function drawDot(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, color: string, alpha: number) {
  ctx.save();
  ctx.globalAlpha = alpha;
  const g = ctx.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, color);
  g.addColorStop(1, 'transparent');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawCornerMark(ctx: CanvasRenderingContext2D, x: number, y: number, size: number, dir: [number, number], color: string) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = 2.5;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(x + dir[0] * size, y);
  ctx.lineTo(x, y);
  ctx.lineTo(x, y + dir[1] * size);
  ctx.stroke();
  ctx.restore();
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

// ─── Interface ────────────────────────────────────────────────────────────────

export interface TicketCanvasOpts {
  ticketId: string;
  eventTitle?: string;
  categoryName?: string;
  eventDate?: string;
  venueName?: string;
  coverImageUrl?: string;
  buyerName?: string;
  buyerEmail?: string;
  price?: number;
}

// ─── Main generator — format billet horizontal haute définition ───────────────

export async function generateTicketCanvas(
  canvas: HTMLCanvasElement,
  qrDataUrl: string,
  opts: TicketCanvasOpts
) {
  const { ticketId, eventTitle, categoryName, eventDate, venueName, coverImageUrl, buyerName, buyerEmail, price } = opts;

  // Coordonnées logiques (inchangées) — sortie 2× haute résolution
  const W = 900;
  const H = 380;
  const SCALE = 2; // → 1800×760 pixels en sortie
  const PERF_X = 652;
  const STUB_CX = PERF_X + (W - PERF_X) / 2;
  const PAD = 24;
  const MAIN_MAX_W = PERF_X - PAD * 2;

  canvas.width  = W * SCALE;
  canvas.height = H * SCALE;
  const ctx = canvas.getContext('2d')!;
  ctx.scale(SCALE, SCALE);

  // ── 1. Fond principal ──────────────────────────────────────────────────────
  const bgGrad = ctx.createLinearGradient(0, 0, W * 0.7, H);
  bgGrad.addColorStop(0,   '#0f0520');
  bgGrad.addColorStop(0.5, '#0D0D1A');
  bgGrad.addColorStop(1,   '#050d1a');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, W, H);

  // ── 2. Image de couverture (gauche, clippée) ───────────────────────────────
  ctx.save();
  ctx.beginPath();
  ctx.rect(0, 0, PERF_X, H);
  ctx.clip();

  if (coverImageUrl) {
    try {
      const cover = await loadImage(coverImageUrl, true);
      const s = Math.max(PERF_X / cover.width, H / cover.height);
      ctx.drawImage(cover, (PERF_X - cover.width * s) / 2, (H - cover.height * s) / 2, cover.width * s, cover.height * s);
    } catch {
      const fb = ctx.createLinearGradient(0, 0, PERF_X, H);
      fb.addColorStop(0, '#2D1060'); fb.addColorStop(1, '#003060');
      ctx.fillStyle = fb; ctx.fillRect(0, 0, PERF_X, H);
    }
  } else {
    const fb = ctx.createLinearGradient(0, 0, PERF_X, H);
    fb.addColorStop(0, '#2D1060'); fb.addColorStop(1, '#003060');
    ctx.fillStyle = fb; ctx.fillRect(0, 0, PERF_X, H);
  }

  // Overlay lisibilité horizontal
  const ov = ctx.createLinearGradient(0, 0, PERF_X, 0);
  ov.addColorStop(0,    'rgba(13,13,26,0.93)');
  ov.addColorStop(0.38, 'rgba(13,13,26,0.50)');
  ov.addColorStop(0.78, 'rgba(15,5,32,0.72)');
  ov.addColorStop(1,    'rgba(15,5,32,0.98)');
  ctx.fillStyle = ov; ctx.fillRect(0, 0, PERF_X, H);

  // Overlay sombre bas (zone acheteur)
  const ovB = ctx.createLinearGradient(0, H * 0.52, 0, H);
  ovB.addColorStop(0, 'rgba(13,13,26,0)');
  ovB.addColorStop(1, 'rgba(13,13,26,0.80)');
  ctx.fillStyle = ovB; ctx.fillRect(0, 0, PERF_X, H);

  ctx.restore();

  // ── 3. Watermark ──────────────────────────────────────────────────────────
  ctx.save();
  ctx.translate(W * 0.33, H / 2);
  ctx.rotate(-Math.PI / 7);
  ctx.globalAlpha = 0.028;
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 15px Arial, sans-serif';
  ctx.textAlign = 'center';
  for (let r = -5; r <= 5; r++) for (let c = -4; c <= 4; c++) ctx.fillText('BILLETGAB', c * 148, r * 54);
  ctx.restore();

  // ── 4. Orbes ──────────────────────────────────────────────────────────────
  drawDot(ctx, 0, 0,          220, '#7B2FBE', 0.18);
  drawDot(ctx, PERF_X * 0.6, H,   160, '#E040FB', 0.11);
  drawDot(ctx, 55, H / 2,    100, '#7B2FBE', 0.09);
  drawDot(ctx, PERF_X - 38,  28,   90, '#00E5FF', 0.07);

  // ── 5. Marque BilletGab ────────────────────────────────────────────────────
  ctx.save();
  ctx.shadowColor = 'rgba(0,0,0,0.9)'; ctx.shadowBlur = 6;
  ctx.fillStyle = 'rgba(192,132,252,0.75)';
  ctx.font = 'bold 10px Arial, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('✦  BILLETGAB', PAD, 22);
  ctx.restore();

  // ── 6. Titre événement ────────────────────────────────────────────────────
  const title = (eventTitle || 'MON BILLET').toUpperCase();
  let fz = 34;
  ctx.font = `bold ${fz}px Arial, sans-serif`;
  while (ctx.measureText(title).width > MAIN_MAX_W && fz > 18) { fz -= 2; ctx.font = `bold ${fz}px Arial, sans-serif`; }
  ctx.save();
  ctx.shadowColor = 'rgba(0,0,0,1)'; ctx.shadowBlur = 24;
  ctx.fillStyle = '#ffffff'; ctx.textAlign = 'left';
  ctx.fillText(title, PAD, 68);
  ctx.restore();

  // ── 7. Badge catégorie ────────────────────────────────────────────────────
  let infoY = 88;
  if (categoryName) {
    const cat = categoryName.toUpperCase();
    ctx.font = 'bold 11px Arial, sans-serif';
    const catW = Math.min(ctx.measureText(cat).width + 28, MAIN_MAX_W);
    ctx.save();
    ctx.shadowColor = '#7B2FBE'; ctx.shadowBlur = 12;
    ctx.fillStyle = 'rgba(123,47,190,0.42)';
    roundRect(ctx, PAD, infoY, catW, 24, 12); ctx.fill();
    ctx.strokeStyle = 'rgba(192,132,252,0.72)'; ctx.lineWidth = 1;
    roundRect(ctx, PAD, infoY, catW, 24, 12); ctx.stroke();
    ctx.shadowBlur = 0; ctx.fillStyle = '#C084FC'; ctx.textAlign = 'left';
    ctx.fillText(cat, PAD + 14, infoY + 16);
    ctx.restore();
    infoY += 40;
  }

  // ── 8. Date ───────────────────────────────────────────────────────────────
  if (eventDate) {
    const d = new Date(eventDate);
    const ds = d.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
    const ts = d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    ctx.save();
    ctx.shadowColor = 'rgba(0,0,0,0.95)'; ctx.shadowBlur = 10;
    ctx.fillStyle = 'rgba(0,229,255,0.58)'; ctx.font = '9px Arial, sans-serif'; ctx.textAlign = 'left';
    ctx.fillText('DATE & HEURE', PAD, infoY);
    ctx.fillStyle = '#ffffff'; ctx.font = `bold 13px Arial, sans-serif`;
    ctx.fillText(`${ds}  ·  ${ts}`, PAD, infoY + 16);
    ctx.restore();
    infoY += 36;
  }

  // ── 9. Lieu ───────────────────────────────────────────────────────────────
  if (venueName) {
    ctx.save();
    ctx.shadowColor = 'rgba(0,0,0,0.95)'; ctx.shadowBlur = 10;
    ctx.fillStyle = 'rgba(224,64,251,0.58)'; ctx.font = '9px Arial, sans-serif'; ctx.textAlign = 'left';
    ctx.fillText('LIEU', PAD, infoY);
    let vt = venueName;
    ctx.font = 'bold 13px Arial, sans-serif';
    while (ctx.measureText(vt).width > MAIN_MAX_W && vt.length > 10) vt = vt.slice(0, -3) + '…';
    ctx.fillStyle = '#ffffff';
    ctx.fillText(vt, PAD, infoY + 16);
    ctx.restore();
    infoY += 36;
  }

  // ── 10. Bloc acheteur ─────────────────────────────────────────────────────
  const hasBuyer = buyerName || buyerEmail || price !== undefined;
  if (hasBuyer) {
    const BH = 52, BY = H - BH - 16;
    ctx.save();
    ctx.fillStyle = 'rgba(255,255,255,0.05)';
    roundRect(ctx, PAD - 4, BY, PERF_X - PAD * 2 + 8, BH, 10); ctx.fill();
    const acc = ctx.createLinearGradient(PAD, BY, PERF_X - PAD, BY);
    acc.addColorStop(0, 'rgba(123,47,190,0.68)');
    acc.addColorStop(1, 'rgba(224,64,251,0.68)');
    ctx.strokeStyle = acc; ctx.lineWidth = 1;
    roundRect(ctx, PAD - 4, BY, PERF_X - PAD * 2 + 8, BH, 10); ctx.stroke();

    ctx.shadowColor = 'rgba(0,0,0,0.85)'; ctx.shadowBlur = 7;
    ctx.fillStyle = 'rgba(192,132,252,0.62)'; ctx.font = '8px Arial, sans-serif'; ctx.textAlign = 'left';
    ctx.fillText('TITULAIRE', PAD + 4, BY + 12);
    ctx.fillStyle = '#ffffff'; ctx.font = 'bold 14px Arial, sans-serif';
    ctx.fillText(buyerName || 'Acheteur', PAD + 4, BY + 28);
    if (buyerEmail) {
      ctx.fillStyle = 'rgba(255,255,255,0.40)'; ctx.font = '10px Arial, sans-serif';
      ctx.fillText(buyerEmail, PAD + 4, BY + 44);
    }
    if (price !== undefined) {
      ctx.fillStyle = '#00E5FF'; ctx.font = 'bold 14px Arial, sans-serif'; ctx.textAlign = 'right';
      ctx.fillText(new Intl.NumberFormat('fr-FR').format(price) + ' FCFA', PERF_X - PAD, BY + 28);
    }
    ctx.restore();
  }

  // ── 11. Fond souche droite ────────────────────────────────────────────────
  const stubBg = ctx.createLinearGradient(PERF_X + 1, 0, W, H);
  stubBg.addColorStop(0, 'rgba(16,5,38,0.62)');
  stubBg.addColorStop(1, 'rgba(4,9,18,0.62)');
  ctx.fillStyle = stubBg;
  ctx.fillRect(PERF_X + 1, 0, W - PERF_X - 1, H);

  // ── 12. Orbe souche + QR ──────────────────────────────────────────────────
  drawDot(ctx, STUB_CX, H / 2, 130, '#7B2FBE', 0.14);

  const qrSz = 162, qrPad = 11;
  const qrW = qrSz + qrPad * 2, qrH = qrSz + qrPad * 2;
  const qrX = STUB_CX - qrW / 2, qrY = H / 2 - qrH / 2 - 16;

  // Halo blanc QR
  ctx.save();
  ctx.shadowColor = 'rgba(123,47,190,0.68)'; ctx.shadowBlur = 34;
  ctx.fillStyle = '#ffffff';
  roundRect(ctx, qrX, qrY, qrW, qrH, 12); ctx.fill();
  ctx.restore();

  // Bordure dégradée QR
  ctx.save();
  const qrBG = ctx.createLinearGradient(qrX, qrY, qrX + qrW, qrY + qrH);
  qrBG.addColorStop(0,   'rgba(123,47,190,0.85)');
  qrBG.addColorStop(0.5, 'rgba(224,64,251,0.65)');
  qrBG.addColorStop(1,   'rgba(0,229,255,0.65)');
  ctx.strokeStyle = qrBG; ctx.lineWidth = 2;
  roundRect(ctx, qrX, qrY, qrW, qrH, 12); ctx.stroke();
  ctx.restore();

  // Marques de coin
  const cm = 12, co = -6, cc = 'rgba(123,47,190,0.92)';
  drawCornerMark(ctx, qrX + co,       qrY + co,       cm, [ 1,  1], cc);
  drawCornerMark(ctx, qrX + qrW - co, qrY + co,       cm, [-1,  1], cc);
  drawCornerMark(ctx, qrX + co,       qrY + qrH - co, cm, [ 1, -1], cc);
  drawCornerMark(ctx, qrX + qrW - co, qrY + qrH - co, cm, [-1, -1], cc);

  const qrImg = await loadImage(qrDataUrl);
  ctx.drawImage(qrImg, qrX + qrPad, qrY + qrPad, qrSz, qrSz);

  // ── 13. Labels souche ─────────────────────────────────────────────────────
  // E-TICKET (haut)
  ctx.save();
  ctx.fillStyle = 'rgba(0,229,255,0.18)';
  roundRect(ctx, STUB_CX - 38, 11, 76, 18, 9); ctx.fill();
  ctx.fillStyle = 'rgba(0,229,255,0.68)'; ctx.font = 'bold 8px Arial, sans-serif'; ctx.textAlign = 'center';
  ctx.fillText('E-TICKET', STUB_CX, 23);
  ctx.restore();

  // ADMIT ONE (sous QR)
  const admitY = qrY + qrH + 10;
  ctx.save();
  ctx.shadowColor = 'rgba(123,47,190,0.55)'; ctx.shadowBlur = 10;
  ctx.fillStyle = 'rgba(123,47,190,0.32)';
  roundRect(ctx, STUB_CX - 52, admitY, 104, 22, 11); ctx.fill();
  ctx.shadowBlur = 0; ctx.fillStyle = 'rgba(192,132,252,0.92)';
  ctx.font = 'bold 10px Arial, sans-serif'; ctx.textAlign = 'center';
  ctx.fillText('✦  ADMIT ONE  ✦', STUB_CX, admitY + 15);
  ctx.restore();

  // Texte vertical "CONSERVER CE TALON"
  ctx.save();
  ctx.translate(PERF_X + 14, H / 2);
  ctx.rotate(-Math.PI / 2);
  ctx.fillStyle = 'rgba(255,255,255,0.10)';
  ctx.font = 'bold 8px Arial, sans-serif'; ctx.textAlign = 'center';
  ctx.fillText('CONSERVER CE TALON', 0, 0);
  ctx.restore();

  // ID billet
  ctx.fillStyle = 'rgba(255,255,255,0.22)';
  ctx.font = '8px Arial, sans-serif'; ctx.textAlign = 'center';
  ctx.fillText(`#${ticketId.slice(0, 14).toUpperCase()}`, STUB_CX, H - 11);

  // ── 14. Sparkles ──────────────────────────────────────────────────────────
  drawSparkle(ctx, 518, 24,      6, '#00E5FF', 0.55);
  drawSparkle(ctx, 592, H - 28, 5, '#E040FB', 0.45);
  drawSparkle(ctx, PERF_X + 16, 22,  5, '#E040FB', 0.50);
  drawSparkle(ctx, W - 16, H - 22,   4, '#00E5FF', 0.40);

  // ── 15. Barre couleur bas ─────────────────────────────────────────────────
  const barG = ctx.createLinearGradient(0, 0, W, 0);
  barG.addColorStop(0,   '#7B2FBE');
  barG.addColorStop(0.5, '#E040FB');
  barG.addColorStop(1,   '#00E5FF');
  ctx.fillStyle = barG;
  ctx.fillRect(0, H - 6, W, 6);

  // ── 16. Ombres de profondeur perforation ──────────────────────────────────
  // Dessinées AVANT les trous pour ne pas reboucher les trous transparents
  ctx.save();
  const shL = ctx.createLinearGradient(PERF_X - 14, 0, PERF_X, 0);
  shL.addColorStop(0, 'rgba(0,0,0,0)');
  shL.addColorStop(1, 'rgba(0,0,0,0.38)');
  ctx.fillStyle = shL; ctx.fillRect(PERF_X - 14, 0, 14, H);

  const shR = ctx.createLinearGradient(PERF_X, 0, PERF_X + 14, 0);
  shR.addColorStop(0, 'rgba(0,0,0,0.38)');
  shR.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = shR; ctx.fillRect(PERF_X, 0, 14, H);
  ctx.restore();

  // ── 17. Perforation — trous réels (destination-out, absolument en dernier) ─
  const NOTCH_R    = 18;   // rayon demi-cercles bord
  const HOLE_R     = 3.8;  // rayon trous perforés
  const HOLE_STEP  = 19;   // espacement entre trous

  ctx.save();
  ctx.globalCompositeOperation = 'destination-out';
  ctx.fillStyle = '#000'; // opacité 1 obligatoire pour destination-out

  // Encoches haut et bas
  ctx.beginPath(); ctx.arc(PERF_X, 0, NOTCH_R, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(PERF_X, H, NOTCH_R, 0, Math.PI * 2); ctx.fill();

  // Série de trous entre les encoches
  const yStart = NOTCH_R + 10;
  const yEnd   = H - NOTCH_R - 10;
  for (let y = yStart; y <= yEnd; y += HOLE_STEP) {
    ctx.beginPath(); ctx.arc(PERF_X, y, HOLE_R, 0, Math.PI * 2); ctx.fill();
  }

  ctx.restore(); // remet globalCompositeOperation à 'source-over'
}
