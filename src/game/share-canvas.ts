import { META } from '../data/meta';
import type { ShareCard } from './share';
import { sharePlan } from './share';

const WIDTH = 900;
const HEIGHT = 1200;

export async function renderShareBlob(card: ShareCard): Promise<Blob> {
  if (document.fonts?.load) {
    await document.fonts.load('72px "Fusion Pixel"');
    await document.fonts.ready;
  }
  const canvas = document.createElement('canvas');
  canvas.width = WIDTH;
  canvas.height = HEIGHT;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('无法生成分享图');
  drawShare(ctx, card);
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob((value) => resolve(value), 'image/png'));
  if (!blob) throw new Error('无法导出 PNG');
  return blob;
}

export function drawShare(ctx: CanvasRenderingContext2D, card: ShareCard): void {
  ctx.fillStyle = '#1a1612';
  ctx.fillRect(0, 0, WIDTH, HEIGHT);
  drawSkyline(ctx);
  ctx.strokeStyle = '#e2a04a';
  ctx.lineWidth = 12;
  ctx.strokeRect(36, 36, WIDTH - 72, HEIGHT - 72);
  ctx.strokeStyle = '#3a3128';
  ctx.lineWidth = 4;
  ctx.strokeRect(52, 52, WIDTH - 104, HEIGHT - 104);

  ctx.fillStyle = '#e2a04a';
  setFont(ctx, 36);
  ctx.fillText(card.gameTitle, WIDTH / 2, 96);

  ctx.fillStyle = '#f3e6c8';
  const nameSize = fitSize(ctx, card.endingName, 72, 760);
  setFont(ctx, nameSize);
  ctx.fillText(card.endingName, WIDTH / 2, 220);

  ctx.fillStyle = '#f3e6c8';
  setFont(ctx, 48);
  ctx.fillText(`坚持了 ${card.days} 天`, WIDTH / 2, 360);

  ctx.fillStyle = '#e2a04a';
  const statSize = fitSize(ctx, card.keyStat, 36, 760);
  setFont(ctx, statSize);
  ctx.fillText(card.keyStat, WIDTH / 2, 450);

  ctx.fillStyle = '#8a7864';
  ctx.fillRect(180, 540, 540, 8);

  ctx.fillStyle = '#d8c7aa';
  const urlSize = fitSize(ctx, card.url, 24, 760);
  setFont(ctx, urlSize);
  ctx.fillText(card.url, WIDTH / 2, 980);

  ctx.fillStyle = '#e2a04a';
  setFont(ctx, 24);
  ctx.textAlign = 'right';
  ctx.fillText(card.watermark, WIDTH - 78, 1088);
  ctx.textAlign = 'center';
}

function setFont(ctx: CanvasRenderingContext2D, size: number): void {
  ctx.font = `${size}px "Fusion Pixel", "PingFang SC", "Microsoft YaHei", sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
}

function fitSize(ctx: CanvasRenderingContext2D, text: string, size: number, maxWidth: number): number {
  let next = size;
  while (next > 12) {
    setFont(ctx, next);
    if (ctx.measureText(text).width <= maxWidth) return next;
    next -= 12;
  }
  return 12;
}

function drawSkyline(ctx: CanvasRenderingContext2D): void {
  ctx.fillStyle = '#241c28';
  ctx.fillRect(0, 760, WIDTH, 440);
  const blocks: [number, number, number, number, string][] = [
    [60, 820, 70, 220, '#2e3438'],
    [140, 760, 50, 280, '#3d342c'],
    [200, 800, 90, 240, '#2a3140'],
    [300, 740, 40, 300, '#4a3b32'],
    [350, 860, 120, 180, '#33302c'],
    [480, 790, 60, 250, '#2c3a44'],
    [550, 830, 100, 210, '#3a2e28'],
    [660, 770, 46, 270, '#243038'],
    [720, 850, 110, 190, '#3e3832'],
  ];
  for (const [x, y, w, h, color] of blocks) {
    ctx.fillStyle = color;
    ctx.fillRect(x, y, w, h);
    ctx.fillStyle = '#f2d48a';
    for (let wy = y + 16; wy < y + h - 20; wy += 28) {
      for (let wx = x + 10; wx < x + w - 12; wx += 22) {
        if ((wx + wy) % 3 === 0) ctx.fillRect(wx, wy, 8, 10);
      }
    }
  }
  ctx.fillStyle = '#14110e';
  ctx.fillRect(0, 1040, WIDTH, 160);
  ctx.fillStyle = '#e2a04a';
  ctx.fillRect(430, 1008, 16, 28);
  ctx.fillStyle = '#6ea4c4';
  ctx.fillRect(418, 996, 40, 16);
}

export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

export async function deliverImage(blob: Blob, ua: string): Promise<'wechat' | 'shared' | 'downloaded' | 'cancelled'> {
  const file = new File([blob], 'huozhejiuxing.png', { type: 'image/png' });
  const canShareFiles = typeof navigator.canShare === 'function' && navigator.canShare({ files: [file] });
  const plan = sharePlan(ua, canShareFiles);
  if (plan === 'wechat') return 'wechat';
  if (plan === 'share') {
    try {
      await navigator.share({ files: [file], title: META.title });
      return 'shared';
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') return 'cancelled';
      downloadBlob(blob, 'huozhejiuxing.png');
      return 'downloaded';
    }
  }
  downloadBlob(blob, 'huozhejiuxing.png');
  return 'downloaded';
}
