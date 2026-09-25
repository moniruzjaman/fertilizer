import { mkdir } from "node:fs/promises";
import { dirname } from "node:path";
import sharp from "sharp";
import { OG_HEIGHT, OG_WIDTH, warn } from "./config.js";

function escapeXml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function wrapTitle(title, maxChars = 42, maxLines = 3) {
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
  if (/dashboard/i.test(page.slug) || /dashboard/i.test(page.title)) return "Dashboard";
  if (page.type === "rich-html") return "Report";
  return "Note";
}

function cardSvg(page, opts = {}) {
  const lines = wrapTitle(page.title);
  const text = lines
    .map((line, i) => `<tspan x="56" dy="${i === 0 ? 0 : 48}">${escapeXml(line)}</tspan>`)
    .join("");
  const thumb = opts.hasThumb
    ? `<rect x="720" y="150" width="430" height="400" rx="12" fill="#004230"/>`
    : "";
  return `<svg width="${OG_WIDTH}" height="${OG_HEIGHT}" xmlns="http://www.w3.org/2000/svg">
    <rect width="100%" height="100%" fill="#0b3d32"/>
    <rect width="100%" height="18" fill="#006A4E"/>
    <rect y="18" width="100%" height="8" fill="#F42A41"/>
    <rect x="0" y="26" width="16" height="604" fill="#C5A028"/>
    <text x="56" y="72" fill="#eac96a" font-size="18" font-family="Georgia, serif" letter-spacing="3">MINISTRY OF AGRICULTURE</text>
    <rect x="56" y="96" width="120" height="28" rx="14" fill="#006A4E"/>
    <text x="116" y="116" text-anchor="middle" fill="#fff" font-size="14" font-family="system-ui,sans-serif">${escapeXml(badgeFor(page))}</text>
    <text x="56" y="180" fill="#ffffff" font-size="40" font-family="Georgia, serif">${text}</text>
    <text x="56" y="580" fill="#cfe7dc" font-size="18" font-family="system-ui,sans-serif">Burden to Bloom</text>
    ${thumb}
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
    const svg = Buffer.from(cardSvg(page, { hasThumb: Boolean(options.thumbBuffer) }));
    const base = sharp(svg).png();
    if (options.thumbBuffer) {
      const thumb = await sharp(options.thumbBuffer)
        .resize(430, 400, { fit: "contain", background: "#004230" })
        .png()
        .toBuffer();
      await sharp(await base.toBuffer())
        .composite([{ input: thumb, left: 720, top: 150 }])
        .png()
        .toFile(outPath);
      return "composited";
    }
    await base.toFile(outPath);
    return "title-card";
  } catch {
    warn(config, `OG generation failed for ${page.slug}; writing title-only fallback`);
    const fallback = Buffer.from(cardSvg(page));
    await sharp(fallback).png().toFile(outPath);
    return "fallback";
  }
}

export async function rasterPdfFirstPage(pdfPath) {
  const { spawn } = await import("node:child_process");
  const { mkdtemp, readFile } = await import("node:fs/promises");
  const { tmpdir } = await import("node:os");
  const { join } = await import("node:path");
  const dir = await mkdtemp(join(tmpdir(), "pdf-og-"));
  const prefix = join(dir, "page");
  const code = await new Promise((resolve) => {
    const child = spawn("pdftoppm", ["-png", "-f", "1", "-l", "1", "-r", "72", pdfPath, prefix], {
      stdio: "ignore"
    });
    child.on("error", () => resolve(1));
    child.on("close", (c) => resolve(c ?? 1));
  });
  if (code !== 0) return null;
  try {
    return await readFile(`${prefix}-1.png`);
  } catch {
    return null;
  }
}
