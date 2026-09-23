# Content Inbox Pages — Design Spec

Date: 2026-09-23
Status: approved in conversation; awaiting user review of this document
Repo: fertilizer GitHub Pages site (`https://moniruzjaman.github.io/fertilizer/`)

## Goal

Anyone can add a PDF or HTML file to `content/inbox/`, commit/push (including via the GitHub web UI), and the site automatically publishes a navigable page with:

- Site chrome and catalog listing
- Best-in-class reading experience (in-site PDF reader, or HTML served with injected SEO)
- A unique 1200x630 social preview image matching that page's contents
- Regenerated nav, sitemap, and robots

v1 upload UI is the GitHub web editor. Folder-drop is the source of truth. Layout must allow a later admin UI without restructuring.

## Non-goals (v1)

- Custom in-site admin dashboard or token-based GitHub commit UI
- Serving `.docx` or other office formats as pages
- Runtime (on-request) screenshot generation
- Pixel-perfect PDF.js testing across browsers
- Live social-crawler verification (Facebook/WhatsApp/X)
- Preserving old URLs when a file is renamed, unless an explicit redirect stub is added

## Approach

Content inbox + CI publisher (Approach A). Not an SSG framework (Eleventy/Astro) and not scanning the repo root.

Existing Pages workflow stays. It gains a **build job** that writes a generated `site/` tree; Pages deploys `site/`, not the repo root.

## Architecture

### Source of truth (hand-edited)

```
content/
  inbox/                          # drop any .pdf or .html / .htm
  pages/<slug>/                   # optional per-page extras
    meta.yaml                     # title, description, date, redirects
    og.png                        # optional 1200x630 override
    redirect.yaml                 # optional: old slug -> this slug
```

Inbox files are never mutated by CI. Generated output never lands in `content/`.

### Generated (CI only; do not edit)

```
site/
  index.html                      # catalog / home
  404.html
  fertilizer.html                 # redirect to /
  <slug>/index.html               # navigable page
  <slug>/og.png                   # social card
  files/<slug>.pdf                # original PDF for download (PDF pages only)
  sitemap.xml
  robots.txt
  assets/                         # shared CSS/JS (nav, reader, catalog)
```

### URL map

Base: `https://moniruzjaman.github.io/fertilizer`

| URL | Content |
|---|---|
| `/` | Catalog of all pages |
| `/<slug>/` | Branded PDF reader or wrapped/injected HTML |
| `/<slug>/og.png` | Unique Open Graph image |
| `/files/<slug>.pdf` | Raw PDF download (PDF pages only) |
| `/fertilizer.html` | Redirect to `/` (keep existing alias) |

Canonical URLs always include the trailing slash for page directories.

### Migration of current files

Move into `content/inbox/` so they use the same pipeline:

Put **one** copy of each document in `content/inbox/`. Do not place both briefing HTML files in inbox (they are duplicates).

| Current file | Inbox file | Slug |
|---|---|---|
| `index.html` (briefing body) | `content/inbox/briefing.html` | `briefing` |
| `dashboard.html` | `content/inbox/dashboard.html` | `dashboard` |
| `Fertilizer_Distribution_Reform_Report_Ministerial_Briefing.html` | not copied; legacy redirect only | — |
| `fertilizer.html` | not copied; generated redirect | — |

Slug stability for existing public URLs (generated stubs, not catalog entries):

- `/dashboard.html` → `/dashboard/`
- `/Fertilizer_Distribution_Reform_Report_Ministerial_Briefing.html` → `/briefing/`
- `/fertilizer.html` → `/`
- `/index.html` and `/` are the catalog. Briefing content lives at `/briefing/`.

This is an intentional IA change: new drops need a listing home. Do not keep the briefing as `/` in v1.

## Components

### 1. Scanner

Inputs: `content/inbox/*.{pdf,html,htm}` plus `content/pages/<slug>/meta.yaml`, `og.png`, `redirect.yaml`.

Ignores every other extension at inbox root. Does not recurse into subfolders of inbox in v1 (flat drop). If a subfolder is present, warn and skip.

### 2. Slugger

- Lowercase
- Non-alphanumeric runs become `-`
- Trim leading/trailing `-`
- Max 80 characters
- Collision: first discovered file wins the bare slug; later files get `-2`, `-3`, ... and a CI warning
- Explicit slug in `meta.yaml` wins over filename

Discovery order: alphabetical by filename, UTF-8.

### 3. Classifier

| Kind | Rule |
|---|---|
| `pdf` | `.pdf` |
| `rich-html` | `.html`/`.htm` that already has its own layout: has `<html>` and (`<style>` or `<link rel="stylesheet"` or substantial inline CSS or its own `<script>` app bundle) |
| `fragment` | HTML that is a snippet, or a full document with no own styling beyond trivial defaults |

Heuristic for "own layout": presence of `<style>` or stylesheet `<link>` or `class`/`id` usage together with a `<body>` child count above a small threshold is **not** enough alone. Require stylesheet or `<style>` block, or a comment/marker `<!-- site:rich -->`. Fragments may use `<!-- site:fragment -->` to force wrap.

### 4. Meta extractor

Resolution order (first non-empty wins per field):

1. `content/pages/<slug>/meta.yaml`
2. HTML `<title>`, `<meta name="description">`, `<meta name="date">` / `<time datetime>`
3. PDF document info dictionary (Title, Subject, CreationDate)
4. First heading (`h1` / PDF first-page text first line)
5. Cleaned filename (never emit the string "Untitled")

`meta.yaml` fields:

```yaml
title: string
description: string
date: YYYY-MM-DD
slug: string          # optional override
type: pdf|rich-html|fragment   # optional override
noindex: false
```

### 5. PDF reader page

Branded shell around PDF.js copied into `site/assets/pdfjs/` at build time (no runtime-only CDN dependency).

Toolbar: previous/next, page x of n, zoom in/out/fit, search, print, download, share (Web Share API when available, else copy link).

Sidebar: outline/TOC when the PDF has bookmarks; hidden otherwise.

Keyboard: left/right arrows, `+`/`-`, `f` fullscreen.

Mobile: swipe between pages, sticky toolbar.

SEO: unique title, description, canonical, `og:*`, `twitter:card=summary_large_image`, JSON-LD `DigitalDocument`.

Download always uses `/files/<slug>.pdf`. The original bytes are copied unchanged.

Viewer load failure: show branded message plus "Open original PDF" button. Never a blank stage.

### 6. HTML pages

- `rich-html`: do not restyle the body. Inject into `<head>`: title (if missing), description, canonical, OG, Twitter, JSON-LD. Inject a slim top nav that does not assume the page's CSS variables. Nav is shadow-friendly: self-contained CSS in the injected snippet, `z-index` high, no Tailwind dependency on the host page.
- `fragment`: wrap in the site template (header, nav, `<article>`, footer).

Never emit nested `<html>` documents.

### 7. Social cards

Every page emits `site/<slug>/og.png` at 1200x630.

Default composition:

- Bangladesh-green (`#006A4E`) brand bar
- Gold/red accent consistent with existing briefing
- Page title (truncated with ellipsis)
- Optional subtitle (type badge: PDF / Report / Dashboard)
- First-page PDF raster or HTML screenshot, letterboxed

Override: if `content/pages/<slug>/og.png` exists and is a readable raster, cover-resize it to 1200x630 (wrong dimensions are not an error). Unreadable override: ignore, generate auto card, CI warning.

Generation failure (Playwright/poppler crash, empty raster): title-only branded card. Build must not fail.

Injected tags use **absolute** URLs:

```
og:image = https://moniruzjaman.github.io/fertilizer/<slug>/og.png
og:url   = https://moniruzjaman.github.io/fertilizer/<slug>/
twitter:card = summary_large_image
```

Base URL is a single config constant (`SITE_BASE`), defaulting to that GitHub Pages origin, overridable via workflow env `SITE_BASE`.

### 8. Catalog and chrome

Home (`/`) lists every emitted page (not redirect stubs): type badge, title, description, date, OG thumb.

Shared nav on all generated pages is rebuilt each run from the page index.

`sitemap.xml` lists only canonical page URLs (directory URLs, not `og.png` or `files/`).

`robots.txt`: `User-agent: *` / `Allow: /` / `Sitemap: <absolute sitemap url>`.

`404.html`: message, link home, list of current pages (static snapshot from last build).

## Data flow

```
drop PDF/HTML into content/inbox/
        |
        v
push to main (GitHub web upload or git)
        |
        v
GitHub Actions build job
  1. scan inbox + content/pages/*/meta.yaml
  2. for each file:
       extract meta
       classify
       copy original to site/files/<slug>.pdf if PDF
       emit site/<slug>/index.html
       emit or copy site/<slug>/og.png
  3. emit catalog, 404, fertilizer.html redirect, legacy redirects
  4. emit sitemap.xml, robots.txt
  5. upload site/ as Pages artifact and deploy
        |
        v
visitor  ->  /<slug>/
crawler  ->  /<slug>/og.png
download ->  /files/<slug>.pdf
```

Builds are idempotent: same inbox + same meta files => same slugs and URLs.

Renaming an inbox file changes the slug. To keep the old URL, add `content/pages/<old-slug>/redirect.yaml`:

```yaml
to: new-slug
```

CI emits `site/<old-slug>/index.html` as a meta-refresh + canonical redirect. Redirects are omitted from the catalog.

## Error handling

| Case | Behavior |
|---|---|
| Unknown inbox type | Ignore; do not fail build |
| Corrupt PDF | Page still emitted; viewer error + download; title-only OG |
| Empty HTML | Skip file; CI warning; no URL |
| Duplicate slug | `-2` suffix; CI warning |
| OG / screenshot fail | Title-only card; do not fail build |
| Missing title | Cleaned filename |
| Bad override image | Ignore override; auto card; warn |
| PDF.js runtime fail | "Open original PDF" plus download |
| Unknown `/<slug>/` | `404.html` |
| Failed deploy | Previous Pages deployment stays live (`cancel-in-progress: false`) |

CI job summary lists: added, skipped, fallbacks, collisions.

## CI / tooling

Extend `.github/workflows/pages.yml`:

1. Checkout
2. Setup Node; install poppler (`pdftoppm`) for PDF first-page rasters; install Playwright Chromium for HTML screenshots
3. `npm ci` in `tools/site-builder/`
4. `node tools/site-builder` writes `site/`
5. `actions/upload-pages-artifact` with `path: site`
6. `actions/deploy-pages`

Local: `npm run build` produces `site/`; `npm run preview` serves it.

Builder is deterministic aside from screenshot anti-aliasing. Do not commit `site/` (add to `.gitignore`).

## Testing

CI runs `npm test` on the builder before deploy.

Coverage:

- Scanner: only pdf/html; ignores junk; no inbox recursion
- Slug rules and `-2` collisions; `meta.yaml` slug override
- Classifier: pdf, rich-html, fragment, force markers
- Meta order: yaml > tags > PDF info > heading > filename
- HTML injector: OG/canonical/nav present; rich pages keep their CSS; no double `<html>`
- Fragment wrap uses site template
- OG: output 1200x630; override wins; bad override falls back; generation failure falls back
- Catalog/nav/sitemap: every real page listed; redirects omitted; absolute URLs use `SITE_BASE`
- Legacy redirects: `fertilizer.html`, `dashboard.html`, long briefing filename
- 404 page present
- Fixture build: one PDF, one rich HTML, one fragment, one override `og.png`, one corrupt PDF — assert output tree

Not in v1: visual PDF.js browser matrix; live OG debugger fetches.

## Config constants

```
SITE_BASE=https://moniruzjaman.github.io/fertilizer
CONTENT_INBOX=content/inbox
CONTENT_PAGES=content/pages
OUT_DIR=site
OG_WIDTH=1200
OG_HEIGHT=630
```

## File ownership

| Path | Owner |
|---|---|
| `content/**` | humans |
| `tools/site-builder/**` | humans (builder source) |
| `site/**` | CI only |
| `.github/workflows/pages.yml` | humans |
| existing CDN-based HTML in inbox | humans; builder only injects head/nav |

## Success criteria

- Drop a PDF into `content/inbox/`, push, and `/<slug>/` is a working reader with download, search, and its own `og.png`
- Drop a rich HTML file, push, and the page keeps its look, gains OG tags and nav
- Drop a fragment HTML file, push, and it appears in the site template
- Sharing `/<slug>/` on social platforms shows that page's card (tags + 1200x630 file)
- Catalog and sitemap update without hand-editing `sitemap.xml`
- GitHub web UI upload into `content/inbox/` is a valid v1 "admin"
- `content/` layout is unchanged if a later admin UI writes the same files
