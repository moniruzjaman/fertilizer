# Fertilizer Management — Burden to Bloom

Static GitHub Pages site for the Ministry of Agriculture, Bangladesh.

Live: https://moniruzjaman.github.io/fertilizer/

## Add a page

Drop a `.pdf` or `.html` file into `content/inbox/`, commit, and push (the GitHub web UI is enough).

The build publishes:

- `/<slug>/` — navigable page (in-site PDF reader or HTML)
- `/<slug>/og.png` — 1200x630 social preview for that page
- `/files/<slug>.pdf` — original PDF download, when applicable

Optional extras in `content/pages/<slug>/`:

- `meta.yaml` — title, description, date, slug, type
- `og.png` — custom social card
- `redirect.yaml` — `{ to: new-slug }` to keep an old URL

See `content/README.md` and `docs/superpowers/specs/2026-09-23-content-inbox-pages-design.md`.

## Repository structure

```
content/inbox/          # drop PDF or HTML here
content/pages/<slug>/   # optional meta.yaml and og.png
tools/site-builder/     # CI publisher
site/                   # generated; not committed
.github/workflows/pages.yml
```

## Local build

```bash
cd tools/site-builder
npm ci
npm test
npm run build
```

Then from the repo root:

```bash
python3 -m http.server 8000 --directory site
```

## URL map

| URL | Content |
|---|---|
| `/` | Catalog of all pages |
| `/briefing/` | Ministerial briefing |
| `/dashboard/` | Interactive dashboard |
| `/fertilizer.html` | Redirects to `/` |
| `/dashboard.html` | Redirects to `/dashboard/` |
| `/Fertilizer_Distribution_Reform_Report_Ministerial_Briefing.html` | Redirects to `/briefing/` |

## Deploy

Push to `main`. GitHub Actions builds `site/` and deploys it to Pages.

In **Settings → Pages**, set Source to **GitHub Actions**.
