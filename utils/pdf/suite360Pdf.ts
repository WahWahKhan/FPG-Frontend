/**
 * Shared jsPDF renderer for the Suite360 "Add to Cart" PDFs (Tube360, Function360, Trac360).
 *
 * Why this exists: those pages used to screenshot their summary HTML with html2canvas and paste
 * the picture into a PDF. That stalls in privacy browsers (DuckDuckGo blocks the canvas
 * read-back, so "Adding to Cart..." never finished), blurs the text, and needs the page DOM.
 * This draws the same content directly as text and shapes: sharp, small, no canvas, no DOM.
 *
 * The pages describe their summary as plain data (sections of items); this file lays it out on
 * A4 pages. Product thumbnails are optional bytes (JPEG/PNG) fetched by `loadImageBytes`.
 */

export type PdfItem =
  | { kind: 'kv'; k: string; v: string }
  | { kind: 'text'; text: string; muted?: boolean }
  | { kind: 'note'; text: string }
  | { kind: 'table'; head: string[]; rows: string[][] }
  | { kind: 'bullets'; lines: string[] }
  | {
      kind: 'product';
      /** 'top' (default, like the on-screen items-start rows) or 'center' (items-center rows) */
      align?: 'top' | 'center';
      img?: Uint8Array | null;
      title: string;
      sub?: string;
      bullets?: string[];
      price?: string;
      priceSub?: string;
    };

export interface PdfSection {
  title: string;
  items: PdfItem[];
}

export interface PdfPriceBlock {
  title: string;
  /** [label, value, bold?] */
  rows: Array<[string, string, boolean?]>;
  totalLabel: string;
  totalValue: string;
  note?: string;
}

export interface Suite360PdfInput {
  /** Pill under the logo, e.g. "ORDER SUMMARY" */
  title: string;
  sections: PdfSection[];
  price: PdfPriceBlock;
  /** Optional box after the price block (e.g. Tube360 freight notice) */
  notice?: string;
  logo?: Uint8Array | null;
}

const DARK: [number, number, number] = [74, 74, 74];
const MUTED: [number, number, number] = [107, 114, 128];
const GOLD: [number, number, number] = [250, 204, 21]; // brand yellow (rules, headings)
const GOLD_TEXT: [number, number, number] = [196, 148, 0]; // darker so it stays readable on white
const RULE: [number, number, number] = [229, 231, 235];
const TINT: [number, number, number] = [254, 250, 224];
const TINT_LINE: [number, number, number] = [250, 232, 160];
const GREY_BG: [number, number, number] = [249, 250, 251];

const PAGE_W = 595.28;
const PAGE_H = 841.89;
const MX = 40;
const TOP = 40;
const BOTTOM = 40;
const CW = PAGE_W - MX * 2;
const CAP = 0.718;

/** Standard PDF fonts are WinAnsi only; anything else would print as garbage. */
export const pdfSafe = (v: unknown): string =>
  String(v == null ? '' : v)
    .replace(/×/g, 'x')
    .replace(/[^\x20-\x7E\xA0-\xFF–—‘’“”•€\n]/g, '?');

/** Fetch an image as raw bytes (no canvas). Resolves null on any failure so the PDF still builds. */
export async function loadImageBytes(url: string, timeoutMs = 4000): Promise<Uint8Array | null> {
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), timeoutMs);
    const res = await fetch(url, { signal: ctrl.signal });
    clearTimeout(t);
    if (!res.ok) return null;
    return new Uint8Array(await res.arrayBuffer());
  } catch {
    return null;
  }
}

/** /function360/x.png or /trac360/x.jpg -> the small pre-made JPEG thumbnail, else null. */
export function thumbUrlFor(src?: string | null): string | null {
  if (!src) return null;
  const m = /^\/(function360|trac360)\/([^/?#]+)\.(png|jpe?g)$/i.exec(src);
  return m ? `/pdf-thumbs/${m[1]}/${m[2]}.jpg` : null;
}

function imageFormat(b: Uint8Array): 'PNG' | 'JPEG' | null {
  if (b.length > 4 && b[0] === 0x89 && b[1] === 0x50) return 'PNG';
  if (b.length > 3 && b[0] === 0xff && b[1] === 0xd8) return 'JPEG';
  return null;
}

/** Draws the PDF and returns it as a data URL (what the cart stores). */
export async function buildSuite360Pdf(input: Suite360PdfInput): Promise<string> {
  const { jsPDF } = await import('jspdf');
  const doc = new jsPDF({ unit: 'pt', format: 'a4', compress: true });
  let y = TOP;

  const font = (bold: boolean, size: number, color: [number, number, number]) => {
    doc.setFont('helvetica', bold ? 'bold' : 'normal');
    doc.setFontSize(size);
    doc.setTextColor(color[0], color[1], color[2]);
  };
  const wrap = (text: string, w: number, bold: boolean, size: number): string[] => {
    doc.setFont('helvetica', bold ? 'bold' : 'normal');
    doc.setFontSize(size);
    return doc.splitTextToSize(pdfSafe(text), w) as string[];
  };
  const newPage = () => {
    doc.addPage();
    y = TOP;
  };
  const ensure = (h: number) => {
    if (y + h > PAGE_H - BOTTOM) newPage();
  };
  /** Text line whose cap-height is centred on cy. */
  const lineAt = (s: string, x: number, cy: number, align: 'left' | 'right' | 'center' = 'left') =>
    doc.text(s, x, cy + (CAP * doc.getFontSize()) / 2, { align });
  const rule = (yy: number, color = RULE, w = 0.75) => {
    doc.setDrawColor(color[0], color[1], color[2]);
    doc.setLineWidth(w);
    doc.line(MX, yy, MX + CW, yy);
  };

  // ---- Logo + title pill --------------------------------------------------------------------
  if (input.logo && imageFormat(input.logo)) {
    const lw = 190;
    const lh = (lw * 219) / 560;
    doc.addImage(input.logo, 'PNG', (PAGE_W - lw) / 2, y, lw, lh, undefined, 'FAST');
    y += lh + 18;
  } else {
    y += 10;
  }
  font(true, 14, [255, 255, 255]);
  const pillText = pdfSafe(input.title);
  const pillW = doc.getTextWidth(pillText) + 56;
  doc.setFillColor(...DARK);
  doc.roundedRect((PAGE_W - pillW) / 2, y, pillW, 30, 15, 15, 'F');
  lineAt(pillText, PAGE_W / 2, y + 15, 'center');
  y += 30 + 24;

  // ---- Sections -----------------------------------------------------------------------------
  const sectionHeading = (title: string, color: [number, number, number]) => {
    font(true, 9.5, color);
    lineAt(pdfSafe(title).toUpperCase(), MX, y + 6);
    y += 20;
  };

  const heightOf = (it: PdfItem): number => {
    switch (it.kind) {
      case 'kv': {
        const lines = wrap(it.v, CW * 0.6, true, 10);
        return Math.max(1, lines.length) * 14 + 4;
      }
      case 'text':
        return wrap(it.text, CW, false, 10).length * 13 + 4;
      case 'bullets':
        return it.lines.reduce((s, l) => s + wrap(l, CW - 16, false, 10).length * 13, 0) + 4;
      case 'note':
        return wrap(it.text, CW - 20, false, 10).length * 13 + 22;
      case 'table':
        return (it.rows.length + 1) * 17 + 4;
      case 'product': {
        const textW = CW - (it.img ? 56 : 0) - 96;
        let h = wrap(it.title, textW, true, 11).length * 14;
        if (it.sub) h += wrap(it.sub, textW, false, 9.5).length * 12;
        (it.bullets || []).forEach((b) => (h += wrap(b, textW - 10, false, 9.5).length * 12));
        return Math.max(it.img ? 54 : 24, h) + 14;
      }
    }
  };

  const drawItem = (it: PdfItem) => {
    switch (it.kind) {
      case 'kv': {
        const lines = wrap(it.v, CW * 0.6, true, 10);
        font(false, 10, MUTED);
        lineAt(`${pdfSafe(it.k)}:`, MX, y + 7);
        font(true, 10, DARK);
        lines.forEach((l, i) => lineAt(l, MX + CW, y + 7 + i * 14, 'right'));
        y += Math.max(1, lines.length) * 14 + 4;
        break;
      }
      case 'text': {
        const lines = wrap(it.text, CW, false, 10);
        font(false, 10, it.muted ? MUTED : DARK);
        lines.forEach((l, i) => lineAt(l, MX, y + 6 + i * 13));
        y += lines.length * 13 + 4;
        break;
      }
      case 'bullets': {
        it.lines.forEach((b) => {
          const lines = wrap(b, CW - 16, false, 10);
          font(true, 10, GOLD_TEXT);
          lineAt('•', MX + 2, y + 6);
          font(false, 10, DARK);
          lines.forEach((l, i) => lineAt(l, MX + 14, y + 6 + i * 13));
          y += lines.length * 13;
        });
        y += 4;
        break;
      }
      case 'note': {
        const lines = wrap(it.text, CW - 20, false, 10);
        const h = lines.length * 13 + 18;
        doc.setFillColor(...TINT);
        doc.setDrawColor(...TINT_LINE);
        doc.setLineWidth(0.75);
        doc.roundedRect(MX, y, CW, h, 5, 5, 'FD');
        font(false, 10, DARK);
        lines.forEach((l, i) => lineAt(l, MX + 10, y + 15 + i * 13));
        y += h + 4;
        break;
      }
      case 'table': {
        const cols = it.head.length;
        const first = 34;
        const colW = (CW - first) / Math.max(1, cols - 1);
        const xs = it.head.map((_, i) => MX + (i === 0 ? 0 : first + (i - 1) * colW));
        font(true, 9, MUTED);
        it.head.forEach((h, i) => lineAt(pdfSafe(h), xs[i], y + 8));
        y += 17;
        rule(y - 3);
        font(false, 10, DARK);
        it.rows.forEach((r) => {
          r.forEach((c, i) => lineAt(pdfSafe(c), xs[i], y + 8));
          y += 17;
        });
        y += 4;
        break;
      }
      case 'product': {
        const textW = CW - (it.img ? 56 : 0) - 96;
        const h = heightOf(it) - 14;
        const top = y;
        if (it.img) {
          const fmt = imageFormat(it.img);
          if (fmt) {
            try {
              const p = doc.getImageProperties(it.img as unknown as string);
              const box = 48;
              const s = Math.min(box / p.width, box / p.height);
              const w = p.width * s;
              const hh = p.height * s;
              doc.addImage(it.img, fmt, MX + (box - w) / 2, top + (h - hh) / 2, w, hh, undefined, 'FAST');
            } catch {
              /* unreadable image: skip it, keep the row */
            }
          }
        }
        const tx = MX + (it.img ? 56 : 0);
        let textH = wrap(it.title, textW, true, 11).length * 14;
        if (it.sub) textH += wrap(it.sub, textW, false, 9.5).length * 12;
        (it.bullets || []).forEach((bl) => (textH += wrap(bl, textW - 10, false, 9.5).length * 12));
        const centred = it.align === 'center';
        let ty = top + (centred ? Math.max(0, (h - textH) / 2) : 0);
        font(true, 11, DARK);
        wrap(it.title, textW, true, 11).forEach((l) => {
          lineAt(l, tx, ty + 7);
          ty += 14;
        });
        if (it.sub) {
          font(false, 9.5, MUTED);
          wrap(it.sub, textW, false, 9.5).forEach((l) => {
            lineAt(l, tx, ty + 6);
            ty += 12;
          });
        }
        (it.bullets || []).forEach((b) => {
          font(true, 9.5, GOLD_TEXT);
          lineAt('•', tx, ty + 6);
          font(false, 9.5, MUTED);
          wrap(b, textW - 10, false, 9.5).forEach((l) => {
            lineAt(l, tx + 9, ty + 6);
            ty += 12;
          });
        });
        if (it.price) {
          font(true, 11, GOLD_TEXT);
          const pTop = top + (centred ? Math.max(0, (h - (it.priceSub ? 26 : 14)) / 2) : 0);
          lineAt(pdfSafe(it.price), MX + CW, pTop + 7, 'right');
          if (it.priceSub) {
            font(false, 8.5, MUTED);
            lineAt(pdfSafe(it.priceSub), MX + CW, pTop + 21, 'right');
          }
        }
        y += h + 6;
        rule(y, [243, 244, 246]);
        y += 8;
        break;
      }
    }
  };

  input.sections.forEach((sec) => {
    const first = sec.items[0];
    ensure(24 + (first ? Math.min(heightOf(first), 120) : 0));
    sectionHeading(sec.title, GOLD_TEXT);
    sec.items.forEach((it) => {
      ensure(heightOf(it));
      drawItem(it);
    });
    y += 8;
    rule(y - 2);
    y += 14;
  });

  // ---- Price breakdown ----------------------------------------------------------------------
  const rowsH = input.price.rows.reduce((s, r) => s + wrap(r[0], CW * 0.7 - 24, !!r[2], 10).length * 14 + 3, 0);
  const noteLines = input.price.note ? wrap(input.price.note, CW - 28, false, 9) : [];
  const priceH = 18 + 22 + rowsH + 14 + 40 + (noteLines.length ? noteLines.length * 12 + 4 : 0) + 14;
  ensure(priceH);
  doc.setFillColor(...GREY_BG);
  doc.roundedRect(MX, y, CW, priceH, 6, 6, 'F');
  let py = y + 18;
  font(true, 9.5, DARK);
  lineAt(pdfSafe(input.price.title).toUpperCase(), MX + 14, py + 4);
  py += 22;
  input.price.rows.forEach(([label, value, bold]) => {
    const lines = wrap(label, CW * 0.7 - 24, !!bold, 10);
    font(!!bold, 10, bold ? DARK : MUTED);
    lines.forEach((l, i) => lineAt(l, MX + 14, py + 5 + i * 14));
    font(true, 10, DARK);
    lineAt(pdfSafe(value), MX + CW - 14, py + 5, 'right');
    py += lines.length * 14 + 3;
  });
  py += 8;
  doc.setDrawColor(...GOLD);
  doc.setLineWidth(1.6);
  doc.line(MX + 14, py, MX + CW - 14, py);
  py += 22;
  font(true, 13, DARK);
  lineAt(pdfSafe(input.price.totalLabel), MX + 14, py);
  font(true, 18, GOLD_TEXT);
  lineAt(pdfSafe(input.price.totalValue), MX + CW - 14, py, 'right');
  py += 22;
  if (noteLines.length) {
    font(false, 9, MUTED);
    noteLines.forEach((l, i) => lineAt(l, MX + 14, py + i * 12));
  }
  y += priceH + 14;

  // ---- Optional notice ----------------------------------------------------------------------
  if (input.notice) {
    const lines = wrap(input.notice, CW - 24, false, 10);
    const h = lines.length * 13 + 20;
    ensure(h);
    doc.setFillColor(...TINT);
    doc.setDrawColor(...TINT_LINE);
    doc.setLineWidth(0.75);
    doc.roundedRect(MX, y, CW, h, 6, 6, 'FD');
    font(false, 10, DARK);
    lines.forEach((l, i) => lineAt(l, MX + 12, y + 16 + i * 13));
    y += h;
  }

  return doc.output('dataurlstring');
}
