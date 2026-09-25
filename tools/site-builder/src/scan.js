import { readdir, readFile, stat } from "node:fs/promises";
import { join } from "node:path";
import yaml from "js-yaml";
import { isAllowedInboxFile } from "./classify.js";
import { warn } from "./config.js";

export async function scanInbox(config) {
  const entries = await readdir(config.inboxDir, { withFileTypes: true });
  const files = [];
  for (const entry of entries.sort((a, b) => a.name.localeCompare(b.name, "en"))) {
    const full = join(config.inboxDir, entry.name);
    if (entry.isDirectory()) {
      warn(config, `Skipping inbox subdirectory: ${entry.name}`);
      continue;
    }
    if (!isAllowedInboxFile(entry.name)) continue;
    const info = await stat(full);
    if (info.size === 0 && /\.html?$/i.test(entry.name)) {
      warn(config, `Skipping empty HTML: ${entry.name}`);
      continue;
    }
    files.push({
      filename: entry.name,
      path: full,
      ext: `.${entry.name.split(".").pop().toLowerCase()}`
    });
  }
  return files;
}

export async function loadPageExtras(config, slug) {
  const dir = join(config.pagesDir, slug);
  const extras = { meta: {}, ogPath: null, redirect: null };
  try {
    const entries = await readdir(dir, { withFileTypes: true });
    for (const entry of entries) {
      if (!entry.isFile()) continue;
      const full = join(dir, entry.name);
      if (entry.name === "meta.yaml" || entry.name === "meta.yml") {
        const raw = await readFile(full, "utf8");
        extras.meta = yaml.load(raw) || {};
      } else if (entry.name === "redirect.yaml" || entry.name === "redirect.yml") {
        extras.redirect = yaml.load(await readFile(full, "utf8")) || null;
      } else if (entry.name === "og.png") {
        extras.ogPath = full;
      }
    }
  } catch (err) {
    if (err.code !== "ENOENT") throw err;
  }
  return extras;
}

export async function scanRedirects(config) {
  let dirs = [];
  try {
    dirs = await readdir(config.pagesDir, { withFileTypes: true });
  } catch (err) {
    if (err.code === "ENOENT") return [];
    throw err;
  }
  const redirects = [];
  for (const entry of dirs) {
    if (!entry.isDirectory()) continue;
    const extras = await loadPageExtras(config, entry.name);
    if (extras.redirect && extras.redirect.to) {
      redirects.push({ from: entry.name, to: String(extras.redirect.to) });
    }
  }
  return redirects;
}
