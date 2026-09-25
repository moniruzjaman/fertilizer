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
  const thumbSlot = opts.hasThumb
    ? `<rect x="742" y="168" width="404" height="368" rx="8" fill="${PALETTE.greenDeep}" stroke="${PALETTE.gold}" stroke-width="4"/>`
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
    <text x="64" y="86" fill="${PALETTE.gold}" font-size="22" font-family="CardBold" letter-spacing="4">MINISTRY OF AGRICULTURE</text>
    <text x="64" y="118" fill="${PALETTE.white}" font-size="16" font-family="CardBold" letter-spacing="3">BANGLADESH</text>
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
    const svg = Buffer.from(await cardSvg(page, { hasThumb: Boolean(options.thumbBuffer) }));
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
