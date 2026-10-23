/**
 * Draws the Godsworn logo as pixel art: a sword planted through a sunburst
 * halo, with the title in gilded serif capitals. It is rendered at a low
 * internal resolution, alpha-thresholded so every pixel is hard-edged, and
 * scaled up by CSS with `image-rendering: pixelated`.
 */
export const LOGO_WIDTH = 240;
export const LOGO_HEIGHT = 100;

const OUTLINE = '#2a1406';

export function drawLogo(canvas: HTMLCanvasElement): void {
  canvas.width = LOGO_WIDTH;
  canvas.height = LOGO_HEIGHT;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  ctx.imageSmoothingEnabled = false;
  ctx.clearRect(0, 0, LOGO_WIDTH, LOGO_HEIGHT);

  const cx = LOGO_WIDTH / 2;
  const cy = 46;

  drawHalo(ctx, cx, cy);
  drawSword(ctx, cx);
  drawTitle(ctx, cx, cy + 6);
  drawSubtitle(ctx, cx, 92);
  hardenAlpha(ctx);
}

function drawHalo(ctx: CanvasRenderingContext2D, cx: number, cy: number): void {
  // Alternating long and short rays, like a sun on a temple banner.
  const rays = 24;
  for (let i = 0; i < rays; i++) {
    const angle = (i / rays) * Math.PI * 2;
    const inner = 31;
    const outer = i % 2 === 0 ? 45 : 38;
    ctx.strokeStyle = i % 2 === 0 ? '#f1b84b' : '#c98a2e';
    ctx.lineWidth = i % 2 === 0 ? 2 : 1;
    ctx.beginPath();
    ctx.moveTo(cx + Math.cos(angle) * inner, cy + Math.sin(angle) * inner);
    ctx.lineTo(cx + Math.cos(angle) * outer, cy + Math.sin(angle) * outer);
    ctx.stroke();
  }
  ctx.strokeStyle = OUTLINE;
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.arc(cx, cy, 28, 0, Math.PI * 2);
  ctx.stroke();
  ctx.strokeStyle = '#f1b84b';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(cx, cy, 28, 0, Math.PI * 2);
  ctx.stroke();
}

function drawSword(ctx: CanvasRenderingContext2D, cx: number): void {
  const x = Math.round(cx) - 2;
  // Blade with a dark right edge, pointing down.
  ctx.fillStyle = OUTLINE;
  ctx.fillRect(x - 1, 21, 6, 56);
  ctx.beginPath();
  ctx.moveTo(x - 1, 77);
  ctx.lineTo(x + 2, 84);
  ctx.lineTo(x + 5, 77);
  ctx.fill();
  ctx.fillStyle = '#dfe6ef';
  ctx.fillRect(x, 22, 4, 55);
  ctx.fillStyle = '#8a94a6';
  ctx.fillRect(x + 2, 22, 2, 55);
  ctx.beginPath();
  ctx.moveTo(x, 77);
  ctx.lineTo(x + 2, 82);
  ctx.lineTo(x + 4, 77);
  ctx.fill();
  // Crossguard.
  ctx.fillStyle = OUTLINE;
  ctx.fillRect(x - 13, 17, 30, 6);
  ctx.fillStyle = '#e0a63a';
  ctx.fillRect(x - 12, 18, 28, 4);
  ctx.fillStyle = '#fff3c4';
  ctx.fillRect(x - 12, 18, 28, 1);
  // Grip and pommel gem.
  ctx.fillStyle = OUTLINE;
  ctx.fillRect(x - 1, 8, 6, 10);
  ctx.fillStyle = '#6b3d1e';
  ctx.fillRect(x, 9, 4, 8);
  ctx.fillStyle = OUTLINE;
  ctx.fillRect(x - 2, 2, 8, 7);
  ctx.fillStyle = '#c0392b';
  ctx.fillRect(x - 1, 3, 6, 5);
  ctx.fillStyle = '#ff8a7a';
  ctx.fillRect(x, 4, 2, 2);
}

function drawTitle(ctx: CanvasRenderingContext2D, cx: number, y: number): void {
  ctx.font = 'bold 30px Georgia, "Times New Roman", serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const text = 'GODSWORN';

  // Thick dark outline, then a drop shadow, then the gilded fill.
  ctx.lineJoin = 'round';
  ctx.strokeStyle = OUTLINE;
  ctx.lineWidth = 5;
  ctx.strokeText(text, cx, y + 1);
  ctx.strokeText(text, cx, y);

  const gradient = ctx.createLinearGradient(0, y - 12, 0, y + 12);
  gradient.addColorStop(0, '#fff3c4');
  gradient.addColorStop(0.45, '#f1b84b');
  gradient.addColorStop(0.55, '#d48b26');
  gradient.addColorStop(1, '#8a4a0e');
  ctx.fillStyle = gradient;
  ctx.fillText(text, cx, y);
}

function drawSubtitle(ctx: CanvasRenderingContext2D, cx: number, y: number): void {
  ctx.font = 'bold 8px Georgia, "Times New Roman", serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.strokeStyle = OUTLINE;
  ctx.lineWidth = 3;
  const text = '✦  OATHS BIND EVEN GODS  ✦';
  ctx.strokeText(text, cx, y);
  ctx.fillStyle = '#d9c49a';
  ctx.fillText(text, cx, y);
}

/** Snaps every pixel to fully opaque or fully transparent. */
function hardenAlpha(ctx: CanvasRenderingContext2D): void {
  const image = ctx.getImageData(0, 0, LOGO_WIDTH, LOGO_HEIGHT);
  const d = image.data;
  for (let i = 3; i < d.length; i += 4) d[i] = (d[i] ?? 0) >= 100 ? 255 : 0;
  ctx.putImageData(image, 0, 0);
}
