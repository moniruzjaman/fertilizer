import { jsonLd } from "./meta.js";

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function seoTags(page, config) {
  const url = `${config.siteBase}/${page.slug}/`;
  const image = `${config.siteBase}/${page.slug}/og.png`;
  const desc = page.description || page.title;
  const robots = page.noindex ? "noindex,nofollow" : "index,follow";
  const ld = JSON.stringify(jsonLd(page, config));
  return [
    `<meta name="description" content="${escapeHtml(desc)}">`,
    `<meta name="robots" content="${robots}">`,
    `<link rel="canonical" href="${escapeHtml(url)}">`,
    `<meta property="og:type" content="website">`,
    `<meta property="og:title" content="${escapeHtml(page.title)}">`,
    `<meta property="og:description" content="${escapeHtml(desc)}">`,
    `<meta property="og:url" content="${escapeHtml(url)}">`,
    `<meta property="og:image" content="${escapeHtml(image)}">`,
    `<meta property="og:image:width" content="1200">`,
    `<meta property="og:image:height" content="630">`,
    `<meta name="twitter:card" content="summary_large_image">`,
    `<meta name="twitter:title" content="${escapeHtml(page.title)}">`,
    `<meta name="twitter:description" content="${escapeHtml(desc)}">`,
    `<meta name="twitter:image" content="${escapeHtml(image)}">`,
    `<script type="application/ld+json">${ld}</script>`
  ].join("\n");
}

export function hrefTo(fromSlug, toSlug) {
  if (!fromSlug) return toSlug ? `${toSlug}/` : "./";
  if (!toSlug) return "../";
  return `../${toSlug}/`;
}

export function assetHref(fromSlug, file) {
  return fromSlug ? `../assets/${file}` : `assets/${file}`;
}

export function slimNav(pages, config, currentSlug) {
  const home = hrefTo(currentSlug, "");
  const links = [
    `<a href="${home}">Home</a>`,
    ...pages.map((p) => {
      const href = hrefTo(currentSlug, p.slug);
      const cls = p.slug === currentSlug ? " class=\"is-current\"" : "";
      return `<a href="${href}"${cls}>${escapeHtml(p.title)}</a>`;
    })
  ].join("");
  return `<nav class="site-slim-nav" aria-label="Site"><a class="site-slim-brand" href="${home}">Fertilizer</a><div class="site-slim-links">${links}</div></nav>
<style>
.site-slim-nav{position:sticky;top:0;z-index:2147483000;display:flex;gap:16px;align-items:center;justify-content:space-between;padding:10px 18px;background:#006A4E;color:#fff;font:600 14px/1.3 system-ui,sans-serif;box-shadow:0 2px 10px rgba(0,0,0,.18)}
.site-slim-nav a{color:#fff;text-decoration:none;opacity:.92}
.site-slim-brand{letter-spacing:.04em;text-transform:uppercase;font-size:12px}
.site-slim-links{display:flex;gap:14px;flex-wrap:wrap;justify-content:flex-end}
.site-slim-nav a.is-current{color:#eac96a}
</style>`;
}

export function catalogHtml(pages, config) {
  const cards = pages.map((p) => {
    const href = hrefTo("", p.slug);
    const img = `${p.slug}/og.png`;
    const badge = p.type === "pdf" ? "PDF" : p.type === "rich-html" ? "Page" : "Note";
    return `<a class="card" href="${href}">
      <img src="${img}" alt="" width="1200" height="630">
      <div class="body">
        <span class="badge">${badge}</span>
        <h2>${escapeHtml(p.title)}</h2>
        <p>${escapeHtml(p.description || "")}</p>
        ${p.date ? `<time datetime="${escapeHtml(p.date)}">${escapeHtml(p.date)}</time>` : ""}
      </div>
    </a>`;
  }).join("\n");
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Fertilizer Management — Documents</title>
<meta name="description" content="Ministry of Agriculture, Bangladesh — fertilizer reform documents and dashboards.">
<link rel="canonical" href="${config.siteBase}/">
<meta property="og:type" content="website">
<meta property="og:title" content="Fertilizer Management — Documents">
<meta property="og:url" content="${config.siteBase}/">
<meta property="og:image" content="${config.siteBase}/${pages[0] ? pages[0].slug + "/og.png" : ""}">
<meta name="twitter:card" content="summary_large_image">
<link rel="stylesheet" href="${assetHref("", "site.css")}">
</head>
<body>
${slimNav(pages, config, "")}
<header class="hero">
  <p class="kicker">Ministry of Agriculture, Bangladesh</p>
  <h1>Fertilizer Management</h1>
  <p>Burden to Bloom — drop a PDF or HTML into content/inbox and it becomes a page here.</p>
</header>
<main class="catalog">${cards || "<p>No documents yet.</p>"}</main>
</body>
</html>`;
}

export function fragmentPageHtml(page, pages, config, innerHtml) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${escapeHtml(page.title)}</title>
${seoTags(page, config)}
<link rel="stylesheet" href="${assetHref(page.slug, "site.css")}">
</head>
<body>
${slimNav(pages, config, page.slug)}
<article class="prose">${innerHtml}</article>
</body>
</html>`;
}

export function pdfReaderHtml(page, pages, config) {
  const pdfHref = `../files/${page.slug}.pdf`;
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${escapeHtml(page.title)}</title>
${seoTags(page, config)}
<link rel="stylesheet" href="${assetHref(page.slug, "site.css")}">
</head>
<body class="reader-body">
${slimNav(pages, config, page.slug)}
<div class="reader" data-pdf="${escapeHtml(pdfHref)}" data-worker="${assetHref(page.slug, "pdfjs/pdf.worker.min.mjs")}">
  <div class="toolbar" role="toolbar" aria-label="PDF toolbar">
    <button type="button" data-act="prev" aria-label="Previous page">Prev</button>
    <span class="page-label"><span data-page>1</span> / <span data-pages>1</span></span>
    <button type="button" data-act="next" aria-label="Next page">Next</button>
    <button type="button" data-act="zoom-out" aria-label="Zoom out">-</button>
    <button type="button" data-act="zoom-in" aria-label="Zoom in">+</button>
    <button type="button" data-act="fit" aria-label="Fit page">Fit</button>
    <input type="search" data-search placeholder="Search" aria-label="Search PDF">
    <button type="button" data-act="print">Print</button>
    <a class="btn" href="${pdfHref}" download>Download</a>
    <button type="button" data-act="share">Share</button>
    <button type="button" data-act="outline">Outline</button>
  </div>
  <div class="reader-main">
    <aside class="outline" hidden></aside>
    <div class="stage-wrap"><canvas class="stage"></canvas></div>
  </div>
  <div class="reader-error" hidden>
    <p>This PDF could not be displayed in the browser.</p>
    <a class="btn" href="${pdfHref}">Open original PDF</a>
  </div>
</div>
<script type="module" src="${assetHref(page.slug, "reader.js")}"></script>
</body>
</html>`;
}

export function redirectHtml(toUrl, title = "Redirecting") {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta http-equiv="refresh" content="0; url=${escapeHtml(toUrl)}">
<link rel="canonical" href="${escapeHtml(toUrl)}">
<title>${escapeHtml(title)}</title>
<script>window.location.replace(${JSON.stringify(toUrl)})</script>
</head>
<body>
<p>Redirecting to <a href="${escapeHtml(toUrl)}">${escapeHtml(toUrl)}</a></p>
</body>
</html>`;
}

export function notFoundHtml(pages, config) {
  const links = pages.map((p) => `<li><a href="${hrefTo("", p.slug)}">${escapeHtml(p.title)}</a></li>`).join("");
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Page not found</title>
<link rel="stylesheet" href="${assetHref("", "site.css")}">
</head>
<body>
${slimNav(pages, config, "")}
<main class="prose">
<h1>Page not found</h1>
<p>That document is not in this build. Return <a href="./">home</a> or choose a page:</p>
<ul>${links}</ul>
</main>
</body>
</html>`;
}

export function sitemapXml(pages, config) {
  const urls = [`  <url><loc>${config.siteBase}/</loc></url>`]
    .concat(pages.map((p) => `  <url><loc>${config.siteBase}/${p.slug}/</loc></url>`))
    .join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;
}

export function robotsTxt(config) {
  return `User-agent: *\nAllow: /\nSitemap: ${config.siteBase}/sitemap.xml\n`;
}

export function siteCss() {
  return `*{box-sizing:border-box}body{margin:0;font-family:Georgia,system-ui,serif;color:#2d3436;background:#f8f9fa}
.hero{background:#006A4E;color:#fff;padding:48px 24px 36px;text-align:center}
.hero .kicker{letter-spacing:.12em;text-transform:uppercase;font-size:12px;color:#eac96a}
.hero h1{margin:8px 0;font-size:36px}
.catalog{display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:20px;padding:28px;max-width:1100px;margin:0 auto}
.card{background:#fff;border:1px solid #dfe6e9;border-radius:12px;overflow:hidden;color:inherit;text-decoration:none;box-shadow:0 8px 24px rgba(0,0,0,.06)}
.card img{display:block;width:100%;height:auto;background:#004230}
.card .body{padding:16px}
.badge{display:inline-block;background:#006A4E;color:#fff;font:600 11px/1 system-ui,sans-serif;padding:4px 8px;border-radius:999px}
.prose{max-width:820px;margin:24px auto;padding:0 20px 48px;background:#fff}
.reader-body{background:#111}
.reader{display:flex;flex-direction:column;min-height:100vh}
.toolbar{position:sticky;top:42px;z-index:5;display:flex;flex-wrap:wrap;gap:8px;align-items:center;padding:8px 12px;background:#1a1a2e;color:#fff}
.toolbar button,.toolbar .btn, .btn{background:#006A4E;color:#fff;border:0;border-radius:6px;padding:8px 10px;text-decoration:none;font:600 13px system-ui;cursor:pointer}
.toolbar input{flex:1;min-width:120px;padding:8px;border-radius:6px;border:0}
.reader-main{display:flex;min-height:0;flex:1}
.outline{width:240px;background:#222;color:#eee;overflow:auto;padding:12px}
.stage-wrap{flex:1;overflow:auto;display:flex;justify-content:center;padding:16px}
.stage{max-width:100%;background:#fff;box-shadow:0 8px 30px rgba(0,0,0,.35)}
.reader-error{padding:40px;text-align:center;color:#fff}
@media(max-width:700px){.outline{position:absolute;height:100%;z-index:4}}`;
}

export function readerJs() {
  return `const root = document.querySelector(".reader");
const canvas = root.querySelector(".stage");
const ctx = canvas.getContext("2d");
const errorBox = root.querySelector(".reader-error");
const outlineEl = root.querySelector(".outline");
let pdf, pageNum = 1, scale = 1.2, rendering = false;

async function boot() {
  try {
    const pdfjs = await import(new URL("./pdfjs/pdf.min.mjs", import.meta.url));
    pdfjs.GlobalWorkerOptions.workerSrc = root.dataset.worker;
    pdf = await pdfjs.getDocument(root.dataset.pdf).promise;
    root.querySelector("[data-pages]").textContent = pdf.numPages;
    await render();
    await loadOutline();
  } catch (err) {
    errorBox.hidden = false;
  }
}

async function render() {
  if (!pdf || rendering) return;
  rendering = true;
  try {
    const page = await pdf.getPage(pageNum);
    const viewport = page.getViewport({ scale });
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    await page.render({ canvasContext: ctx, viewport }).promise;
    root.querySelector("[data-page]").textContent = pageNum;
  } catch (err) {
    errorBox.hidden = false;
  } finally {
    rendering = false;
  }
}

async function loadOutline() {
  try {
    const items = await pdf.getOutline();
    if (!items || !items.length) return;
    outlineEl.hidden = false;
    outlineEl.innerHTML = items.map((item) => '<button type="button" class="toc">' + item.title.replace(/[<>]/g, "") + "</button>").join("");
  } catch {}
}

root.addEventListener("click", async (e) => {
  const act = e.target.dataset.act;
  if (!act) return;
  if (act === "prev") pageNum = Math.max(1, pageNum - 1);
  if (act === "next") pageNum = Math.min(pdf.numPages, pageNum + 1);
  if (act === "zoom-in") scale = Math.min(3, scale + 0.2);
  if (act === "zoom-out") scale = Math.max(0.5, scale - 0.2);
  if (act === "fit") scale = 1;
  if (act === "print") window.print();
  if (act === "outline") outlineEl.hidden = !outlineEl.hidden;
  if (act === "share") {
    const url = location.href;
    if (navigator.share) await navigator.share({ title: document.title, url });
    else await navigator.clipboard.writeText(url);
  }
  if (["prev", "next", "zoom-in", "zoom-out", "fit"].includes(act)) await render();
});

root.querySelector("[data-search]").addEventListener("keydown", async (e) => {
  if (e.key !== "Enter" || !pdf) return;
  const q = e.target.value.trim();
  if (!q) return;
  for (let i = 1; i <= pdf.numPages; i += 1) {
    const page = await pdf.getPage(i);
    const text = await page.getTextContent();
    const hay = text.items.map((it) => it.str).join(" ");
    if (hay.toLowerCase().includes(q.toLowerCase())) {
      pageNum = i;
      await render();
      break;
    }
  }
});

window.addEventListener("keydown", async (e) => {
  if (e.key === "ArrowLeft") { pageNum = Math.max(1, pageNum - 1); await render(); }
  if (e.key === "ArrowRight" && pdf) { pageNum = Math.min(pdf.numPages, pageNum + 1); await render(); }
  if (e.key === "+" || e.key === "=") { scale = Math.min(3, scale + 0.2); await render(); }
  if (e.key === "-") { scale = Math.max(0.5, scale - 0.2); await render(); }
  if (e.key === "f") document.documentElement.requestFullscreen?.();
});

let touchX = null;
window.addEventListener("touchstart", (e) => { touchX = e.changedTouches[0].screenX; });
window.addEventListener("touchend", async (e) => {
  if (touchX == null || !pdf) return;
  const dx = e.changedTouches[0].screenX - touchX;
  if (dx > 40) pageNum = Math.max(1, pageNum - 1);
  if (dx < -40) pageNum = Math.min(pdf.numPages, pageNum + 1);
  await render();
});

boot();`;
}
