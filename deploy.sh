#!/bin/bash
set -e

echo "🌱 Deploying patched fertilizer briefing..."

git add Fertilizer_Distribution_Reform_Report_Ministerial_Briefing.html
git commit -m "feat(briefing): retrofit persuasion engine" || { echo "Nothing to commit"; exit 0; }
git push origin main

echo "✅ Pushed! GitHub Pages will update in ~60 seconds."
echo "🔗 Live at: https://moniruzjaman.github.io/fertilizer/"
