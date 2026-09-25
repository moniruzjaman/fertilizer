import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { classify, isAllowedInboxFile } from "../src/classify.js";

describe("classify", () => {
  it("classifies pdf by extension", () => {
    assert.equal(classify("doc.pdf", ""), "pdf");
  });
  it("classifies styled full documents as rich-html", () => {
    const html = "<html><head><style>body{color:red}</style></head><body><h1>Hi</h1></body></html>";
    assert.equal(classify("a.html", html), "rich-html");
  });
  it("classifies stylesheet link as rich-html", () => {
    const html = '<html><head><link rel="stylesheet" href="x.css"></head><body></body></html>';
    assert.equal(classify("a.html", html), "rich-html");
  });
  it("classifies unstyled html as fragment", () => {
    const html = "<html><body><h1>Hi</h1></body></html>";
    assert.equal(classify("a.html", html), "fragment");
  });
  it("honors force markers and yaml override", () => {
    assert.equal(classify("a.html", "<!-- site:fragment --><html><style></style></html>"), "fragment");
    assert.equal(classify("a.html", "<!-- site:rich --><p>x</p>"), "rich-html");
    assert.equal(classify("a.html", "<p>x</p>", "pdf"), "pdf");
  });
});

describe("isAllowedInboxFile", () => {
  it("allows pdf html htm only", () => {
    assert.equal(isAllowedInboxFile("a.pdf"), true);
    assert.equal(isAllowedInboxFile("a.html"), true);
    assert.equal(isAllowedInboxFile("a.htm"), true);
    assert.equal(isAllowedInboxFile("a.docx"), false);
    assert.equal(isAllowedInboxFile("a.png"), false);
  });
});
