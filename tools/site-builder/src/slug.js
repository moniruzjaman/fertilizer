export function slugify(input) {
  const slug = String(input || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80)
    .replace(/-+$/g, "");
  return slug || "page";
}

export function stem(filename) {
  return String(filename).replace(/\.[^.]+$/, "");
}

export function cleanedFilename(filename) {
  const text = stem(filename)
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return text || "page";
}

export function uniqueSlug(desired, used) {
  let slug = desired;
  let n = 2;
  while (used.has(slug)) {
    const suffix = `-${n}`;
    slug = `${desired.slice(0, Math.max(1, 80 - suffix.length))}${suffix}`;
    n += 1;
  }
  used.add(slug);
  return slug;
}
