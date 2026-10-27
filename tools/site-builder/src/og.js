import { mkdir, readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";
import { OG_HEIGHT, OG_WIDTH, warn } from "./config.js";

const here = dirname(fileURLToPath(import.meta.url));
const BOLD_FONT = join(here, "../assets/fonts/DejaVuSans-Bold.ttf");
const REG_FONT = join(here, "../assets/fonts/DejaVuSans.ttf");

export const PALETTE = {
  green: "#006A4E",
  greenDeep: "#004D38",
  red: "#F42A41",
  gold: "#F9D342",
  goldDeep: "#C99B17",
  white: "#FFFFFF"
};

function escapeXml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function wrapTitle(title, maxChars = 28, maxLines = 3) {
  const words = String(title || "Page").split(/\s+/);
  const lines = [];
  let line = "";
  for (const word of words) {
    const next = line ? `${line} ${word}` : word;
    if (next.length > maxChars && line) {
      lines.push(line);
      line = word;
      if (lines.length === maxLines) break;
    } else {
      line = next;
    }
  }
  if (lines.length < maxLines && line) lines.push(line);
  if (lines.length === maxLines && words.join(" ").length > lines.join(" ").length) {
    lines[maxLines - 1] = `${lines[maxLines - 1].replace(/…$/, "").slice(0, maxChars - 1)}…`;
  }
  return lines;
}

// Deterministic, dependency-free QR matrix encoder (byte mode, versions 1-7,
// error-correction level M). Level M gives real-world scanners robustness on
// compressed social previews; capacity covers our absolute page URLs.
// Codeword tables below are the ISO/IEC 18004 Annex A single-block M values.
const GF_EXP = new Uint8Array(512);
const GF_LOG = new Uint8Array(256);
(() => {
  let x = 1;
  for (let i = 0; i < 255; i++) {
    GF_EXP[i] = x;
    GF_LOG[x] = i;
    x <<= 1;
    if (x & 0x100) x ^= 0x11d;
  }
  for (let i = 255; i < 512; i++) GF_EXP[i] = GF_EXP[i - 255];
})();
const gfMul = (a, b) => (a === 0 || b === 0 ? 0 : GF_EXP[GF_LOG[a] + GF_LOG[b]]);

function rsGenerator(degree) {
  let poly = [1];
  for (let i = 0; i < degree; i++) {
    const next = new Array(poly.length + 1).fill(0);
    for (let j = 0; j < poly.length; j++) {
      next[j] ^= gfMul(poly[j], GF_EXP[i]);
      next[j + 1] ^= poly[j];
    }
    poly = next;
  }
  return poly;
}

function rsEncode(data, ecLen) {
  const gen = rsGenerator(ecLen);
  const res = new Array(ecLen).fill(0);
  for (const byte of data) {
    const factor = byte ^ res[0];
    res.shift();
    res.push(0);
    for (let i = 0; i < ecLen; i++) res[i] ^= gfMul(gen[i + 1], factor);
  }
  return res;
}

// Single-block level-M parameters: total codewords, data codewords, EC length.
const QR_VARIANTS = [
  { ver: 1, size: 21, totalData: 16, ecLen: 10, align: [] },
  { ver: 2, size: 25, totalData: 28, ecLen: 16, align: [6, 18] },
  { ver: 3, size: 29, totalData: 44, ecLen: 26, align: [6, 22] },
  { ver: 4, size: 33, totalData: 64, ecLen: 18, align: [6, 26] },
  { ver: 5, size: 37, totalData: 86, ecLen: 26, align: [6, 30] },
  { ver: 6, size: 41, totalData: 108, ecLen: 18, align: [6, 34] },
  { ver: 7, size: 45, totalData: 124, ecLen: 24, align: [6, 22, 38] }
];
// Level-M format information bits (BCH 15,5 over EC-indicator 00 + mask, ^ 0x5412).
const FORMAT_BITS_M = {
  0: 0b101010000010010, 1: 0b101000100100101, 2: 0b101111001111100,
  3: 0b101101101001011, 4: 0b100011001101110, 5: 0b100001101011001,
  6: 0b100110000000000, 7: 0b100100100110111
};

function qrMatrix(text) {
  const bytes = Array.from(Buffer.from(String(text), "utf8"));
  const variant = QR_VARIANTS.find((v) => v.totalData - v.ecLen >= bytes.length + 3);
  if (!variant) return null;
  const { size, totalData, ecLen } = variant;

  // Bit stream: mode indicator (byte), char count, payload, terminator/pad.
  const bits = [];
  const push = (value, len) => {
    for (let i = len - 1; i >= 0; i--) bits.push((value >> i) & 1);
  };
  push(0b0100, 4);
  push(bytes.length, variant.ver <= 9 ? 8 : 16);
  for (const b of bytes) push(b, 8);
  push(0, Math.min(4, totalData * 8 - bits.length));
  while (bits.length % 8 !== 0) bits.push(0);
  const dataWords = [];
  for (let i = 0; i < bits.length; i += 8) {
    let v = 0;
    for (let j = 0; j < 8; j++) v = (v << 1) | bits[i + j];
    dataWords.push(v);
  }
  const pads = [0xec, 0x11];
  for (let i = dataWords.length; i < totalData - ecLen; i++) {
    dataWords.push(pads[(i - bits.length / 8) % 2]);
  }
  const allCodewords = [...dataWords, ...rsEncode(dataWords.slice(0, totalData - ecLen), ecLen)];

  // Module grid: -1 empty, 0 light, 1 dark; reserved tracks function modules.
  const m = Array.from({ length: size }, () => new Array(size).fill(-1));
  const reserved = Array.from({ length: size }, () => new Array(size).fill(false));
  const setFn = (r, c, v) => { m[r][c] = v; reserved[r][c] = true; };

  const finder = (r, c) => {
    for (let dr = -1; dr <= 7; dr++) {
      for (let dc = -1; dc <= 7; dc++) {
        const rr = r + dr, cc = c + dc;
        if (rr < 0 || cc < 0 || rr >= size || cc >= size) continue;
        const inner = dr >= 0 && dr <= 6 && dc >= 0 && dc <= 6;
        const ring = inner && (dr === 0 || dr === 6 || dc === 0 || dc === 6);
        const core = dr >= 2 && dr <= 4 && dc >= 2 && dc <= 4;
        setFn(rr, cc, ring || core ? 1 : 0);
      }
    }
  };
  finder(0, 0);
  finder(0, size - 7);
  finder(size - 7, 0);
  for (let i = 8; i < size - 8; i++) {
    setFn(6, i, i % 2 === 0 ? 1 : 0);
    setFn(i, 6, i % 2 === 0 ? 1 : 0);
  }
  setFn(size - 8, 8, 1); // dark module
  for (let dr = -2; dr <= 2; dr++) {
    for (let dc = -2; dc <= 2; dc++) {
      const rr = size - 7 + dr, cc = 6 + dc;
      setFn(rr, cc, (Math.max(Math.abs(dr), Math.abs(dc)) !== 1) ? 1 : 0);
    }
  }
  const alignPos = variant.align;
  for (const ar of alignPos) {
    for (const ac of alignPos) {
      if (reserved[ar][ac]) continue;
      for (let dr = -2; dr <= 2; dr++) {
        for (let dc = -2; dc <= 2; dc++) {
          const ring = Math.max(Math.abs(dr), Math.abs(dc));
          setFn(ar + dr, ac + dc, ring === 1 ? 0 : 1);
        }
      }
    }
  }

  // Reserve format-information areas (values written after masking).
  for (let i = 0; i <= 8; i++) {
    if (i !== 6) { reserved[8][i] = true; reserved[i][8] = true; }
  }
  for (let i = 0; i < 8; i++) {
    reserved[8][size - 1 - i] = true;
    reserved[size - 1 - i][8] = true;
  }

  // Zigzag data placement (up columns skipping the timing column).
  let bitIdx = 0;
  const upMask = (row, col) => (row + col) % 2 === 0;
  for (let right = size - 1; right >= 1; right -= 2) {
    const colPair = right === 6 ? [right - 1, right] : [right, right - 1];
    for (let vert = 0; vert < size; vert++) {
      for (const col of colPair) {
        const row = vert % 2 === 0 ? size - 1 - vert : vert;
        if (reserved[row][col]) continue;
        const cw = allCodewords[Math.floor(bitIdx / 8)];
        const bit = (cw >> (7 - (bitIdx % 8))) & 1;
        m[row][col] = bit ^ (upMask(row, col) ? 1 : 0);
        bitIdx++;
      }
    }
  }

  // Mask pattern 0 ((r + c) % 2 === 0) applied to data modules only.
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (!reserved[r][c] && (r + c) % 2 === 0) m[r][c] ^= 1;
    }
  }

  // Format info (level M, mask 0): bit 14 = MSB, laid out per spec.
  const fmt = FORMAT_BITS_M[0];
  const get = (k) => (fmt >> k) & 1;
  for (let i = 0; i <= 5; i++) m[8][i] = get(14 - i);
  m[8][7] = get(8);
  m[8][8] = get(7);
  m[7][8] = get(6);
  for (let i = 9; i <= 14; i++) m[14 - i][8] = get(i);
  for (let i = 0; i < 8; i++) m[size - 1 - i][8] = get(i);
  for (let i = 8; i < 15; i++) m[8][size - 15 + i] = get(i);

  return m;
}

// Clean golden paddy spray for the card's top-left badge: a dark medallion
// holding an arched, drooping panicle with alternating two-tone grains.
function paddyEmblem(cx, cy, r) {
  const parts = [];
  // Medallion backdrop so the gold reads clearly on the green field.
  parts.push(`<circle cx="${cx}" cy="${cy}" r="${r}" fill="${PALETTE.greenDeep}"/>`);
  parts.push(`<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${PALETTE.gold}" stroke-width="${(r * 0.09).toFixed(2)}"/>`);

  const px = (t) => cx + r * (-0.5 + 1.18 * t);
  const py = (t) => cy + r * (0.46 - 1.32 * Math.sin(Math.PI * t));
  // Curved stalk from lower-left to upper-right.
  parts.push(
    `<path d="M${px(0).toFixed(2)} ${py(0).toFixed(2)} C ${px(0.33).toFixed(2)} ${py(0.33).toFixed(2)}, ` +
    `${px(0.66).toFixed(2)} ${py(0.66).toFixed(2)}, ${px(1).toFixed(2)} ${py(1).toFixed(2)}" ` +
    `stroke="${PALETTE.gold}" stroke-width="${(r * 0.085).toFixed(2)}" fill="none" stroke-linecap="round"/>`
  );

  const grain = (gx, gy, rot, hl) =>
    `<g transform="translate(${gx.toFixed(2)} ${gy.toFixed(2)}) rotate(${rot.toFixed(1)})">` +
    `<ellipse rx="${(r * 0.135).toFixed(2)}" ry="${(r * 0.225).toFixed(2)}" fill="${PALETTE.gold}"/>` +
    `<line x1="0" y1="${(-r * 0.225).toFixed(2)}" x2="0" y2="${(-r * 0.37).toFixed(2)}" stroke="${PALETTE.gold}" stroke-width="${(r * 0.045).toFixed(2)}" stroke-linecap="round"/>` +
    (hl ? `<ellipse cx="${(-r * 0.035).toFixed(2)}" cy="${(-r * 0.05).toFixed(2)}" rx="${(r * 0.045).toFixed(2)}" ry="${(r * 0.095).toFixed(2)}" fill="#FFFBEA"/>` : "") +
    `</g>`;

  // Paired grains hanging along the arch, tilted outward from the stalk.
  const ts = [0.12, 0.3, 0.48, 0.66, 0.84];
  ts.forEach((t, i) => {
    const roll = (i % 2 === 0 ? 1 : -1) * 14;
    const bx = px(t), by = py(t);
    parts.push(grain(bx - r * 0.16, by + r * 0.24, -30 + roll, i % 2 === 0));
    parts.push(grain(bx + r * 0.16, by + r * 0.24, 30 + roll, i % 2 === 1));
  });
  // Tip grain crowning the panicle.
  parts.push(grain(px(0.97), py(0.97) - r * 0.02, 4, true));
  return `<g>${parts.join("")}</g>`;
}

function qrSvg(text, px, x, y) {
  const m = qrMatrix(text);
  if (!m) return "";
  const n = m.length;
  const q = 2; // quiet-zone modules
  const cell = px / (n + q * 2);
  let rects = "";
  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      if (m[r][c] === 1) {
        rects += `<rect x="${(x + (c + q) * cell).toFixed(2)}" y="${(y + ((r + q) * cell)).toFixed(2)}" width="${(cell + 0.25).toFixed(2)}" height="${(cell + 0.25).toFixed(2)}"/>`;
      }
    }
  }
  return `<g fill="${PALETTE.greenDeep}">${rects}</g>`;
}

// Shorten a URL for the caption under the QR without losing readability.
function urlCaption(url, max = 46) {
  const s = String(url || "").replace(/^https?:\/\//, "").replace(/\/$/, "");
  return s.length > max ? `${s.slice(0, max - 1)}…` : s;
}

function badgeFor(page) {
  if (page.type === "pdf") return "PDF";
  if (/dashboard/i.test(page.slug) || /dashboard/i.test(page.title)) return "DASHBOARD";
  if (page.type === "rich-html") return "REPORT";
  return "NOTE";
}

async function fontFaces() {
  const bold = (await readFile(BOLD_FONT)).toString("base64");
  const regular = (await readFile(REG_FONT)).toString("base64");
  return `<defs>
    <style>
      @font-face { font-family: "CardBold"; src: url("data:font/ttf;base64,${bold}") format("truetype"); font-weight: 700; }
      @font-face { font-family: "CardReg"; src: url("data:font/ttf;base64,${regular}") format("truetype"); font-weight: 400; }
    </style>
  </defs>`;
}

async function cardSvg(page, opts = {}) {
  const lines = wrapTitle(page.title);
  const titleStart = 210;
  const text = lines
    .map((line, i) => `<tspan x="64" dy="${i === 0 ? 0 : 58}">${escapeXml(line)}</tspan>`)
    .join("");
  // QR of the page URL turns the blank right slot into a scannable deep link.
  const qrMatrixOfUrl = opts.qrUrl ? qrMatrix(opts.qrUrl) : null;
  const thumbSlot = opts.hasThumb
    ? `<rect x="742" y="168" width="404" height="368" rx="8" fill="${PALETTE.greenDeep}" stroke="${PALETTE.gold}" stroke-width="4"/>`
    : qrMatrixOfUrl
      ? `<rect x="742" y="168" width="404" height="368" rx="8" fill="${PALETTE.white}" stroke="${PALETTE.gold}" stroke-width="4"/>` +
        qrSvg(opts.qrUrl, 296, 796, 192) +
        `<text x="944" y="516" text-anchor="middle" fill="${PALETTE.greenDeep}" font-size="18" font-family="CardBold" letter-spacing="2">SCAN TO OPEN PAGE</text>` +
        `<text x="944" y="542" text-anchor="middle" fill="${PALETTE.green}" font-size="15" font-family="CardReg">${escapeXml(urlCaption(opts.qrUrl))}</text>`
      : `<circle cx="944" cy="352" r="92" fill="${PALETTE.red}" stroke="${PALETTE.gold}" stroke-width="6"/>
       <circle cx="944" cy="352" r="54" fill="none" stroke="${PALETTE.white}" stroke-width="3" stroke-dasharray="8 7"/>`;
  const faces = await fontFaces();
  return `<svg width="${OG_WIDTH}" height="${OG_HEIGHT}" xmlns="http://www.w3.org/2000/svg">
    ${faces}
    <rect width="100%" height="100%" fill="${PALETTE.green}"/>
    <rect width="100%" height="22" fill="${PALETTE.greenDeep}"/>
    <rect y="22" width="100%" height="10" fill="${PALETTE.red}"/>
    <rect y="608" width="100%" height="22" fill="${PALETTE.gold}"/>
    <rect x="0" y="32" width="18" height="576" fill="${PALETTE.gold}"/>
    <rect x="1182" y="32" width="18" height="576" fill="${PALETTE.red}"/>
    ${paddyEmblem(94, 84, 44)}
    <text x="158" y="78" fill="${PALETTE.gold}" font-size="22" font-family="CardBold" letter-spacing="4">MINISTRY OF AGRICULTURE</text>
    <text x="158" y="110" fill="${PALETTE.white}" font-size="16" font-family="CardBold" letter-spacing="3">BANGLADESH</text>
    <rect x="64" y="142" width="168" height="36" rx="6" fill="${PALETTE.red}"/>
    <text x="148" y="167" text-anchor="middle" fill="${PALETTE.white}" font-size="16" font-family="CardBold" letter-spacing="2">${escapeXml(badgeFor(page))}</text>
    <text x="64" y="${titleStart}" fill="${PALETTE.white}" font-size="48" font-family="CardBold">${text}</text>
    <text x="64" y="572" fill="${PALETTE.gold}" font-size="22" font-family="CardBold" letter-spacing="2">BURDEN TO BLOOM</text>
    ${thumbSlot}
  </svg>`;
}

export async function writeOgPng(outPath, page, config, options = {}) {
  await mkdir(dirname(outPath), { recursive: true });
  if (options.overridePath) {
    try {
      await sharp(options.overridePath)
        .resize(OG_WIDTH, OG_HEIGHT, { fit: "cover" })
        .png()
        .toFile(outPath);
      return "override";
    } catch {
      warn(config, `Ignoring unreadable OG override for ${page.slug}`);
    }
  }

  try {
    const svg = Buffer.from(await cardSvg(page, { hasThumb: Boolean(options.thumbBuffer), qrUrl: options.qrUrl }));
    if (options.thumbBuffer) {
      const thumb = await sharp(options.thumbBuffer)
        .resize(388, 352, { fit: "contain", background: PALETTE.greenDeep })
        .png()
        .toBuffer();
      await sharp(svg)
        .composite([{ input: thumb, left: 750, top: 176 }])
        .png()
        .toFile(outPath);
      return "composited";
    }
    await sharp(svg).png().toFile(outPath);
    return "title-card";
  } catch {
    warn(config, `OG generation failed for ${page.slug}; writing title-only fallback`);
    const fallback = Buffer.from(await cardSvg(page));
    await sharp(fallback).png().toFile(outPath);
    return "fallback";
  }
}

export async function rasterPdfFirstPage(pdfPath) {
  const { spawn } = await import("node:child_process");
  const { mkdtemp, readFile: readTmp } = await import("node:fs/promises");
  const { tmpdir } = await import("node:os");
  const { join: joinPath } = await import("node:path");
  const dir = await mkdtemp(joinPath(tmpdir(), "pdf-og-"));
  const prefix = joinPath(dir, "page");
  const code = await new Promise((resolve) => {
    const child = spawn("pdftoppm", ["-png", "-f", "1", "-l", "1", "-r", "72", pdfPath, prefix], {
      stdio: "ignore"
    });
    child.on("error", () => resolve(1));
    child.on("close", (c) => resolve(c ?? 1));
  });
  if (code !== 0) return null;
  try {
    return await readTmp(`${prefix}-1.png`);
  } catch {
    return null;
  }
}
