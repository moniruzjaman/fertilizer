import { basename } from "node:path";
import * as cheerio from "cheerio";
import { cleanedFilename } from "./slug.js";

function normalizeDate(value) {
  if (value == null || value === "") return "";
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value.toISOString().slice(0, 10);
  }
  const text = String(value).trim();
  const iso = text.match(/^(\d{4}-\d{2}-\d{2})/);
  if (iso) return iso[1];
  const parsed = Date.parse(text);
  if (!Number.isNaN(parsed)) return new Date(parsed).toISOString().slice(0, 10);
  return "";
}

function firstNonEmpty(...values) {
  for (const value of values) {
    if (value == null) continue;
    const text = String(value).trim();
    if (text && text.toLowerCase() !== "untitled") return text;
  }
  return "";
}

export function extractHtmlMeta(html) {
  const $ = cheerio.load(html, { decodeEntities: true });
  const title = firstNonEmpty($("title").first().text(), $("h1").first().text());
  const description = firstNonEmpty(
    $('meta[name="description"]').attr("content"),
    $('meta[property="og:description"]').attr("content")
  );
  const date = firstNonEmpty(
    $('meta[name="date"]').attr("content"),
    $("time[datetime]").attr("datetime")
  );
  const heading = firstNonEmpty($("h1").first().text());
  return { title, description, date, heading };
}

export function extractPdfMeta(doc) {
  const info = doc && doc.info ? doc.info : {};
  const title = firstNonEmpty(info.Title);
  const description = firstNonEmpty(info.Subject);
  let date = "";
  const raw = info.CreationDate || info.ModDate;
  if (raw) {
    const match = String(raw).match(/D:(\d{4})(\d{2})(\d{2})/);
    if (match) date = `${match[1]}-${match[2]}-${match[3]}`;
  }
  return { title, description, date, heading: "" };
}

export function resolveMeta({ filename, yamlMeta = {}, htmlMeta = {}, pdfMeta = {} }) {
  const fallback = cleanedFilename(basename(filename));
  return {
    title: firstNonEmpty(yamlMeta.title, htmlMeta.title, pdfMeta.title, htmlMeta.heading, pdfMeta.heading, fallback) || fallback,
    description: firstNonEmpty(yamlMeta.description, htmlMeta.description, pdfMeta.description),
    date: firstNonEmpty(normalizeDate(yamlMeta.date), normalizeDate(htmlMeta.date), normalizeDate(pdfMeta.date)),
    slugOverride: yamlMeta.slug ? String(yamlMeta.slug).trim() : "",
    typeOverride: yamlMeta.type || "",
    noindex: Boolean(yamlMeta.noindex)
  };
}

export function jsonLd(page, config) {
  const url = `${config.siteBase}/${page.slug}/`;
  if (page.type === "pdf") {
    return {
      "@context": "https://schema.org",
      "@type": "DigitalDocument",
      name: page.title,
      description: page.description || undefined,
      url,
      encodingFormat: "application/pdf",
      contentUrl: `${config.siteBase}/files/${page.slug}.pdf`
    };
  }
  return {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: page.title,
    description: page.description || undefined,
    url
  };
}
