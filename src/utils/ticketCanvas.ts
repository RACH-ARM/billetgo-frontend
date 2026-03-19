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

// ─── Main generator ───────────────────────────────────────────────────────────

export interface TicketCanvasOpts {
  ticketId: string;
  eventTitle?: string;
  categoryName?: string;
  eventDate?: string;
  venueName?: string;
  coverImageUrl?: string;
}

export async function generateTicketCanvas(
  canvas: HTMLCanvasElement,
  qrDataUrl: string,
  opts: TicketCanvasOpts
) {
  const { ticketId, eventTitle, categoryName, eventDate, venueName, coverImageUrl } = opts;
  const W = 640;
  const H = 1100;
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d')!;

  // 1. Fond principal
  const bgGrad = ctx.createLinearGradient(0, 0, W * 0.6, H);
  bgGrad.addColorStop(0, '#0f0520');
  bgGrad.addColorStop(0.5, '#0D0D1A');
  bgGrad.addColorStop(1, '#050d1a');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, W, H);

  // 2. Orbes lumineux
  drawDot(ctx, -20, 60, 220, '#7B2FBE', 0.22);
  drawDot(ctx, W + 20, 340, 180, '#E040FB', 0.15);
  drawDot(ctx, 80, H - 80, 160, '#7B2FBE', 0.12);
  drawDot(ctx, W - 60, H - 120, 140, '#00E5FF', 0.10);
  drawDot(ctx, W * 0.5, 580, 200, '#3D0F7A', 0.18);

  // 3. Watermark "BILLETGO"
  ctx.save();
  ctx.translate(W / 2, H / 2);
  ctx.rotate(-Math.PI / 5);
  ctx.globalAlpha = 0.038;
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 24px Arial, sans-serif';
  ctx.textAlign = 'center';
  for (let row = -9; row <= 9; row++) {
    for (let col = -5; col <= 5; col++) {
      ctx.fillText('BILLETGO', col * 170, row * 72);
    }
  }
  ctx.restore();

  // 4. Photo de l'événement
  const coverH = 320;
  ctx.save();
  roundRect(ctx, 0, 0, W, coverH + 30, 0);
  ctx.clip();

  if (coverImageUrl) {
    try {
      const cover = await loadImage(coverImageUrl, true);
      const scale = Math.max(W / cover.width, coverH / cover.height);
      const sw = cover.width * scale;
      const sh = cover.height * scale;
      ctx.drawImage(cover, (W - sw) / 2, (coverH - sh) / 2, sw, sh);
    } catch {
      const fb = ctx.createLinearGradient(0, 0, W, coverH);
      fb.addColorStop(0, '#2D1060'); fb.addColorStop(1, '#003060');
      ctx.fillStyle = fb; ctx.fillRect(0, 0, W, coverH);
    }
  } else {
    const fb = ctx.createLinearGradient(0, 0, W, coverH);
    fb.addColorStop(0, '#2D1060'); fb.addColorStop(1, '#003060');
    ctx.fillStyle = fb; ctx.fillRect(0, 0, W, coverH);
  }

  const vigL = ctx.createLinearGradient(0, 0, 80, 0);
  vigL.addColorStop(0, 'rgba(13,13,26,0.7)'); vigL.addColorStop(1, 'transparent');
  ctx.fillStyle = vigL; ctx.fillRect(0, 0, 80, coverH);
  const vigR = ctx.createLinearGradient(W - 80, 0, W, 0);
  vigR.addColorStop(0, 'transparent'); vigR.addColorStop(1, 'rgba(13,13,26,0.7)');
  ctx.fillStyle = vigR; ctx.fillRect(W - 80, 0, 80, coverH);

  const overlayBot = ctx.createLinearGradient(0, coverH * 0.3, 0, coverH + 30);
  overlayBot.addColorStop(0, 'rgba(13,13,26,0)');
  overlayBot.addColorStop(0.55, 'rgba(13,13,26,0.6)');
  overlayBot.addColorStop(1, 'rgba(15,5,32,1)');
  ctx.fillStyle = overlayBot; ctx.fillRect(0, 0, W, coverH + 30);
  ctx.fillStyle = 'rgba(50,10,100,0.25)'; ctx.fillRect(0, 0, W, coverH + 30);
  ctx.restore();

  const bridge = ctx.createLinearGradient(0, coverH - 10, 0, coverH + 60);
  bridge.addColorStop(0, 'rgba(15,5,32,0)');
  bridge.addColorStop(1, 'rgba(15,5,32,1)');
  ctx.fillStyle = bridge;
  ctx.fillRect(0, coverH - 10, W, 70);

  // 5. Sparkles
  drawSparkle(ctx, 58, 44, 9, '#ffffff', 0.75);
  drawSparkle(ctx, 540, 28, 6, '#00E5FF', 0.65);
  drawSparkle(ctx, 590, 120, 4, '#E040FB', 0.55);
  drawSparkle(ctx, 32, 195, 5, '#00E5FF', 0.50);
  drawSparkle(ctx, 610, 230, 8, '#ffffff', 0.45);
  drawSparkle(ctx, 120, 280, 4, '#E040FB', 0.40);
  drawSparkle(ctx, 480, 260, 5, '#C084FC', 0.50);
  drawDot(ctx, 320, 100, 40, '#E040FB', 0.06);
  drawDot(ctx, 200, 200, 30, '#00E5FF', 0.07);

  // 7. Titre
  const title = (eventTitle || 'MON BILLET').toUpperCase();
  let fz = 42;
  ctx.font = `bold ${fz}px Arial, sans-serif`;
  while (ctx.measureText(title).width > W - 56 && fz > 24) {
    fz -= 2;
    ctx.font = `bold ${fz}px Arial, sans-serif`;
  }
  ctx.shadowColor = 'rgba(0,0,0,0.9)';
  ctx.shadowBlur = 20;
  ctx.shadowOffsetY = 3;
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'left';
  ctx.fillText(title, 24, coverH - 16);
  ctx.shadowBlur = 0; ctx.shadowOffsetY = 0;

  // 8. Séparateur
  const sepY = coverH + 46;
  const sepBand = ctx.createLinearGradient(0, coverH, 0, coverH + 90);
  sepBand.addColorStop(0, 'rgba(123,47,190,0.15)');
  sepBand.addColorStop(1, 'rgba(123,47,190,0)');
  ctx.fillStyle = sepBand;
  ctx.fillRect(0, coverH, W, 90);

  ctx.fillStyle = '#0D0D1A';
  ctx.beginPath(); ctx.arc(-1, sepY, 20, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(W + 1, sepY, 20, 0, Math.PI * 2); ctx.fill();

  ctx.save();
  ctx.setLineDash([6, 8]);
  ctx.strokeStyle = 'rgba(255,255,255,0.18)';
  ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.moveTo(28, sepY); ctx.lineTo(W - 28, sepY); ctx.stroke();
  ctx.restore();

  const admitW = 110;
  ctx.fillStyle = 'rgba(123,47,190,0.25)';
  roundRect(ctx, (W - admitW) / 2, sepY - 13, admitW, 26, 13);
  ctx.fill();
  ctx.fillStyle = 'rgba(192,132,252,0.8)';
  ctx.font = 'bold 11px Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('✦  ADMIT ONE  ✦', W / 2, sepY + 4);

  // 9. Infos événement
  let infoY = sepY + 44;

  if (categoryName) {
    ctx.font = 'bold 13px Arial, sans-serif';
    const catW = Math.min(ctx.measureText(categoryName.toUpperCase()).width + 40, W - 48);
    ctx.save();
    ctx.shadowColor = '#7B2FBE';
    ctx.shadowBlur = 12;
    ctx.fillStyle = 'rgba(123,47,190,0.35)';
    roundRect(ctx, 24, infoY, catW, 30, 15);
    ctx.fill();
    ctx.strokeStyle = 'rgba(192,132,252,0.6)';
    ctx.lineWidth = 1;
    roundRect(ctx, 24, infoY, catW, 30, 15);
    ctx.stroke();
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#C084FC';
    ctx.textAlign = 'left';
    ctx.save();
    ctx.rect(24, infoY, catW, 30);
    ctx.clip();
    ctx.fillText(categoryName.toUpperCase(), 44, infoY + 20);
    ctx.restore();
    ctx.restore();
    infoY += 50;
  }

  if (eventDate) {
    const d = new Date(eventDate);
    const dateStr = d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    const timeStr = d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    ctx.textAlign = 'left';
    ctx.fillStyle = 'rgba(0,229,255,0.45)';
    ctx.font = '11px Arial, sans-serif';
    ctx.fillText('DATE & HEURE', 24, infoY);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 15px Arial, sans-serif';
    ctx.fillText(`${dateStr}  ·  ${timeStr}`, 24, infoY + 19);
    ctx.fillStyle = 'rgba(0,229,255,0.2)';
    ctx.fillRect(24, infoY + 28, W - 48, 1);
    infoY += 52;
  }

  if (venueName) {
    ctx.textAlign = 'left';
    ctx.fillStyle = 'rgba(224,64,251,0.45)';
    ctx.font = '11px Arial, sans-serif';
    ctx.fillText('LIEU', 24, infoY);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 15px Arial, sans-serif';
    ctx.fillText(venueName, 24, infoY + 19);
    ctx.fillStyle = 'rgba(224,64,251,0.2)';
    ctx.fillRect(24, infoY + 28, W - 48, 1);
    infoY += 52;
  }

  // 10. Zone QR code
  const qrSize = 264;
  const qrPad = 22;
  const qrCardW = qrSize + qrPad * 2;
  const qrCardH = qrSize + qrPad * 2;
  const qrCardX = (W - qrCardW) / 2;
  const qrCardY = infoY + 20;

  drawDot(ctx, W / 2, qrCardY + qrCardH / 2, 200, '#7B2FBE', 0.18);

  ctx.save();
  ctx.shadowColor = 'rgba(123,47,190,0.5)';
  ctx.shadowBlur = 32;
  ctx.fillStyle = '#ffffff';
  roundRect(ctx, qrCardX, qrCardY, qrCardW, qrCardH, 18);
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.restore();

  ctx.save();
  const borderGrad = ctx.createLinearGradient(qrCardX, qrCardY, qrCardX + qrCardW, qrCardY + qrCardH);
  borderGrad.addColorStop(0, 'rgba(123,47,190,0.7)');
  borderGrad.addColorStop(0.5, 'rgba(224,64,251,0.5)');
  borderGrad.addColorStop(1, 'rgba(0,229,255,0.5)');
  ctx.strokeStyle = borderGrad;
  ctx.lineWidth = 2.5;
  roundRect(ctx, qrCardX, qrCardY, qrCardW, qrCardH, 18);
  ctx.stroke();
  ctx.restore();

  const cm = 18;
  const cOff = -8;
  const cornerColor = 'rgba(123,47,190,0.9)';
  drawCornerMark(ctx, qrCardX + cOff, qrCardY + cOff, cm, [1, 1], cornerColor);
  drawCornerMark(ctx, qrCardX + qrCardW - cOff, qrCardY + cOff, cm, [-1, 1], cornerColor);
  drawCornerMark(ctx, qrCardX + cOff, qrCardY + qrCardH - cOff, cm, [1, -1], cornerColor);
  drawCornerMark(ctx, qrCardX + qrCardW - cOff, qrCardY + qrCardH - cOff, cm, [-1, -1], cornerColor);

  const qrImg = await loadImage(qrDataUrl);
  ctx.drawImage(qrImg, qrCardX + qrPad, qrCardY + qrPad, qrSize, qrSize);

  drawSparkle(ctx, qrCardX - 16, qrCardY + 30, 7, '#E040FB', 0.65);
  drawSparkle(ctx, qrCardX + qrCardW + 16, qrCardY + qrCardH - 30, 5, '#00E5FF', 0.55);
  drawSparkle(ctx, qrCardX + 20, qrCardY + qrCardH + 16, 4, '#C084FC', 0.50);
  drawSparkle(ctx, qrCardX + qrCardW - 20, qrCardY - 14, 6, '#ffffff', 0.40);

  // 11. Footer
  const footY = qrCardY + qrCardH + 40;
  ctx.textAlign = 'center';
  ctx.fillStyle = 'rgba(255,255,255,0.22)';
  ctx.font = '13px Arial, sans-serif';
  ctx.fillText('Ce billet est personnel et non transférable', W / 2, footY);
  ctx.fillStyle = 'rgba(255,255,255,0.1)';
  ctx.font = '11px Arial, sans-serif';
  ctx.fillText(`#${ticketId.slice(0, 22).toUpperCase()}`, W / 2, footY + 22);

  const barGrad = ctx.createLinearGradient(0, 0, W, 0);
  barGrad.addColorStop(0, '#7B2FBE');
  barGrad.addColorStop(0.5, '#E040FB');
  barGrad.addColorStop(1, '#00E5FF');
  ctx.fillStyle = barGrad;
  ctx.fillRect(0, H - 7, W, 7);

  drawSparkle(ctx, 50, H - 40, 5, '#E040FB', 0.35);
  drawSparkle(ctx, W - 50, H - 40, 5, '#00E5FF', 0.35);
  drawSparkle(ctx, W / 2, H - 55, 4, '#C084FC', 0.30);
}
