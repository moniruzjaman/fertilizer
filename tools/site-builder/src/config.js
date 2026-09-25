import { existsSync } from "node:fs";
import { join, resolve } from "node:path";

export const DEFAULT_SITE_BASE = "https://moniruzjaman.github.io/fertilizer";
export const OG_WIDTH = 1200;
export const OG_HEIGHT = 630;

export function defaultRoot(cwd = process.cwd()) {
  if (existsSync(join(cwd, "content", "inbox"))) return cwd;
  const up2 = resolve(cwd, "../..");
  if (existsSync(join(up2, "content", "inbox"))) return up2;
  const up1 = resolve(cwd, "..");
  if (existsSync(join(up1, "content", "inbox"))) return up1;
  return cwd;
}

export function getConfig(options = {}) {
  const root = resolve(options.root || defaultRoot());
  return {
    root,
    siteBase: String(options.siteBase || process.env.SITE_BASE || DEFAULT_SITE_BASE).replace(/\/+$/, ""),
    inboxDir: options.inboxDir || join(root, "content", "inbox"),
    pagesDir: options.pagesDir || join(root, "content", "pages"),
    outDir: options.outDir || join(root, "site"),
    ogWidth: OG_WIDTH,
    ogHeight: OG_HEIGHT,
    skipScreenshots: options.skipScreenshots ?? process.env.SKIP_HTML_SCREENSHOT === "1",
    warnings: options.warnings || []
  };
}

export function pageUrl(config, slug) {
  return `${config.siteBase}/${slug}/`;
}

export function ogUrl(config, slug) {
  return `${config.siteBase}/${slug}/og.png`;
}

export function fileUrl(config, slug) {
  return `${config.siteBase}/files/${slug}.pdf`;
}

export function warn(config, message) {
  config.warnings.push(message);
  console.warn(`::warning::${message}`);
}
