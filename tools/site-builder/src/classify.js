import { extname } from "node:path";

export function classify(filename, html = "", typeOverride) {
  if (typeOverride === "pdf" || typeOverride === "rich-html" || typeOverride === "fragment") {
    return typeOverride;
  }
  const ext = extname(filename).toLowerCase();
  if (ext === ".pdf") return "pdf";
  const text = String(html || "");
  if (/<!--\s*site:fragment\s*-->/i.test(text)) return "fragment";
  if (/<!--\s*site:rich\s*-->/i.test(text)) return "rich-html";
  const hasHtml = /<html(\s|>)/i.test(text);
  const hasStyle = /<style(\s|>)/i.test(text) || /<link\b[^>]*rel\s*=\s*['"]stylesheet['"]/i.test(text);
  if (hasHtml && hasStyle) return "rich-html";
  return "fragment";
}

export function isAllowedInboxFile(filename) {
  const ext = extname(filename).toLowerCase();
  return ext === ".pdf" || ext === ".html" || ext === ".htm";
}
