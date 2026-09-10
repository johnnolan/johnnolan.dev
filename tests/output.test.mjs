import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { globSync } from "node:fs";
import path from "node:path";
import test from "node:test";
import { load } from "cheerio";

const outputRoot = path.resolve("_site");
const siteOrigin = "https://www.johnnolan.dev";
const baseline = JSON.parse(readFileSync("tests/fixtures/output-baseline.json", "utf8"));
const htmlFiles = globSync("_site/**/*.html").sort();

function outputPath(urlPath) {
  const pathname = decodeURI(urlPath).replace(/^\//, "");
  if (!pathname || pathname.endsWith("/")) return path.join(outputRoot, pathname, "index.html");
  return path.join(outputRoot, pathname);
}

function localUrl(value, base = siteOrigin) {
  if (!value || value.startsWith("#")) return null;
  try {
    const url = new URL(value, base);
    return url.origin === siteOrigin ? url : null;
  } catch {
    return null;
  }
}

test("homepage contains twelve real article cards", () => {
  const $ = load(readFileSync("_site/index.html", "utf8"));
  assert.equal($("main .articles .post-list > article.article").length, 12);
});

test("published IAM articles are indexed and drafts are excluded", () => {
  const sitemap = readFileSync("_site/sitemap.xml", "utf8");
  for (const file of globSync("_site/identity-access-management/articles/**/index.html")) {
    const url = `/${path.relative(outputRoot, path.dirname(file)).split(path.sep).join("/")}/`;
    assert.match(sitemap, new RegExp(`${siteOrigin}${url}`));
  }

  for (const source of globSync("src/**/articles/*.md")) {
    const markdown = readFileSync(source, "utf8");
    if (!/^draft:\s*true\s*$/m.test(markdown)) continue;
    const relative = path.relative("src", source).replace(/\.md$/, "/index.html");
    assert.equal(existsSync(path.join(outputRoot, relative)), false, `${source} was published`);
  }
});

test("article URLs and heading fragments retain their semantic baseline", () => {
  const actual = baseline.map(({ url }) => {
    const $ = load(readFileSync(outputPath(url), "utf8"));
    return { url, headings: $("main article h2[id]").map((_, node) => $(node).attr("id")).get() };
  });
  assert.deepEqual(actual, baseline);
});

test("JSON-LD parses and local image references exist", () => {
  for (const file of htmlFiles) {
    const $ = load(readFileSync(file, "utf8"));
    const pageUrl = new URL(`/${path.relative(outputRoot, file).replace(/index\.html$/, "").split(path.sep).join("/")}`, siteOrigin);
    $("script[type='application/ld+json']").each((_, node) => {
      assert.doesNotThrow(() => JSON.parse($(node).text()), `Invalid JSON-LD in ${file}`);
    });

    $("img[src], meta[property='og:image'][content]").each((_, node) => {
      const value = $(node).attr("src") ?? $(node).attr("content");
      const url = localUrl(value, pageUrl);
      if (url) assert.ok(existsSync(outputPath(url.pathname)), `Missing ${url.pathname} from ${file}`);
    });
  }
});

test("local links resolve and TOC fragments target headings", () => {
  for (const file of htmlFiles) {
    const $ = load(readFileSync(file, "utf8"));
    const pageUrl = new URL(`/${path.relative(outputRoot, file).replace(/index\.html$/, "").split(path.sep).join("/")}`, siteOrigin);
    $("a[href]").each((_, node) => {
      const href = $(node).attr("href");
      if (/^(mailto:|tel:|javascript:)/.test(href)) return;
      if (href.startsWith("#")) {
        assert.ok($(`[id='${href.slice(1).replaceAll("'", "\\'")}']`).length, `Missing ${href} in ${file}`);
        return;
      }
      const url = localUrl(href, pageUrl);
      if (!url) return;
      const target = outputPath(url.pathname);
      assert.ok(existsSync(target), `Broken ${href} in ${file}`);
      if (url.hash && target.endsWith(".html")) {
        const targetPage = load(readFileSync(target, "utf8"));
        assert.ok(targetPage(`[id='${url.hash.slice(1)}']`).length, `Missing ${url.hash} in ${target}`);
      }
    });
  }
});
