import { cp, mkdir, readFile, rm, stat, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { classify } from "./classify.js";
import { warn } from "./config.js";
import { injectRichHtml, innerHtml } from "./inject.js";
import { extractHtmlMeta, extractPdfMeta, resolveMeta } from "./meta.js";
import { rasterPdfFirstPage, writeOgPng } from "./og.js";
import { readPdfMeta } from "./pdf-meta.js";
import { loadPageExtras, scanInbox, scanRedirects } from "./scan.js";
import { slugify, stem, uniqueSlug } from "./slug.js";
import {
  catalogHtml,
  fragmentPageHtml,
  notFoundHtml,
  pdfReaderHtml,
  readerJs,
  redirectHtml,
  robotsTxt,
  siteCss,
  sitemapXml
} from "./templates.js";

const here = dirname(fileURLToPath(import.meta.url));

// Legacy URLs that must keep working after the inbox-based redesign.
export const LEGACY_DASHBOARD_SLUG = "dashboard";
export const LEGACY_BRIEFING_SLUG = "briefing";
export const LEGACY_BRIEFING_FILE = "Fertilizer_Distribution_Reform_Report_Ministerial_Briefing.html";

async function copyFirstExisting(sources, dest) {
  for (const src of sources) {
    try {
      await cp(src, dest);
      return true;
    } catch {
      continue;
    }
  }
  return false;
}

async function dirExists(path) {
  try {
    return (await stat(path)).isDirectory();
  } catch {
    return false;
  }
}

async function copyPdfJs(outDir) {
  const dest = join(outDir, "assets", "pdfjs");
  await mkdir(dest, { recursive: true });
  const pkg = join(here, "..", "node_modules", "pdfjs-dist");
  await copyFirstExisting(
    [join(pkg, "build", "pdf.min.mjs"), join(pkg, "legacy", "build", "pdf.min.mjs"), join(pkg, "build", "pdf.mjs")],
    join(dest, "pdf.min.mjs")
  );
  await copyFirstExisting(
    [join(pkg, "build", "pdf.worker.min.mjs"), join(pkg, "legacy", "build", "pdf.worker.min.mjs"), join(pkg, "build", "pdf.worker.mjs")],
    join(dest, "pdf.worker.min.mjs")
  );
}

export async function collectPages(config) {
  const files = await scanInbox(config);

  // Pass 1: read content and resolve each file's *desired* slug (from its own
  // meta.yaml override or filename), without allocating final slugs yet.
  const drafts = [];
  for (const file of files) {
    const guessed = slugify(stem(file.filename));
    const extrasGuess = await loadPageExtras(config, guessed);
    const hasFolder = await dirExists(join(config.pagesDir, guessed));
    let html = "";
    let pdfMetaRaw = {};
    if (file.ext === ".html" || file.ext === ".htm") {
      html = await readFile(file.path, "utf8");
      if (!html.trim()) {
        warn(config, `Skipping empty HTML: ${file.filename}`);
        continue;
      }
    } else {
      pdfMetaRaw = await readPdfMeta(file.path);
    }
    const htmlMeta = html ? extractHtmlMeta(html) : {};
    const pdfMeta = {
      title: pdfMetaRaw.Title,
      description: pdfMetaRaw.Subject,
      date: undefined,
      heading: pdfMetaRaw.heading
    };
    if (pdfMetaRaw.CreationDate || pdfMetaRaw.ModDate) {
      const parsed = extractPdfMeta({ info: pdfMetaRaw });
      pdfMeta.date = parsed.date;
    }
    const resolved = resolveMeta({
      filename: file.filename,
      yamlMeta: extrasGuess.meta,
      htmlMeta,
      pdfMeta
    });
    drafts.push({
      file, guessed, hasFolder, extrasGuess, html, pdfMetaRaw, htmlMeta, pdfMeta,
      slugOverride: resolved.slugOverride,
      desired: slugify(resolved.slugOverride || guessed)
    });
  }

  // Pass 2: reserve explicit meta.yaml slugs first so an authored override
  // always wins over a filename-derived slug on collision — regardless of
  // which draft declared it or how the files sort alphabetically. When two
  // drafts claim the same target, the one whose folder already exists wins.
  const reserved = new Map(); // desired slug -> draft that owns it
  const used = new Set();
  for (const draft of drafts) {
    if (!draft.slugOverride) continue;
    const current = reserved.get(draft.desired);
    if (!current) {
      reserved.set(draft.desired, draft);
      used.add(draft.desired);
    } else if (!current.hasFolder && draft.hasFolder) {
      reserved.set(draft.desired, draft);
    }
  }

  // Pass 3: allocate final slugs in deterministic order and build pages.
  const pages = [];
  for (const draft of drafts) {
    const { file, guessed, extrasGuess, html, pdfMetaRaw, htmlMeta, pdfMeta } = draft;
    let slug;
    if (used.has(draft.desired) && reserved.get(draft.desired) !== draft) {
      warn(config, `Slug collision for ${file.filename}; using suffix`);
      slug = uniqueSlug(draft.desired, used);
    } else {
      slug = draft.desired;
      used.add(slug);
      if (!reserved.has(slug)) reserved.set(slug, draft);
    }
    // Only re-resolve against a different folder's meta.yaml when the suffixing
    // actually landed on an existing page directory; otherwise keep the guess.
    const extras = (slug !== guessed && (await dirExists(join(config.pagesDir, slug))))
      ? await loadPageExtras(config, slug)
      : extrasGuess;
    const yamlMeta = extras.meta && Object.keys(extras.meta).length ? extras.meta : extrasGuess.meta;
    const finalMeta = resolveMeta({
      filename: file.filename,
      yamlMeta,
      htmlMeta,
      pdfMeta
    });
    const type = classify(file.filename, html, finalMeta.typeOverride);
    pages.push({
      filename: file.filename,
      path: file.path,
      slug,
      type,
      title: finalMeta.title,
      description: finalMeta.description,
      date: finalMeta.date,
      noindex: finalMeta.noindex,
      html,
      extras,
      corruptPdf: Boolean(pdfMetaRaw.corrupt)
    });
  }
  return pages;
}

export async function emitSite(config, pages) {
  await mkdir(config.outDir, { recursive: true });
  await mkdir(join(config.outDir, "assets"), { recursive: true });
  await mkdir(join(config.outDir, "files"), { recursive: true });
  await writeFile(join(config.outDir, "assets", "site.css"), siteCss());
  await writeFile(join(config.outDir, "assets", "reader.js"), readerJs());
  await copyPdfJs(config.outDir);

  for (const page of pages) {
    const dir = join(config.outDir, page.slug);
    await mkdir(dir, { recursive: true });
    let htmlOut = "";
    let thumb = null;
    if (page.type === "pdf") {
      await cp(page.path, join(config.outDir, "files", `${page.slug}.pdf`));
      htmlOut = pdfReaderHtml(page, pages, config);
      thumb = await rasterPdfFirstPage(page.path);
    } else if (page.type === "rich-html") {
      htmlOut = injectRichHtml(page.html, page, pages, config);
      if (!htmlOut) {
        warn(config, `Rich HTML for ${page.filename} had no <html>; wrapping as fragment`);
        htmlOut = fragmentPageHtml(page, pages, config, innerHtml(page.html));
      }
    } else {
      htmlOut = fragmentPageHtml(page, pages, config, innerHtml(page.html));
    }
    await writeFile(join(dir, "index.html"), htmlOut);
    await writeOgPng(join(dir, "og.png"), page, config, {
      overridePath: page.extras.ogPath,
      thumbBuffer: thumb
    });
  }

  // Legacy entry points kept alive via meta-refresh redirects so old links keep working.
  const legacyRedirects = [
    ["fertilizer.html", "./", "Fertilizer"],
    ["dashboard.html", `./${LEGACY_DASHBOARD_SLUG}/`, "Dashboard"],
    [LEGACY_BRIEFING_FILE, `./${LEGACY_BRIEFING_SLUG}/`, "Briefing"]
  ];
  const redirectTargets = new Set(legacyRedirects.map(([file]) => file));
  for (const [file, to, label] of legacyRedirects) {
    await writeFile(join(config.outDir, file), redirectHtml(to, label));
  }
  await writeFile(join(config.outDir, "index.html"), catalogHtml(pages, config));
  await writeFile(join(config.outDir, "404.html"), notFoundHtml(pages, config));
  await writeFile(join(config.outDir, "sitemap.xml"), sitemapXml(pages, config));
  await writeFile(join(config.outDir, "robots.txt"), robotsTxt(config));

  const redirects = await scanRedirects(config);
  for (const redir of redirects) {
    if (pages.some((p) => p.slug === redir.from)) continue;
    if (redirectTargets.has(`${redir.from}.html`)) {
      warn(config, `Redirect page "${redir.from}" collides with a legacy redirect target; skipping`);
      continue;
    }
    const dest = `../${redir.to}/`;
    await mkdir(join(config.outDir, redir.from), { recursive: true });
    await writeFile(join(config.outDir, redir.from, "index.html"), redirectHtml(dest, "Redirecting"));
  }

  return {
    added: pages.map((p) => p.slug),
    warnings: config.warnings
  };
}

export async function build(config) {
  try {
    await rm(config.outDir, { recursive: true, force: true });
  } catch {
    /* ignore */
  }
  const pages = await collectPages(config);
  const summary = await emitSite(config, pages);
  console.log(`Built ${pages.length} pages: ${summary.added.join(", ") || "(none)"}`);
  if (config.warnings.length) {
    console.log(`Warnings: ${config.warnings.length}`);
    for (const w of config.warnings) console.log(` - ${w}`);
  }
  return { pages, summary };
}
