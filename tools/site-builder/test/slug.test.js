import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { cleanedFilename, slugify, uniqueSlug } from "../src/slug.js";

describe("slugify", () => {
  it("lowercases and hyphenates", () => {
    assert.equal(slugify("Hello World"), "hello-world");
  });
  it("trims hyphens and caps length", () => {
    assert.equal(slugify("---Foo---"), "foo");
    assert.equal(slugify("a".repeat(90)).length, 80);
  });
  it("never returns empty", () => {
    assert.equal(slugify("@@@"), "page");
  });
});

describe("uniqueSlug", () => {
  it("suffixes collisions with -2", () => {
    const used = new Set(["note"]);
    assert.equal(uniqueSlug("note", used), "note-2");
    assert.equal(uniqueSlug("note", used), "note-3");
  });
});

describe("cleanedFilename", () => {
  it("turns hyphens into words", () => {
    assert.equal(cleanedFilename("briefing-report.html"), "briefing report");
  });
});
