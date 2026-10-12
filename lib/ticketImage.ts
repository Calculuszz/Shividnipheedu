import QRCode from 'qrcode';

// "Save QR": the ticket drawn as a phone-sized PNG (1080 wide, at least 1920 tall) so it opens
// from the photo gallery with no signal. Same layout as the ticket on the page.

type Pair = { label: string; value: string; /** <svg> markup with the colours filled in */ icon?: string };

export type TicketImage = {
  title: string;
  hint: string;
  qr: { text: string; dark: string; light: string };
  name: Pair;
  code: Pair;
  pairs?: Pair[];
  place?: Pair;
  footer?: string;
};

/** Theme colours read from the page, so the Haunted House image comes out red by itself */
export type TicketColors = {
  dark: string;
  card: string;
  accent: string;
  line: string;
  glow: string;
  muted: string;
  text: string;
};

export function themeColors(el: Element): TicketColors {
  const s = getComputedStyle(el);
  const v = (name: string) => s.getPropertyValue(name).trim();
  return {
    dark: v('--halloween-dark'),
    card: v('--halloween-charcoal'),
    accent: v('--halloween-dusty-orange'),
    line: v('--halloween-faded-purple'),
    glow: v('--halloween-slate-blue'),
    muted: v('--halloween-ash-gray'),
    text: v('--halloween-cream'),
  };
}

/** An on-page <svg> icon as standalone markup, theme variables swapped for their colours */
export function svgMarkup(el: Element | null | undefined): string | undefined {
  if (!el) return undefined;
  const s = getComputedStyle(el);
  let html = el.outerHTML.replace(/var\((--[\w-]+)\)/g, (_, name: string) => s.getPropertyValue(name).trim());
  if (!html.includes('xmlns=')) html = html.replace('<svg', '<svg xmlns="http://www.w3.org/2000/svg"');
  return html;
}

const W = 390; // layout in page px, drawn at 1080 / 390
const SCALE = 1080 / W;
const BODY = "'FC Iconic', system-ui, sans-serif";
const MONO = 'ui-monospace, Menlo, Consolas, monospace';

function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

const svgImage = (svg?: string) =>
  svg ? loadImage(`data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`).catch(() => null) : Promise.resolve(null);

export async function drawTicket(t: TicketImage, c: TicketColors): Promise<Blob> {
  await Promise.all([
    document.fonts.load(`400 38px 'Monster Fiesta'`),
    document.fonts.load(`400 15px 'FC Iconic'`),
    document.fonts.load(`700 20px 'FC Iconic'`),
  ]).catch(() => {});
  const [qr, pairIcons, placeIcon] = await Promise.all([
    QRCode.toDataURL(t.qr.text, { width: 640, margin: 2, color: { dark: t.qr.dark, light: t.qr.light } }).then(loadImage),
    Promise.all((t.pairs ?? []).map((p) => svgImage(p.icon))),
    svgImage(t.place?.icon),
  ]);

  // Heights first (page px), then the canvas
  const panelH =
    16 + 17 + 26 + 12 + 17 + 30 +
    (t.pairs?.length ? 12 + 12 + 40 : 0) +
    (t.place ? 12 + 40 : 0) +
    16;
  const cardH = 24 + 38 + 12 + 20 + 16 + 264 + 18 + panelH + (t.footer ? 12 + 18 : 0) + 22;
  const H = Math.max(1920 / SCALE, cardH + 64);

  const canvas = document.createElement('canvas');
  canvas.width = 1080;
  canvas.height = Math.round(H * SCALE);
  const ctx = canvas.getContext('2d')!;
  ctx.scale(SCALE, SCALE);

  // Page background: dark with a glow at the top, like the booking pages
  ctx.fillStyle = c.dark;
  ctx.fillRect(0, 0, W, H);
  const glow = ctx.createRadialGradient(W / 2, 0, 0, W / 2, 0, H * 0.6);
  glow.addColorStop(0, c.glow);
  glow.addColorStop(1, 'transparent');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, W, H);

  const text = (s: string, x: number, y: number, font: string, color: string, align: CanvasTextAlign = 'left', maxW?: number, spacing = 0) => {
    ctx.font = font;
    ctx.fillStyle = color;
    ctx.textAlign = align;
    ctx.textBaseline = 'top';
    if ('letterSpacing' in ctx) (ctx as CanvasRenderingContext2D & { letterSpacing: string }).letterSpacing = `${spacing}px`;
    // Long names shrink to fit instead of running off the card
    if (maxW) {
      let size = parseFloat(font.match(/(\d+(?:\.\d+)?)px/)![1]);
      while (ctx.measureText(s).width > maxW && size > 10) {
        size -= 1;
        ctx.font = font.replace(/\d+(?:\.\d+)?px/, `${size}px`);
      }
    }
    ctx.fillText(s, x, y);
  };
  const box = (x: number, y: number, w: number, h: number, r: number | number[], fill?: string, stroke?: string, lw = 1) => {
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, r);
    if (fill) {
      ctx.fillStyle = fill;
      ctx.fill();
    }
    if (stroke) {
      ctx.lineWidth = lw;
      ctx.strokeStyle = stroke;
      ctx.stroke();
    }
  };

  // Card (hand-cut corners)
  const cx = 16;
  const cw = W - 32;
  let y = (H - cardH) / 2;
  ctx.globalAlpha = 0.95;
  box(cx, y, cw, cardH, [20, 14, 22, 12], c.card);
  ctx.globalAlpha = 1;
  box(cx + 1, y + 1, cw - 2, cardH - 2, [20, 14, 22, 12], undefined, c.accent, 2);

  y += 24;
  text(t.title, W / 2, y, `400 38px 'Monster Fiesta', ${BODY}`, c.accent, 'center', cw - 40, 1.5);
  y += 38 + 12;
  text(t.hint, W / 2, y, `400 15px ${BODY}`, c.text, 'center');
  y += 20 + 16;

  // QR tile: dark tile, accent frame, QR inside
  box((W - 264) / 2, y, 264, 264, 10, c.dark);
  box((W - 236) / 2 + 2, y + 16, 232, 232, 8, t.qr.light, c.accent, 4);
  ctx.drawImage(qr, (W - 236) / 2 + 12, y + 26, 212, 212);
  y += 264 + 18;

  // Details panel
  const px = cx + 20;
  const pw = cw - 40;
  box(px, y, pw, panelH, 6, c.dark, c.line);
  let py = y + 16;
  const ix = px + 16;
  const iw = pw - 32;
  // Name and code centred, as on the page
  text(t.name.label, W / 2, py, `400 13px ${BODY}`, c.muted, 'center');
  text(t.name.value, W / 2, py + 17, `700 20px ${BODY}`, c.text, 'center', iw);
  py += 17 + 26 + 12;
  text(t.code.label, W / 2, py, `400 13px ${BODY}`, c.muted, 'center');
  text(t.code.value, W / 2, py + 17, `700 24px ${MONO}`, c.accent, 'center', iw, 1.4);
  py += 17 + 30;

  const row = (p: Pair, icon: HTMLImageElement | null, x: number, w: number, size: number) => {
    let tx = x;
    if (icon) {
      ctx.drawImage(icon, x, py + 7, 26, 26);
      tx += 26 + 10;
    }
    text(p.label, tx, py + 1, `400 13px ${BODY}`, c.muted);
    text(p.value, tx, py + 18, `700 ${size}px ${BODY}`, c.text, 'left', w - (tx - x));
  };
  if (t.pairs?.length) {
    py += 12;
    ctx.fillStyle = c.line;
    ctx.fillRect(ix, py, iw, 1);
    py += 12;
    const colW = (iw - 8) / 2;
    t.pairs.slice(0, 2).forEach((p, i) => row(p, pairIcons[i], ix + i * (colW + 8), colW, 18));
    py += 40;
  }
  if (t.place) {
    py += 12;
    row(t.place, placeIcon, ix, iw, 16);
  }
  y += panelH;

  if (t.footer) text(t.footer, W / 2, y + 12, `400 13px ${BODY}`, c.muted, 'center');

  return new Promise((resolve, reject) => canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('toBlob'))), 'image/png'));
}

const isIOS = () =>
  /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

/**
 * iPhone: the share sheet ("Save Image" puts it in Photos; a download would land in Files).
 * Everywhere else: a normal download, which Android's gallery picks up.
 */
export async function saveImage(blob: Blob, fileName: string): Promise<'saved' | 'cancelled'> {
  const file = new File([blob], fileName, { type: 'image/png' });
  if (isIOS() && navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file] });
      return 'saved';
    } catch (e) {
      if ((e as Error).name === 'AbortError') return 'cancelled';
      // Not allowed (e.g. the tap expired): fall back to a download
    }
  }
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
  return 'saved';
}
