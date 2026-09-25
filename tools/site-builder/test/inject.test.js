import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { injectRichHtml, innerHtml } from "../src/inject.js";
import { fragmentPageHtml } from "../src/templates.js";

const config = { siteBase: "https://example.com/fertilizer" };
const page = { slug: "dash", title: "Dash", description: "Desc", type: "rich-html", noindex: false };
const pages = [page];

describe("injectRichHtml", () => {
  it("injects seo nav and keeps existing css", () => {
    const html = `<!DOCTYPE html><html><head><title>Old</title><style>.keep{color:red}</style></head><body><h1>Body</h1></body></html>`;
    const out = injectRichHtml(html, page, pages, config);
    assert.match(out, /og:image/);
    assert.match(out, /canonical/);
    assert.match(out, /site-slim-nav/);
    assert.match(out, /\.keep\{color:red\}/);
    assert.equal((out.match(/<html(\s|>)/gi) || []).length, 1);
    assert.match(out, /<title>Dash<\/title>/);
    assert.match(out, /twitter:card/);
    assert.match(out, /summary_large_image/);
  });
});

describe("fragment wrap", () => {
  it("wraps inner html in site template", () => {
    const inner = innerHtml("<h1>Hi</h1><p>There</p>");
    const out = fragmentPageHtml({ ...page, slug: "note", type: "fragment" }, pages, config, inner);
    assert.match(out, /<article class="prose">/);
    assert.match(out, /<h1>Hi<\/h1>/);
    assert.equal((out.match(/<html(\s|>)/gi) || []).length, 1);
  });
});
