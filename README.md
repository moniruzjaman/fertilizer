# 🌾 Fertilizer Management — Burden to Bloom (সার ব্যবস্থাপনা: সংকট থেকে সমৃদ্ধি)

Static website (Ministry of Agriculture, Bangladesh) ready for **GitHub Pages** deployment at:

👉 **https://moniruzjaman.github.io/fertilizer/**

## Repository structure

```
.
├── index.html                       # Main site (deployed at /fertilizer/)
├── fertilizer.html                  # Alias page → redirects to index.html (/fertilizer/fertilizer.html)
├── Fertilizer_Distribution_Reform_Report_Ministerial_Briefing.html   # Ministerial briefing report
├── robots.txt
├── sitemap.xml
├── README.md
└── .github/
    └── workflows/
        └── pages.yml                # GitHub Actions workflow that publishes the site
```

All assets are loaded from CDNs (Tailwind, Alpine.js, AOS, Chart.js, Lucide, Google Fonts),
so **no build step is required** — the repository root *is* the site.

## Deploy to GitHub Pages (one-time setup)

### Option A — via GitHub UI
1. Create a repository named **`fertilizer`** under the `moniruzjaman` account (or rename yours).
2. Push everything in this folder to its `main` branch:
   ```bash
   git init            # skip if already a repo
   git add .
   git commit -m "Deploy fertilizer site"
   git branch -M main
   git remote add origin https://github.com/moniruzjaman/fertilizer.git
   git push -u origin main --force
   ```
3. Go to **Settings → Pages → Build and deployment**
   - Source: **Deploy from a branch**
   - Branch: `main` / `/ (root)` → **Save**
4. Wait ~1 minute, then open https://moniruzjaman.github.io/fertilizer/

### Option B — via GitHub Actions (included)
1. Push to `main` as above.
2. In **Settings → Pages**, set Source to **GitHub Actions**.
3. The included workflow `.github/workflows/pages.yml` deploys automatically on every push
   (also runnable manually from the **Actions** tab → *Deploy static content to Pages* → *Run workflow*).

### Using the GitHub CLI (alternative to Option A/B)
```bash
gh repo create moniruzjaman/fertilizer --source=. --public --push --branch main
gh api -X POST repos/moniruzjaman/fertilizer/pages -f "build_type=legacy" \
   -f "source[branch]=main" -f "source[path]=/"     # enable Pages
# or use Actions-based Pages:
gh api -X PUT repos/moniruzjaman/fertilizer/pages -f build_type=workflow
```

## URL map

| URL | Content |
|---|---|
| `/fertilizer/` and `/fertilizer/index.html` | Main site |
| `/fertilizer/fertilizer.html` | Redirects to the main site |
| `/fertilizer/Fertilizer_Distribution_Reform_Report_Ministerial_Briefing.html` | Ministerial briefing report |

## Local preview
```bash
python3 -m http.server 8000
# open http://localhost:8000
```

## Troubleshooting
- **404 "Site not found"** → Pages is not enabled yet, or the repo/branch settings are wrong (see Option A step 3).
- **Page not updating after push** → hard-refresh (Ctrl+Shift+R); GitHub CDN can take up to ~10 minutes.
- **Case sensitivity** → file names must match links exactly (GitHub Pages is case-sensitive).
