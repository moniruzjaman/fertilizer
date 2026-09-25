import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { extractHtmlMeta, extractPdfMeta, resolveMeta } from "../src/meta.js";

describe("extractHtmlMeta", () => {
  it("reads title description date and heading", () => {
    const html = `<html><head><title>T1</title><meta name="description" content="D1"><meta name="date" content="2026-01-02"></head><body><h1>H1</h1><time datetime="2026-03-04">x</time></body></html>`;
    assert.deepEqual(extractHtmlMeta(html), { title: "T1", description: "D1", date: "2026-01-02", heading: "H1" });
  });
});

describe("extractPdfMeta", () => {
  it("parses PDF dates", () => {
    const meta = extractPdfMeta({ info: { Title: "PT", Subject: "PS", CreationDate: "D:20260115120000" } });
    assert.equal(meta.title, "PT");
    assert.equal(meta.description, "PS");
    assert.equal(meta.date, "2026-01-15");
  });
});

describe("resolveMeta", () => {
  it("uses yaml then tags then pdf then heading then filename", () => {
    const a = resolveMeta({
      filename: "file-name.html",
      yamlMeta: { title: "Y", description: "YD", date: "2020-01-01" }
    });
    assert.equal(a.title, "Y");
    const b = resolveMeta({
      filename: "file-name.html",
      htmlMeta: { title: "H", description: "HD" }
    });
    assert.equal(b.title, "H");
    const c = resolveMeta({
      filename: "file-name.html",
      pdfMeta: { title: "P" }
    });
    assert.equal(c.title, "P");
    const d = resolveMeta({
      filename: "file-name.html",
      htmlMeta: { heading: "Head" }
    });
    assert.equal(d.title, "Head");
    const e = resolveMeta({ filename: "file-name.html" });
    assert.equal(e.title, "file name");
    const f = resolveMeta({ filename: "x.html", htmlMeta: { title: "Untitled" } });
    assert.equal(f.title, "x");
    const g = resolveMeta({
      filename: "x.html",
      yamlMeta: { date: new Date(Date.UTC(2026, 0, 1)) }
    });
    assert.equal(g.date, "2026-01-01");
  });
});
