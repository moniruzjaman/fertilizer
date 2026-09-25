import * as cheerio from "cheerio";
import { seoTags, slimNav } from "./templates.js";

export function innerHtml(html) {
  const $ = cheerio.load(String(html || ""), { decodeEntities: false });
  if ($("body").length) return $("body").html() || "";
  return String(html || "");
}

export function injectRichHtml(html, page, pages, config) {
  const $ = cheerio.load(String(html || ""), { decodeEntities: false });
  if (!$("html").length) {
    return null;
  }
  if (!$("head").length) $("html").prepend("<head></head>");
  if (!$("title").length) $("head").prepend(`<title></title>`);
  $("title").text(page.title);
  $("link[rel='canonical'], meta[property^='og:'], meta[name^='twitter:'], meta[name='description'], meta[name='robots'], script[type='application/ld+json']").remove();
  $("head").append(seoTags(page, config));
  if (!$("body").length) $("html").append("<body></body>");
  $(".site-slim-nav").remove();
  $("body").prepend(slimNav(pages, config, page.slug));
  if ($("html").length !== 1) {
    throw new Error("rich HTML inject produced nested html");
  }
  return $.html();
}
