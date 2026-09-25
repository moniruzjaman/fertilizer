# Content inbox

Drop a `.pdf` or `.html` file into `inbox/`, then commit and push (GitHub web UI is enough).

The build publishes:

- `/<slug>/` — navigable page (PDF reader or HTML)
- `/<slug>/og.png` — 1200x630 social preview
- `/files/<slug>.pdf` — original PDF download, when applicable

Optional extras in `pages/<slug>/`:

- `meta.yaml` — title, description, date, slug, type
- `og.png` — custom social card (resized to 1200x630)
- `redirect.yaml` — `{ to: new-slug }` for an old URL
