import { describe, it, before } from "node:test";
import assert from "node:assert/strict";
import { mkdir, writeFile, readFile, stat } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { mkdtemp } from "node:fs/promises";
import sharp from "sharp";
import { getConfig } from "../src/config.js";
import { build } from "../src/build.js";
import { scanInbox } from "../src/scan.js";

const MIN_PDF = `%PDF-1.1
1 0 obj<< /Type /Catalog /Pages 2 0 R >>endobj
2 0 obj<< /Type /Pages /Kids [3 0 R] /Count 1 >>endobj
3 0 obj<< /Type /Page /Parent 2 0 R /MediaBox [0 0 200 200] >>endobj
trailer<< /Root 1 0 R >>
%%EOF
`;

describe("fixture build", () => {
  let root;
  let outDir;
  let config;

  before(async () => {
    root = await mkdtemp(join(tmpdir(), "inbox-site-"));
    outDir = join(root, "site");
    await mkdir(join(root, "content", "inbox"), { recursive: true });
    await mkdir(join(root, "content", "pages", "override-doc"), { recursive: true });
    await mkdir(join(root, "content", "pages", "old-name"), { recursive: true });
    await mkdir(join(root, "content", "pages", "note-dup"), { recursive: true });
    await mkdir(join(root, "content", "inbox", "nested"), { recursive: true });

    await writeFile(join(root, "content", "inbox", "briefing.html"), `<!DOCTYPE html><html><head><title>Briefing Title</title><meta name="description" content="Briefing desc"><style>body{color:#006A4E}</style></head><body><h1>Briefing</h1></body></html>`);
    await writeFile(join(root, "content", "inbox", "dashboard.html"), `<!DOCTYPE html><html><head><title>Dashboard Title</title><link rel="stylesheet" href="https://example.com/a.css"></head><body><h1>Dash</h1></body></html>`);
    await writeFile(join(root, "content", "inbox", "note.html"), `<h1>Fragment Note</h1><p>Hello fragment</p>`);
    await writeFile(join(root, "content", "inbox", "note-dup.html"), `<!-- site:fragment --><html><head></head><body><h1>Dup</h1></body></html>`);
    await writeFile(join(root, "content", "pages", "note-dup", "meta.yaml"), "slug: note\n");
    await writeFile(join(root, "content", "inbox", "empty.html"), "");
    await writeFile(join(root, "content", "inbox", "ignore.docx"), "nope");
    await writeFile(join(root, "content", "inbox", "report.pdf"), MIN_PDF);
    await writeFile(join(root, "content", "inbox", "broken.pdf"), "this is not a pdf");
    await writeFile(join(root, "content", "inbox", "nested", "skip.html"), "<p>no</p>");

    await writeFile(join(root, "content", "pages", "override-doc", "meta.yaml"), "title: Override Title\nslug: override-doc\n");
    await writeFile(join(root, "content", "inbox", "override-doc.html"), "<h1>Should lose to yaml</h1>");
    const og = await sharp({
      create: { width: 10, height: 10, channels: 3, background: "#ff0000" }
    }).png().toBuffer();
    await writeFile(join(root, "content", "pages", "override-doc", "og.png"), og);
    await mkdir(join(root, "content", "pages", "note"), { recursive: true });
    await writeFile(join(root, "content", "pages", "note", "og.png"), "not-an-image");
    await writeFile(join(root, "content", "pages", "old-name", "redirect.yaml"), "to: briefing\n");

    config = getConfig({ root, outDir, siteBase: "https://example.com/fertilizer", skipScreenshots: true });
    await build(config);
  });

  it("scans only pdf and html at inbox root", async () => {
    const scanConfig = getConfig({ root, outDir, siteBase: "https://example.com/fertilizer" });
    const files = await scanInbox(scanConfig);
    const names = files.map((f) => f.filename).sort();
    assert.ok(names.includes("briefing.html"));
    assert.ok(!names.includes("ignore.docx"));
    assert.ok(!names.includes("skip.html"));
    assert.ok(!names.includes("empty.html"));
  });

  it("emits pages and legacy redirects", async () => {
    const briefing = await readFile(join(outDir, "briefing", "index.html"), "utf8");
    assert.match(briefing, /Briefing Title/);
    assert.match(briefing, /og:image/);
    assert.match(briefing, /body\{color:#006A4E\}/);

    const note = await readFile(join(outDir, "note", "index.html"), "utf8");
    assert.match(note, /Fragment Note/);
    assert.match(note, /article class="prose"/);

    const dash = await readFile(join(outDir, "dashboard.html"), "utf8");
    assert.match(dash, /\.\/dashboard\//);

    const fert = await readFile(join(outDir, "fertilizer.html"), "utf8");
    assert.match(fert, /url=\.\//);

    const long = await readFile(join(outDir, "Fertilizer_Distribution_Reform_Report_Ministerial_Briefing.html"), "utf8");
    assert.match(long, /\.\/briefing\//);

    const redir = await readFile(join(outDir, "old-name", "index.html"), "utf8");
    assert.match(redir, /\.\.\/briefing\//);

    await stat(join(outDir, "files", "report.pdf"));
    await stat(join(outDir, "files", "broken.pdf"));
    await stat(join(outDir, "404.html"));
  });

  it("writes 1200x630 og images and honors override", async () => {
    const ogPath = join(outDir, "briefing", "og.png");
    const meta = await sharp(ogPath).metadata();
    assert.equal(meta.width, 1200);
    assert.equal(meta.height, 630);
    const overrideMeta = await sharp(join(outDir, "override-doc", "og.png")).metadata();
    assert.equal(overrideMeta.width, 1200);
    assert.equal(overrideMeta.height, 630);
    const fallback = await sharp(join(outDir, "note", "og.png")).metadata();
    assert.equal(fallback.width, 1200);
    assert.equal(fallback.height, 630);
    assert.ok(config.warnings.some((w) => /unreadable OG override/i.test(w)));
  });

  it("catalog nav sitemap use absolute urls and omit redirects", async () => {
    const catalog = await readFile(join(outDir, "index.html"), "utf8");
    assert.match(catalog, /href="briefing\/"/);
    assert.match(catalog, /canonical" href="https:\/\/example.com\/fertilizer\/"/);
    assert.doesNotMatch(catalog, /old-name/);

    const sitemap = await readFile(join(outDir, "sitemap.xml"), "utf8");
    assert.match(sitemap, /<loc>https:\/\/example.com\/fertilizer\/<\/loc>/);
    assert.match(sitemap, /<loc>https:\/\/example.com\/fertilizer\/briefing\/<\/loc>/);
    assert.doesNotMatch(sitemap, /old-name/);
    assert.doesNotMatch(sitemap, /og\.png/);
    assert.doesNotMatch(sitemap, /\/files\//);

    const robots = await readFile(join(outDir, "robots.txt"), "utf8");
    assert.match(robots, /Sitemap: https:\/\/example.com\/fertilizer\/sitemap.xml/);
  });

  it("yaml title wins", async () => {
    const html = await readFile(join(outDir, "override-doc", "index.html"), "utf8");
    assert.match(html, /Override Title/);
  });

  it("suffixes colliding slugs", async () => {
    await stat(join(outDir, "note", "index.html"));
    await stat(join(outDir, "note-2", "index.html"));
    assert.ok(config.warnings.some((w) => /collision/i.test(w)));
  });
});
