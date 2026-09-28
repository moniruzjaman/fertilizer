export function seoTags(page, config) {
  const siteUrl = config.siteUrl || 'https://moniruzjaman.github.io/fertilizer';
  const siteName = config.siteName || 'Fertilizer Management';
  const url = `${siteUrl}/${page.slug}/`;
  const img = `${siteUrl}/${page.slug}/og.png`;
  const title = page.title || page.slug;
  const desc = page.description || '';
  
  return `
    <title>${title} — ${siteName}</title>
    <meta name="description" content="${desc}">
    <meta property="og:type" content="article">
    <meta property="og:title" content="${title}">
    <meta property="og:description" content="${desc}">
    <meta property="og:url" content="${url}">
    <meta property="og:image" content="${img}">
    <meta property="og:image:width" content="1200">
    <meta property="og:image:height" content="630">
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="${title}">
    <meta name="twitter:description" content="${desc}">
    <meta name="twitter:image" content="${img}">
    ${page.noindex ? '<meta name="robots" content="noindex">' : ''}
  `;
}

export function slimNav(pages, config, currentSlug) {
  const links = (pages || [])
    .filter(p => p && p.slug && p.slug !== currentSlug && !p.noindex)
    .slice(0, 6)
    .map(p => `<a href="/${p.slug}/" style="color:#006A4E;text-decoration:none;margin:0 8px;font-size:13px;">${p.title || p.slug}</a>`)
    .join('');

  return `
    <nav class="site-slim-nav" style="padding:20px 30px;text-align:center;border-top:1px solid #dfe6e9;background:#f8f9fa;font-family:Georgia,serif;">
      <a href="/" style="color:#006A4E;font-weight:700;text-decoration:none;margin-right:12px;font-size:13px;">← Home</a>
      ${links}
    </nav>
  `;
}

// ===== SITE CSS =====

export function siteCss() {
  return `
    :root {
      --green: #006A4E;
      --red: #F42A41;
      --gold: #C5A028;
      --dark: #1a1a2e;
      --light: #f8f9fa;
      --text: #2d3436;
      --border: #dfe6e9;
    }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Segoe UI', Georgia, 'Times New Roman', serif;
      line-height: 1.75;
      color: var(--text);
      background: #fff;
    }
    .page {
      max-width: 900px;
      margin: 0 auto;
      padding: 60px 50px;
      background: #fff;
      box-shadow: 0 0 40px rgba(0,0,0,0.08);
    }
    h1, h2, h3, h4 { line-height: 1.3; }
    h1 { font-size: 32px; color: var(--green); margin: 30px 0 20px; }
    h2 { font-size: 24px; color: var(--green); margin: 40px 0 16px; border-bottom: 2px solid var(--border); padding-bottom: 8px; }
    h3 { font-size: 18px; color: var(--dark); margin: 28px 0 12px; border-left: 4px solid var(--red); padding-left: 12px; }
    p { margin-bottom: 16px; text-align: justify; font-size: 15px; }
    ul, ol { margin: 14px 0 14px 30px; }
    li { margin-bottom: 8px; font-size: 15px; }
    table { width: 100%; border-collapse: collapse; margin: 20px 0; font-size: 14px; }
    th { background: var(--green); color: #fff; padding: 12px 14px; text-align: left; font-weight: 600; }
    td { padding: 11px 14px; border-bottom: 1px solid var(--border); }
    tr:nth-child(even) td { background: #fafbfc; }
    a { color: var(--green); }
    code { background: var(--light); padding: 2px 6px; border-radius: 3px; font-size: 13px; }
    pre { background: var(--dark); color: #fff; padding: 16px; border-radius: 6px; overflow-x: auto; margin: 16px 0; }
    pre code { background: none; padding: 0; color: inherit; }
    blockquote { border-left: 4px solid var(--gold); padding-left: 16px; margin: 20px 0; font-style: italic; color: #555; }
    @media (max-width: 768px) {
      .page { padding: 30px 20px; }
      h1 { font-size: 24px; }
      h2 { font-size: 20px; }
    }
    @media print {
      .page { box-shadow: none; padding: 20px; }
      @page { margin: 15mm; }
    }
  `;
}

// ===== READER JS =====

export function readerJs() {
  return `
    // Simple reading mode toggle
    (function() {
      const btn = document.createElement('button');
      btn.textContent = '📖 Reading Mode';
      btn.style.cssText = 'position:fixed;bottom:20px;left:20px;z-index:9999;background:#006A4E;color:#fff;border:none;padding:10px 16px;border-radius:8px;cursor:pointer;font-family:Georgia,serif;box-shadow:0 2px 8px rgba(0,0,0,0.3);';
      btn.onclick = function() {
        document.body.classList.toggle('reading-mode');
        btn.textContent = document.body.classList.contains('reading-mode') ? '✕ Exit Reading' : '📖 Reading Mode';
      };
      document.body.appendChild(btn);
      
      const style = document.createElement('style');
      style.textContent = 'body.reading-mode .page{max-width:720px;box-shadow:none;}body.reading-mode p,body.reading-mode li{font-size:1.25em;line-height:1.9;}';
      document.head.appendChild(style);
    })();
  `;
}

// ===== PDF READER HTML =====

export function pdfReaderHtml(page, pages, config) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
${seoTags(page, config)}
<link rel="stylesheet" href="/assets/site.css">
<style>
  .pdf-container { max-width: 1000px; margin: 0 auto; padding: 40px 20px; }
  .pdf-header { margin-bottom: 30px; }
  .pdf-header h1 { font-size: 28px; color: var(--green); margin-bottom: 10px; }
  .pdf-meta { font-size: 13px; color: #636e72; }
  .pdf-frame { width: 100%; height: 800px; border: 1px solid var(--border); border-radius: 8px; background: #fff; }
  .pdf-actions { margin-top: 20px; display: flex; gap: 12px; }
  .pdf-actions a, .pdf-actions button { 
    background: var(--green); color: #fff; padding: 10px 20px; 
    border-radius: 6px; text-decoration: none; border: none; cursor: pointer;
    font-family: Georgia, serif; font-size: 14px;
  }
</style>
</head>
<body>
<div class="pdf-container">
  <div class="pdf-header">
    <h1>${page.title || page.slug}</h1>
    <div class="pdf-meta">
      ${page.description ? `<p>${page.description}</p>` : ''}
      ${page.date ? `<p>Published: ${new Date(page.date).toLocaleDateString('en-GB', {day:'numeric',month:'long',year:'numeric'})}</p>` : ''}
    </div>
  </div>
  <iframe class="pdf-frame" src="/files/${page.slug}.pdf" title="${page.title || page.slug}"></iframe>
  <div class="pdf-actions">
    <a href="/files/${page.slug}.pdf" download>⬇ Download PDF</a>
    <a href="/">← Back to Home</a>
  </div>
</div>
<script src="/assets/reader.js"></script>
</body>
</html>`;
}

// ===== FRAGMENT PAGE HTML =====

export function fragmentPageHtml(page, pages, config, innerContent) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
${seoTags(page, config)}
<link rel="stylesheet" href="/assets/site.css">
</head>
<body>
<div class="page">
  ${innerContent}
</div>
${slimNav(pages, config, page.slug)}
<script src="/assets/reader.js"></script>
</body>
</html>`;
}

// ===== NOT FOUND HTML =====

export function notFoundHtml(pages, config) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>404 — Page Not Found</title>
<meta name="robots" content="noindex">
<link rel="stylesheet" href="/assets/site.css">
</head>
<body>
<div class="page" style="text-align:center;padding:80px 40px;">
  <h1 style="font-size:48px;color:var(--red);">404</h1>
  <h2 style="border:none;text-align:center;">Page Not Found</h2>
  <p style="text-align:center;font-size:16px;">The page you're looking for doesn't exist or has been moved.</p>
  <p style="text-align:center;margin-top:30px;"><a href="/" style="background:var(--green);color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;">← Return to Home</a></p>
</div>
</body>
</html>`;
}

// ===== REDIRECT HTML =====

export function redirectHtml(to, label) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Redirecting to ${label}...</title>
<meta http-equiv="refresh" content="0; url=${to}">
<link rel="canonical" href="${to}">
<style>
  body { font-family: Georgia, serif; text-align: center; padding: 60px 20px; background: #f8f9fa; }
  .msg { max-width: 500px; margin: 0 auto; background: #fff; padding: 40px; border-radius: 8px; box-shadow: 0 2px 12px rgba(0,0,0,0.08); }
  h1 { color: #006A4E; margin-bottom: 16px; }
  p { color: #636e72; margin-bottom: 24px; }
  a { color: #006A4E; font-weight: 600; }
</style>
</head>
<body>
<div class="msg">
  <h1>Redirecting...</h1>
  <p>Taking you to <strong>${label}</strong>.</p>
  <p><a href="${to}">Click here if not redirected automatically</a></p>
</div>
</body>
</html>`;
}

// ===== ROBOTS TXT =====

export function robotsTxt(config) {
  const siteUrl = config.siteUrl || 'https://moniruzjaman.github.io/fertilizer';
  return `User-agent: *
Allow: /
Sitemap: ${siteUrl}/sitemap.xml
`;
}

// ===== SITEMAP XML =====

export function sitemapXml(pages, config) {
  const siteUrl = config.siteUrl || 'https://moniruzjaman.github.io/fertilizer';
  const urls = pages
    .filter(p => !p.noindex)
    .map(p => {
      const lastmod = p.date ? new Date(p.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0];
      return `  <url>
    <loc>${siteUrl}/${p.slug}/</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>${p.slug === 'briefing' ? '1.0' : '0.8'}</priority>
  </url>`;
    })
    .join('\n');
  
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${siteUrl}/</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
${urls}
</urlset>`;
}

// ===== INNER HTML EXTRACTOR =====

export function innerHtml(html) {
  // Extract content between <body> tags, or return full html if no body tag
  const bodyMatch = html.match(/<body[^>]*>([\s\S]*)<\/body>/i);
  if (bodyMatch) {
    return bodyMatch[1].trim();
  }
  return html;
}

// ===== CATALOG HTML (NEW DRAWER VERSION) =====

export function catalogHtml(pages, config) {
  const sorted = [...pages].sort((a, b) => {
    if (a.date && b.date) return b.date.localeCompare(a.date);
    if (a.date) return -1;
    if (b.date) return 1;
    return a.title.localeCompare(b.title);
  });

  const grouped = {
    briefing: sorted.filter(p => p.slug.includes('briefing') || p.slug.includes('decision')),
    dashboard: sorted.filter(p => p.slug.includes('dashboard')),
    other: sorted.filter(p => 
      !p.slug.includes('briefing') && 
      !p.slug.includes('decision') && 
      !p.slug.includes('dashboard')
    )
  };

  const pageCard = (p) => `
    <a href="/${p.slug}/" class="drawer-card" data-type="${p.type}" data-slug="${p.slug}">
      <div class="drawer-card-thumb" style="background-image:url('/${p.slug}/og.png')"></div>
      <div class="drawer-card-body">
        <div class="drawer-card-meta">
          <span class="drawer-card-type">${p.type === 'pdf' ? '📄 PDF' : p.type === 'rich-html' ? '📝 Report' : '📑 Page'}</span>
          ${p.date ? `<span class="drawer-card-date">${new Date(p.date).toLocaleDateString('en-GB', {day:'numeric',month:'short',year:'numeric'})}</span>` : ''}
        </div>
        <h3 class="drawer-card-title">${p.title || p.slug}</h3>
        ${p.description ? `<p class="drawer-card-desc">${p.description.length > 100 ? p.description.substring(0,100) + '…' : p.description}</p>` : ''}
      </div>
    </a>
  `;

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Fertilizer Management — Burden to Bloom</title>
<meta name="description" content="Ministry of Agriculture strategic briefings, dashboards, and reform documents for Bangladesh's fertilizer distribution system.">
<meta name="theme-color" content="#006A4E">
<link rel="icon" type="image/png" sizes="512x512" href="/favicon.png">
<link rel="icon" type="image/svg+xml" href="/logo.svg">
<link rel="apple-touch-icon" href="/apple-touch-icon.png">
<meta property="og:type" content="website">
<meta property="og:site_name" content="Fertilizer Management — Burden to Bloom">
<meta property="og:title" content="Fertilizer Management — Burden to Bloom">
<meta property="og:description" content="Strategic briefings, dashboards, and reform documents for Bangladesh's fertilizer distribution system.">
<meta property="og:url" content="${config.siteUrl || 'https://moniruzjaman.github.io/fertilizer'}/">
<meta property="og:image" content="${config.siteUrl || 'https://moniruzjaman.github.io/fertilizer'}/social-preview.png">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<style>
  :root {
    --green: #006A4E;
    --red: #F42A41;
    --gold: #C5A028;
    --dark: #1a1a2e;
    --light: #f8f9fa;
    --text: #2d3436;
    --border: #dfe6e9;
    --drawer-width: 320px;
  }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    font-family: 'Segoe UI', Georgia, 'Times New Roman', serif;
    background: var(--light);
    color: var(--text);
    line-height: 1.6;
    overflow-x: hidden;
  }

  .drawer {
    position: fixed;
    top: 0; left: 0;
    width: var(--drawer-width);
    height: 100vh;
    background: #fff;
    border-right: 1px solid var(--border);
    box-shadow: 2px 0 12px rgba(0,0,0,0.04);
    display: flex;
    flex-direction: column;
    z-index: 100;
    transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  }
  .drawer.collapsed {
    transform: translateX(calc(-1 * var(--drawer-width) + 48px));
  }
  .drawer-header {
    padding: 20px;
    border-bottom: 1px solid var(--border);
    background: linear-gradient(135deg, var(--green) 0%, #004d3a 100%);
    color: #fff;
    position: relative;
  }
  .drawer-brand {
    display: flex;
    align-items: center;
    gap: 12px;
  }
  .drawer-crest {
    width: 42px; height: 42px;
    background: var(--gold);
    border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    color: var(--green);
    font-weight: bold;
    font-size: 18px;
    flex: none;
  }
  .drawer-title {
    font-size: 14px;
    font-weight: 600;
    letter-spacing: 0.3px;
    line-height: 1.3;
  }
  .drawer-subtitle {
    font-size: 11px;
    opacity: 0.85;
    margin-top: 2px;
  }
  .drawer-toggle {
    position: absolute;
    top: 50%;
    right: -16px;
    transform: translateY(-50%);
    width: 32px; height: 32px;
    background: #fff;
    border: 1px solid var(--border);
    border-radius: 50%;
    cursor: pointer;
    display: flex; align-items: center; justify-content: center;
    box-shadow: 0 2px 6px rgba(0,0,0,0.08);
    transition: transform 0.3s;
    z-index: 101;
  }
  .drawer.collapsed .drawer-toggle {
    transform: translateY(-50%) rotate(180deg);
  }
  .drawer-toggle svg {
    width: 14px; height: 14px;
    stroke: var(--green);
    stroke-width: 2.5;
    fill: none;
  }

  .drawer-search {
    padding: 14px 16px;
    border-bottom: 1px solid var(--border);
  }
  .drawer-search input {
    width: 100%;
    padding: 9px 12px 9px 34px;
    border: 1px solid var(--border);
    border-radius: 6px;
    font-size: 13px;
    font-family: inherit;
    background: var(--light) url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%23636e72' stroke-width='2'><circle cx='11' cy='11' r='8'/><path d='m21 21-4.3-4.3'/></svg>") no-repeat 10px center;
    transition: border-color 0.2s;
  }
  .drawer-search input:focus {
    outline: none;
    border-color: var(--green);
    background-color: #fff;
  }

  .drawer-filters {
    display: flex;
    gap: 6px;
    padding: 10px 16px;
    border-bottom: 1px solid var(--border);
    flex-wrap: wrap;
  }
  .drawer-filter-btn {
    padding: 5px 11px;
    font-size: 11px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    border: 1px solid var(--border);
    background: #fff;
    color: var(--text);
    border-radius: 4px;
    cursor: pointer;
    transition: all 0.15s;
    font-family: inherit;
  }
  .drawer-filter-btn:hover {
    border-color: var(--green);
    color: var(--green);
  }
  .drawer-filter-btn.active {
    background: var(--green);
    color: #fff;
    border-color: var(--green);
  }

  .drawer-list {
    flex: 1;
    overflow-y: auto;
    padding: 8px;
  }
  .drawer-section-title {
    font-size: 10px;
    text-transform: uppercase;
    letter-spacing: 1.2px;
    color: #636e72;
    padding: 12px 12px 6px;
    font-weight: 700;
  }

  .drawer-card {
    display: flex;
    gap: 10px;
    padding: 10px;
    border-radius: 6px;
    text-decoration: none;
    color: inherit;
    transition: background 0.15s;
    margin-bottom: 4px;
  }
  .drawer-card:hover {
    background: var(--light);
  }
  .drawer-card-thumb {
    width: 56px; height: 40px;
    background: linear-gradient(135deg, #e0e0e0, #f5f5f5);
    background-size: cover;
    background-position: center;
    border-radius: 4px;
    flex: none;
    border: 1px solid var(--border);
  }
  .drawer-card-body { flex: 1; min-width: 0; }
  .drawer-card-meta {
    display: flex;
    gap: 8px;
    align-items: center;
    margin-bottom: 3px;
    font-size: 10px;
  }
  .drawer-card-type {
    color: var(--green);
    font-weight: 600;
  }
  .drawer-card-date {
    color: #95a5a6;
  }
  .drawer-card-title {
    font-size: 13px;
    font-weight: 600;
    line-height: 1.3;
    color: var(--text);
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
  .drawer-card-desc {
    font-size: 11px;
    color: #636e72;
    margin-top: 2px;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
    line-height: 1.4;
  }

  .drawer-footer {
    padding: 12px 16px;
    border-top: 1px solid var(--border);
    font-size: 11px;
    color: #95a5a6;
    text-align: center;
  }

  .main {
    margin-left: var(--drawer-width);
    transition: margin-left 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    min-height: 100vh;
  }
  .drawer.collapsed ~ .main {
    margin-left: 48px;
  }

  .hero {
    background: linear-gradient(135deg, var(--green) 0%, #004d3a 100%);
    color: #fff;
    padding: 80px 60px 70px;
    position: relative;
    overflow: hidden;
  }
  .hero::before {
    content: '';
    position: absolute;
    top: 0; left: 0; right: 0;
    height: 6px;
    background: linear-gradient(90deg, var(--green) 50%, var(--red) 50%);
  }
  .hero::after {
    content: '';
    position: absolute;
    right: -100px; top: -100px;
    width: 400px; height: 400px;
    background: radial-gradient(circle, rgba(197,160,40,0.15) 0%, transparent 70%);
    border-radius: 50%;
  }
  .hero-inner { position: relative; max-width: 900px; }
  .hero-badge {
    display: inline-block;
    padding: 4px 12px;
    background: rgba(255,255,255,0.15);
    border: 1px solid rgba(255,255,255,0.25);
    border-radius: 20px;
    font-size: 11px;
    letter-spacing: 1.5px;
    text-transform: uppercase;
    margin-bottom: 18px;
  }
  .hero h1 {
    font-size: 42px;
    line-height: 1.15;
    margin-bottom: 16px;
    font-weight: 700;
    letter-spacing: -0.5px;
  }
  .hero h1 span { color: var(--gold); }
  .hero p {
    font-size: 17px;
    opacity: 0.92;
    max-width: 640px;
    line-height: 1.7;
    margin-bottom: 28px;
  }
  .hero-stats {
    display: flex;
    gap: 30px;
    flex-wrap: wrap;
    padding-top: 20px;
    border-top: 1px solid rgba(255,255,255,0.2);
  }
  .hero-stat-num {
    font-size: 32px;
    font-weight: 700;
    color: var(--gold);
    line-height: 1;
  }
  .hero-stat-label {
    font-size: 11px;
    text-transform: uppercase;
    letter-spacing: 1px;
    opacity: 0.85;
    margin-top: 4px;
  }

  .content {
    padding: 50px 60px;
    max-width: 1100px;
  }
  .content h2 {
    font-size: 22px;
    color: var(--green);
    margin-bottom: 8px;
    padding-bottom: 10px;
    border-bottom: 2px solid var(--border);
    text-transform: uppercase;
    letter-spacing: 1px;
  }
  .content-lead {
    font-size: 15px;
    color: #636e72;
    margin-bottom: 30px;
  }

  .featured-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 20px;
    margin-bottom: 50px;
  }
  .featured-card {
    background: #fff;
    border-radius: 10px;
    overflow: hidden;
    box-shadow: 0 2px 12px rgba(0,0,0,0.06);
    transition: transform 0.2s, box-shadow 0.2s;
    text-decoration: none;
    color: inherit;
    display: flex;
    flex-direction: column;
  }
  .featured-card:hover {
    transform: translateY(-4px);
    box-shadow: 0 12px 30px rgba(0,0,0,0.12);
  }
  .featured-card-img {
    width: 100%;
    aspect-ratio: 16/9;
    background: linear-gradient(135deg, #e0e0e0, #f5f5f5);
    background-size: cover;
    background-position: center;
  }
  .featured-card-body {
    padding: 20px;
    flex: 1;
    display: flex;
    flex-direction: column;
  }
  .featured-card-tag {
    display: inline-block;
    padding: 3px 9px;
    background: var(--gold);
    color: #fff;
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 1px;
    text-transform: uppercase;
    border-radius: 3px;
    margin-bottom: 10px;
    align-self: flex-start;
  }
  .featured-card-tag.briefing { background: var(--green); }
  .featured-card-tag.dashboard { background: var(--red); }
  .featured-card h3 {
    font-size: 17px;
    line-height: 1.35;
    margin-bottom: 8px;
    color: var(--text);
  }
  .featured-card p {
    font-size: 13px;
    color: #636e72;
    line-height: 1.6;
    flex: 1;
  }
  .featured-card-footer {
    margin-top: 14px;
    padding-top: 12px;
    border-top: 1px solid var(--border);
    font-size: 12px;
    color: var(--green);
    font-weight: 600;
    display: flex;
    align-items: center;
    gap: 6px;
  }

  .mobile-fab {
    display: none;
    position: fixed;
    bottom: 20px; right: 20px;
    width: 56px; height: 56px;
    background: var(--green);
    color: #fff;
    border: none;
    border-radius: 50%;
    box-shadow: 0 4px 16px rgba(0,106,78,0.4);
    cursor: pointer;
    z-index: 200;
    align-items: center;
    justify-content: center;
  }
  .mobile-fab svg { width: 24px; height: 24px; stroke: #fff; stroke-width: 2.5; fill: none; }

  .mobile-overlay {
    display: none;
    position: fixed;
    inset: 0;
    background: rgba(0,0,0,0.5);
    z-index: 150;
    opacity: 0;
    transition: opacity 0.3s;
  }
  .mobile-overlay.active { opacity: 1; }

  @media (max-width: 900px) {
    .drawer {
      position: fixed;
      top: auto;
      bottom: 0; left: 0; right: 0;
      width: 100%;
      height: 75vh;
      max-height: 600px;
      border-right: none;
      border-top: 1px solid var(--border);
      border-radius: 20px 20px 0 0;
      transform: translateY(100%);
      box-shadow: 0 -4px 20px rgba(0,0,0,0.1);
    }
    .drawer.mobile-open {
      transform: translateY(0);
    }
    .drawer.collapsed {
      transform: translateY(100%);
    }
    .drawer-toggle { display: none; }
    .main { margin-left: 0 !important; }
    .mobile-fab { display: flex; }
    .mobile-overlay.active { display: block; }
    .hero { padding: 50px 24px 40px; }
    .hero h1 { font-size: 28px; }
    .hero p { font-size: 15px; }
    .hero-stats { gap: 20px; }
    .hero-stat-num { font-size: 24px; }
    .content { padding: 30px 24px; }
  }

  .drawer-card.hidden { display: none; }
  .drawer-section.hidden { display: none; }
</style>
</head>
<body>

<aside class="drawer" id="drawer">
  <div class="drawer-header">
    <div class="drawer-brand">
      <div class="drawer-crest">বাংলা</div>
      <div>
        <div class="drawer-title">Fertilizer Management</div>
        <div class="drawer-subtitle">Ministry of Agriculture</div>
      </div>
    </div>
    <button class="drawer-toggle" id="drawerToggle" aria-label="Toggle drawer">
      <svg viewBox="0 0 24 24"><polyline points="15 18 9 12 15 6"></polyline></svg>
    </button>
  </div>

  <div class="drawer-search">
    <input type="text" id="searchInput" placeholder="Search briefings..." aria-label="Search pages">
  </div>

  <div class="drawer-filters">
    <button class="drawer-filter-btn active" data-filter="all">All (${sorted.length})</button>
    <button class="drawer-filter-btn" data-filter="briefing">Briefings</button>
    <button class="drawer-filter-btn" data-filter="dashboard">Dashboard</button>
    <button class="drawer-filter-btn" data-filter="other">Other</button>
  </div>

  <div class="drawer-list" id="drawerList">
    ${grouped.briefing.length ? `
      <div class="drawer-section" data-section="briefing">
        <div class="drawer-section-title">Briefings & Memos</div>
        ${grouped.briefing.map(pageCard).join('')}
      </div>
    ` : ''}
    ${grouped.dashboard.length ? `
      <div class="drawer-section" data-section="dashboard">
        <div class="drawer-section-title">Dashboards</div>
        ${grouped.dashboard.map(pageCard).join('')}
      </div>
    ` : ''}
    ${grouped.other.length ? `
      <div class="drawer-section" data-section="other">
        <div class="drawer-section-title">Other Documents</div>
        ${grouped.other.map(pageCard).join('')}
      </div>
    ` : ''}
  </div>

  <div class="drawer-footer">
    ${sorted.length} documents · Updated ${new Date().toLocaleDateString('en-GB', {month:'short', year:'numeric'})}
  </div>
</aside>

<button class="mobile-fab" id="mobileFab" aria-label="Open navigation">
  <svg viewBox="0 0 24 24"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
</button>
<div class="mobile-overlay" id="mobileOverlay"></div>

<main class="main">
  <section class="hero">
    <div class="hero-inner">
      <span class="hero-badge">Ministry of Agriculture · Bangladesh</span>
      <h1>From <span>Burden</span> to <span>Bloom</span></h1>
      <p>A living repository of strategic briefings, interactive dashboards, and reform documents driving transparency, accountability, and dignity in Bangladesh's fertilizer distribution system.</p>
      <div class="hero-stats">
        <div>
          <div class="hero-stat-num">${sorted.length}</div>
          <div class="hero-stat-label">Documents</div>
        </div>
        <div>
          <div class="hero-stat-num">1.365M</div>
          <div class="hero-stat-label">Tonnes Tracked</div>
        </div>
        <div>
          <div class="hero-stat-num">Tk 17,001cr</div>
          <div class="hero-stat-label">Annual Subsidy</div>
        </div>
        <div>
          <div class="hero-stat-num">64</div>
          <div class="hero-stat-label">Districts Covered</div>
        </div>
      </div>
    </div>
  </section>

  <section class="content">
    <h2>Featured Documents</h2>
    <p class="content-lead">Start here — the decision-ready instruments for policymakers, field officers, and development partners.</p>

    <div class="featured-grid">
      ${grouped.briefing.slice(0, 3).map(p => `
        <a href="/${p.slug}/" class="featured-card">
          <div class="featured-card-img" style="background-image:url('/${p.slug}/og.png')"></div>
          <div class="featured-card-body">
            <span class="featured-card-tag briefing">Briefing</span>
            <h3>${p.title || p.slug}</h3>
            <p>${p.description ? (p.description.length > 140 ? p.description.substring(0,140) + '…' : p.description) : 'Strategic analysis and recommendations.'}</p>
            <div class="featured-card-footer">Read briefing →</div>
          </div>
        </a>
      `).join('')}
      ${grouped.dashboard.slice(0, 1).map(p => `
        <a href="/${p.slug}/" class="featured-card">
          <div class="featured-card-img" style="background-image:url('/${p.slug}/og.png')"></div>
          <div class="featured-card-body">
            <span class="featured-card-tag dashboard">Dashboard</span>
            <h3>${p.title || p.slug}</h3>
            <p>${p.description ? (p.description.length > 140 ? p.description.substring(0,140) + '…' : p.description) : 'Interactive data visualization.'}</p>
            <div class="featured-card-footer">Open dashboard →</div>
          </div>
        </a>
      `).join('')}
    </div>

    <h2>Why This Matters</h2>
    <p class="content-lead">Bangladesh confronts a paradox: over 1.365 million tonnes of fertilizer sit in state warehouses, yet farmers pay 50–100% above official prices. The crisis is not supply — it is distribution integrity, institutional accountability, and subsidy targeting.</p>
    <p class="content-lead">These documents diagnose the problem, inventory the assets already at hand, and chart the path to a biometrically authenticated, land-linked, digitally tracked distribution system — one that honors the nationalist, farmer-first vision of Bir Uttam President Ziaur Rahman.</p>

    <h2 style="margin-top:40px;">How to Use This Repository</h2>
    <div class="featured-grid" style="grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));">
      <div style="background:#fff;padding:24px;border-radius:10px;border-top:4px solid var(--green);">
        <h3 style="font-size:15px;margin-bottom:8px;color:var(--green);">📋 For Ministers</h3>
        <p style="font-size:13px;color:#636e72;line-height:1.6;">Start with the <strong>Decision Memo</strong> — a one-page instrument ready for signature. The full briefing provides the supporting analysis.</p>
      </div>
      <div style="background:#fff;padding:24px;border-radius:10px;border-top:4px solid var(--red);">
        <h3 style="font-size:15px;margin-bottom:8px;color:var(--red);">📊 For Analysts</h3>
        <p style="font-size:13px;color:#636e72;line-height:1.6;">Open the <strong>Dashboard</strong> for real-time metrics on stock, allocation, price gaps, and dealer compliance across all 64 districts.</p>
      </div>
      <div style="background:#fff;padding:24px;border-radius:10px;border-top:4px solid var(--gold);">
        <h3 style="font-size:15px;margin-bottom:8px;color:#8a6d1a;">🌾 For Field Officers</h3>
        <p style="font-size:13px;color:#636e72;line-height:1.6;">Access operational briefings and implementation guides in the sidebar drawer — searchable and filterable by topic.</p>
      </div>
    </div>
  </section>

  <footer style="padding:30px 60px;border-top:2px solid var(--green);text-align:center;font-size:12px;color:#636e72;">
    <div style="width:50px;height:2px;background:var(--red);margin:0 auto 15px;"></div>
    <p><strong>Ministry of Agriculture</strong> · Government of the People's Republic of Bangladesh</p>
    <p style="margin-top:5px;">Strategic Planning Unit · September 2026</p>
  </footer>
</main>

<script>
  const drawer = document.getElementById('drawer');
  const toggle = document.getElementById('drawerToggle');
  toggle.addEventListener('click', () => {
    drawer.classList.toggle('collapsed');
    localStorage.setItem('drawer-collapsed', drawer.classList.contains('collapsed'));
  });
  if (localStorage.getItem('drawer-collapsed') === 'true') {
    drawer.classList.add('collapsed');
  }

  const fab = document.getElementById('mobileFab');
  const overlay = document.getElementById('mobileOverlay');
  fab.addEventListener('click', () => {
    drawer.classList.add('mobile-open');
    overlay.classList.add('active');
    overlay.style.display = 'block';
  });
  overlay.addEventListener('click', () => {
    drawer.classList.remove('mobile-open');
    overlay.classList.remove('active');
    setTimeout(() => overlay.style.display = 'none', 300);
  });

  const searchInput = document.getElementById('searchInput');
  searchInput.addEventListener('input', (e) => {
    const q = e.target.value.toLowerCase();
    document.querySelectorAll('.drawer-card').forEach(card => {
      const text = card.textContent.toLowerCase();
      card.classList.toggle('hidden', q && !text.includes(q));
    });
    document.querySelectorAll('.drawer-section').forEach(sec => {
      const visibleCards = sec.querySelectorAll('.drawer-card:not(.hidden)');
      sec.classList.toggle('hidden', visibleCards.length === 0);
    });
  });

  document.querySelectorAll('.drawer-filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.drawer-filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const filter = btn.dataset.filter;
      document.querySelectorAll('.drawer-section').forEach(sec => {
        if (filter === 'all') {
          sec.classList.remove('hidden');
          sec.querySelectorAll('.drawer-card').forEach(c => c.classList.remove('hidden'));
        } else {
          const match = sec.dataset.section === filter;
          sec.classList.toggle('hidden', !match);
        }
      });
    });
  });

  document.querySelectorAll('.drawer-card').forEach(card => {
    card.addEventListener('click', () => {
      if (window.innerWidth <= 900) {
        drawer.classList.remove('mobile-open');
        overlay.classList.remove('active');
        overlay.style.display = 'none';
      }
    });
  });
</script>

</body>
</html>`;
}
