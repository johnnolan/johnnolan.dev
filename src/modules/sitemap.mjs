import { isArticle } from "./content-collections.mjs";
import { isoDate } from "../filters/date-filters.js";

export function sitemapPages(items) {
  const urls = new Map();
  for (const item of items) {
    if (item.data.draft === true || item.data.sitemap === false || !item.url) continue;
    if (!(item.data.sitemap === true || (isArticle(item) && item.data.title && item.data.date)))
      continue;
    urls.set(item.url, item);
  }
  return [...urls.values()].sort((a, b) => a.url.localeCompare(b.url, "en"));
}

const escapeXml = (value) =>
  String(value).replace(
    /[<>&"']/g,
    (char) =>
      ({
        "<": "&lt;",
        ">": "&gt;",
        "&": "&amp;",
        '"': "&quot;",
        "'": "&apos;",
      })[char],
  );

export function editorialDate(value) {
  return isoDate(value) || undefined;
}

export function sitemapXml(items, baseUrl) {
  const entries = items.map(({ url, data }) => {
    const lastmod = editorialDate(data.updated ?? data.date);
    return `  <url>\n    <loc>${escapeXml(new URL(url, baseUrl).href)}</loc>${lastmod ? `\n    <lastmod>${lastmod}</lastmod>` : ""}\n  </url>`;
  });
  return (
    '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
    entries.join("\n") +
    "\n</urlset>\n"
  );
}

export default function sitemap(config) {
  config.addCollection("sitemapPages", (collection) => sitemapPages(collection.getAll()));
  config.addFilter("sitemapXml", sitemapXml);
}
