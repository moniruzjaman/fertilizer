# Fertilizer Management — Burden to Bloom

A static GitHub Pages site for the Ministry of Agriculture, Government of the People's Republic of Bangladesh, publishing the strategic reform portfolio on fertilizer distribution — from ministerial briefings and decision memos to interactive dashboards and reference documents.

**Live site:** <https://moniruzjaman.github.io/fertilizer/>

---

## Pages & Direct Links

### Reports & Briefings

| Document | Description | Open |
|---|---|---|
| **Comprehensive Strategic Report — Fertilizer Distribution Reform** | The flagship ministerial briefing: a full strategic analysis of Bangladesh's fertilizer distribution system — the crisis, subsidy leakage, resource mapping, regional lessons, and a reform roadmap toward accountability. | <https://moniruzjaman.github.io/fertilizer/briefing/> |
| **Fertilizer Management: The Path to Bloom — Ministerial Action Plan** | A biometric, land-linked fertilizer distribution plan that recovers Tk 2,000–3,000 crore annually — seven decisive actions requiring the Minister's signature. | <https://moniruzjaman.github.io/fertilizer/minister-email/> |
| **Fertilizer Reform — Minister's Decision Memo** | One-page decision memo: approve the biometric Point-of-Sale (PoS) mandate within 90 days, with divisional pilots and subsidy-targeting reform. For decision. | <https://moniruzjaman.github.io/fertilizer/fertilizer-decision-memo/> |
| **Op-Ed — From Abundant Supply to Every Farmer's Hands: Bangladesh's Path to Bloom** | A constructive editorial agenda for fertiliser excellence: why record supply has not reached farmers, and what policy, logistics, and market reforms can close the gap. | <https://moniruzjaman.github.io/fertilizer/editorial/> |

### Interactive

| Document | Description | Open |
|---|---|---|
| **Fertilizer Management — Burden to Bloom Dashboard** | Interactive strategic dashboard visualizing the reform program: distribution data, subsidy flows, and progress indicators for Ministry leadership. | <https://moniruzjaman.github.io/fertilizer/dashboard/> |

### Reference PDFs

| Document | Description | Open |
|---|---|---|
| **From Fertilizer Security to Farming Security** | Strategic paper reframing fertilizer policy from supply security toward holistic farming security (September 2026). | <https://moniruzjaman.github.io/fertilizer/from-fertilizer-security-to-farming-security-validate/> |
| **Fertilizer Management: The Path to Bloom — Ministerial Report** | Full ministerial report behind the Path to Bloom action plan, in-browser reader. | <https://moniruzjaman.github.io/fertilizer/fertilizer-management-path-to-bloom-report/> |
| **Sar-Sarvabhaumer-Gobhire (শর-সর্বভৌমের-গভীরে)** | Supporting background document, in-browser reader. | <https://moniruzjaman.github.io/fertilizer/sar-sarvabhaumer-gobhire-1/> |
| **Soil Testing — 12 Parameter Report** | Standard 12-parameter soil testing reference used by the reform's soil-health workstream. | <https://moniruzjaman.github.io/fertilizer/soil-12-parameter/> |

**Catalog (all pages):** <https://moniruzjaman.github.io/fertilizer/>

Every page also publishes a 1200×630 social preview at `/<slug>/og.png`, and original PDFs remain downloadable at `/files/<slug>.pdf` where applicable.

---

## How it works

Content is inbox-driven — there are no hand-maintained HTML files.

1. Drop a `.pdf` or `.html` file into `content/inbox/`.
2. Commit and push (the GitHub web UI is enough).
3. GitHub Actions builds and deploys `site/` to Pages, publishing:
   - `/<slug>/` — navigable page (in-site PDF reader or rendered HTML)
   - `/<slug>/og.png` — auto-generated social preview
   - `/files/<slug>.pdf` — original PDF download, when applicable

Optional per-page overrides in `content/pages/<slug>/`:

- `meta.yaml` — `title`, `description`, `date`, `slug`, `type`
- `og.png` — custom social card (overrides the generated one)
- `redirect.yaml` — `{ to: new-slug }` to keep an old URL alive

See `content/README.md` and `docs/superpowers/specs/2026-09-23-content-inbox-pages-design.md`.

## Repository structure

```
content/inbox/          # drop PDF or HTML here — single source of truth
content/pages/<slug>/   # optional meta.yaml, og.png, redirect.yaml
tools/site-builder/     # build pipeline + tests
site/                   # generated output; not committed
.github/workflows/pages.yml
```

## Local development

```bash
cd tools/site-builder
npm ci
npm test        # 26 tests
npm run build   # regenerates site/
```

Preview from the repo root:

```bash
python3 -m http.server 8000 --directory site
```

Then open <http://localhost:8000/fertilizer/>.

## Legacy URLs

Old hand-maintained URLs are preserved via `content/pages/*/redirect.yaml` declarations (e.g. `/fertilizer-distribution-reform-report-ministerial-briefing/` → `/briefing/`). Add a new `redirect.yaml` whenever a slug changes.

## Deploy

Push to `main`. GitHub Actions builds `site/` and deploys it to Pages.

In **Settings → Pages**, set Source to **GitHub Actions**.
