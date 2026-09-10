import assert from "node:assert/strict";
import test from "node:test";
import { sitemapPages, sitemapXml } from "../src/modules/sitemap.mjs";

test("sitemap includes explicit indexes and IAM articles, deduplicates and excludes drafts", () => {
  const home = { inputPath: "./src/index.njk", url: "/", data: { sitemap: true } };
  const article = {
    inputPath: "./src/identity-access-management/articles/test.md",
    url: "/iam/test/",
    data: { title: "Test", date: "2025-01-01", updated: "2025-02-02" },
  };
  const pages = sitemapPages([
    home,
    home,
    article,
    { ...article, url: "/draft/", data: { ...article.data, draft: true } },
    { ...home, url: "/hidden/", data: { sitemap: false } },
    { inputPath: "./src/scss/main.scss", url: "/assets/main.css", data: {} },
  ]);
  assert.equal(pages.length, 2);
  const xml = sitemapXml(pages, "https://example.com");
  assert.match(xml, /<loc>https:\/\/example.com\/<\/loc>\n {2}<\/url>/);
  assert.match(xml, /<lastmod>2025-02-02<\/lastmod>/);
  assert.equal((xml.match(/<lastmod>/g) || []).length, 1);
  assert.match(sitemapXml([{ ...home, url: "/?a=1&b=2" }], "https://example.com"), /a=1&amp;b=2/);
});
