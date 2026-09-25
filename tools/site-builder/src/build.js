import { cp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
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

async function copyPdfJs(outDir) {
  const dest = join(outDir, "assets", "pdfjs");
  await mkdir(dest, { recursive: true });
  const candidates = [
    join(here, "../node_modules/pdfjs-dist/build/pdf.min.mjs"),
    join(here, "../node_modules/pdfjs-dist/legacy/build/pdf.min.mjs"),
    join(here, "../node_modules/pdfjs-dist/build/pdf.mjs")
  ];
  const workers = [
    join(here, "../node_modules/pdfjs-dist/build/pdf.worker.min.mjs"),
    join(here, "../node_modules/pdfjs-dist/legacy/build/pdf.worker.min.mjs"),
    join(here, "../node_modules/pdfjs-dist/build/pdf.worker.mjs")
  ];
  for (const src of candidates) {
    try {
      await cp(src, join(dest, "pdf.min.mjs"));
      break;
    } catch {
      continue;
    }
  }
  for (const src of workers) {
    try {
      await cp(src, join(dest, "pdf.worker.min.mjs"));
      break;
    } catch {
      continue;
    }
  }
}

export async function collectPages(config) {
  const files = await scanInbox(config);
  const used = new Set();
  const pages = [];
  for (const file of files) {
    const guessed = slugify(stem(file.filename));
    const extrasGuess = await loadPageExtras(config, guessed);
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
    const desired = slugify(resolved.slugOverride || guessed);
    if (used.has(desired)) {
      warn(config, `Slug collision for ${file.filename}; using suffix`);
    }
    const slug = uniqueSlug(desired, used);
    const extras = slug === guessed ? extrasGuess : await loadPageExtras(config, slug);
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

  await writeFile(join(config.outDir, "index.html"), catalogHtml(pages, config));
  await writeFile(join(config.outDir, "404.html"), notFoundHtml(pages, config));
  await writeFile(join(config.outDir, "fertilizer.html"), redirectHtml("./", "Fertilizer"));
  await writeFile(join(config.outDir, "dashboard.html"), redirectHtml("./dashboard/", "Dashboard"));
  await writeFile(
    join(config.outDir, "Fertilizer_Distribution_Reform_Report_Ministerial_Briefing.html"),
    redirectHtml("./briefing/", "Briefing")
  );
  await writeFile(join(config.outDir, "sitemap.xml"), sitemapXml(pages, config));
  await writeFile(join(config.outDir, "robots.txt"), robotsTxt(config));

  const redirects = await scanRedirects(config);
  for (const redir of redirects) {
    if (pages.some((p) => p.slug === redir.from)) continue;
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
