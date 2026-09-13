import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { globSync } from "node:fs";
import path from "node:path";
import test from "node:test";
import { load } from "cheerio";
import { validateOutputMode } from "./helpers/output-mode.mjs";

const outputRoot = path.resolve(process.env.SITE_OUTPUT_DIR || "_site");
const preview = process.env.SITE_OUTPUT_MODE === "preview";
const siteFile = (file) => path.join(outputRoot, file);
const siteOrigin = "https://www.johnnolan.dev";
const baseline = JSON.parse(readFileSync("tests/fixtures/output-baseline.json", "utf8"));
validateOutputMode(outputRoot, process.env.SITE_OUTPUT_MODE || "production");
const htmlFiles = globSync("**/*.html", { cwd: outputRoot }).sort().map(siteFile);

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
  const $ = load(readFileSync(siteFile("index.html"), "utf8"));
  assert.equal($("main .articles .post-list > article.article").length, 12);
});

test("Atom entries match published pages and all embedded local assets resolve", () => {
  const xml = readFileSync(siteFile("feed.xml"), "utf8");
  const feed = load(xml, { xml: true });
  assert.equal(feed("feed").attr("xmlns"), "http://www.w3.org/2005/Atom");
  const pages = htmlFiles
    .flatMap((file) => {
      const $ = load(readFileSync(file, "utf8"));
      if (!$(".article-page").length || $(".draft-notice").length) return [];
      const metadata = JSON.parse($("script[type='application/ld+json']").text());
      return [metadata];
    })
    .sort(
      (a, b) => b.datePublished.localeCompare(a.datePublished) || a.url.localeCompare(b.url, "en"),
    );
  const entries = feed("feed > entry");
  assert.equal(entries.length, pages.length);
  const ids = entries.map((_, entry) => feed(entry).find("id").text()).get();
  assert.deepEqual(
    ids,
    pages.map((page) => page.url),
  );
  assert.equal(new Set(ids).size, ids.length);
  let latest = "1970-01-01T00:00:00Z";
  entries.each((index, entry) => {
    const item = feed(entry);
    const page = pages[index];
    const published = `${page.datePublished}T00:00:00Z`;
    const updated = `${page.dateModified || page.datePublished}T00:00:00Z`;
    assert.equal(item.find("link").attr("href"), page.url);
    assert.equal(item.find("published").text(), published);
    assert.equal(item.find("updated").text(), updated);
    if (updated > latest) latest = updated;
    assert.equal(item.find("content").attr("type"), "html");
    assert.equal(item.find("content").children().length, 0, "Feed HTML must be XML-escaped");
    const html = load(item.find("content").text());
    const check = (value) => {
      assert.match(value, /^https?:\/\//, `Relative feed asset: ${value}`);
      const url = new URL(value);
      assert.ok(!url.pathname.includes("/_includes/"), `Source path in feed: ${value}`);
      if (url.origin === siteOrigin)
        assert.ok(existsSync(outputPath(url.pathname)), `Missing feed asset: ${value}`);
    };
    html("img[src]").each((_, image) => check(html(image).attr("src")));
    html("[srcset]").each((_, image) => {
      // Eleventy Image generates comma-separated static URLs and width descriptors.
      for (const candidate of html(image).attr("srcset").split(","))
        check(candidate.trim().split(/\s+/)[0]);
    });
  });
  assert.equal(feed("feed > updated").text(), latest);
});

test("published IAM articles are indexed and drafts are excluded", () => {
  const sitemap = readFileSync(siteFile("sitemap.xml"), "utf8");
  for (const file of globSync("identity-access-management/articles/**/index.html", {
    cwd: outputRoot,
  }).map(siteFile)) {
    if (load(readFileSync(file, "utf8"))(".draft-notice").length) continue;
    const url = `/${path.relative(outputRoot, path.dirname(file)).split(path.sep).join("/")}/`;
    assert.match(sitemap, new RegExp(`${siteOrigin}${url}`));
  }

  for (const source of globSync("src/**/articles/*.md")) {
    const markdown = readFileSync(source, "utf8");
    if (!/^draft:\s*true\s*$/m.test(markdown)) continue;
    const relative = path.relative("src", source).replace(/\.md$/, "/index.html");
    assert.equal(
      existsSync(path.join(outputRoot, relative)),
      preview,
      `${source}: unexpected draft output for this mode`,
    );
    const url =
      "/" +
      relative
        .replace(/index\.html$/, "")
        .split(path.sep)
        .join("/");
    assert.ok(!sitemap.includes(url), `${source} is in the sitemap`);
    assert.ok(
      !readFileSync(siteFile("feed.xml"), "utf8").includes(url),
      `${source} is in the feed`,
    );
    for (const listing of [
      "index.html",
      "hcta/index.html",
      "identity-access-management/index.html",
      "random/index.html",
    ]) {
      const $ = load(readFileSync(siteFile(listing), "utf8"));
      assert.equal(
        $("a[href]").filter((_, node) => $(node).attr("href") === url).length,
        0,
        `${source} is in ${listing}`,
      );
    }
  }
});

test("article URLs and heading fragments retain their semantic baseline", () => {
  const actual = baseline.map(({ url }) => {
    const $ = load(readFileSync(outputPath(url), "utf8"));
    return {
      url,
      headings: $("main article h2[id]")
        .map((_, node) => $(node).attr("id"))
        .get(),
    };
  });
  assert.deepEqual(actual, baseline);
});

test("JSON-LD parses and local image references exist", () => {
  for (const file of htmlFiles) {
    const $ = load(readFileSync(file, "utf8"));
    const pageUrl = new URL(
      `/${path
        .relative(outputRoot, file)
        .replace(/index\.html$/, "")
        .split(path.sep)
        .join("/")}`,
      siteOrigin,
    );
    $("script[type='application/ld+json']").each((_, node) => {
      assert.doesNotThrow(() => JSON.parse($(node).text()), `Invalid JSON-LD in ${file}`);
    });

    $("img[src], meta[property='og:image'][content]").each((_, node) => {
      const value = $(node).attr("src") ?? $(node).attr("content");
      const url = localUrl(value, pageUrl);
      if (url)
        assert.ok(existsSync(outputPath(url.pathname)), `Missing ${url.pathname} from ${file}`);
    });
  }
});

test("Markdown article images use responsive images without changing full-size links", () => {
  const pages = [
    {
      file: siteFile("identity-access-management/articles/entra-iac-intro/index.html"),
      linkPattern: /^\/assets\/posts\/iam\/entra-iac-intro\//,
      pictureCount: 5,
    },
    {
      file: siteFile("hcta/articles/ams-tools-architecture/index.html"),
      linkPattern: /^\/assets\/posts\/ams-three\//,
      pictureCount: 9,
    },
    {
      file: siteFile("random/articles/debugging-javascript/index.html"),
      pictureCount: 7,
    },
  ];

  for (const page of pages) {
    const $ = load(readFileSync(page.file, "utf8"));
    const pictures = $("main article picture");
    assert.equal(pictures.length, page.pictureCount, page.file);
    pictures.each((_, picture) => {
      assert.match($(picture).find("source[type='image/webp']").attr("srcset"), /\/img\//);
      const image = $(picture).find("img");
      assert.equal(image.attr("loading"), "lazy");
      assert.equal(image.attr("decoding"), "async");
      assert.ok(image.attr("width"));
      assert.ok(image.attr("height"));
      if (page.linkPattern) {
        assert.match($(picture).parent("a").attr("href"), page.linkPattern);
      }
    });
  }
});

test("Markdown code is not interpreted as template syntax", () => {
  const html = readFileSync(siteFile("random/articles/react-callbacks-refs/index.html"), "utf8");
  assert.match(html, /ref=\{btnReview\s+=&gt; \{/);
  assert.ok(html.includes("this.btnReview = btnReview;\n }}\n)}&gt;"));
});

test("local links resolve and TOC fragments target headings", () => {
  for (const file of htmlFiles) {
    const $ = load(readFileSync(file, "utf8"));
    const pageUrl = new URL(
      `/${path
        .relative(outputRoot, file)
        .replace(/index\.html$/, "")
        .split(path.sep)
        .join("/")}`,
      siteOrigin,
    );
    $("a[href]").each((_, node) => {
      const href = $(node).attr("href");
      if (/^(mailto:|tel:|javascript:)/.test(href)) return;
      if (href.startsWith("#")) {
        assert.ok(
          $(`[id='${href.slice(1).replaceAll("'", "\\'")}']`).length,
          `Missing ${href} in ${file}`,
        );
        return;
      }
      const url = localUrl(href, pageUrl);
      if (!url) return;
      const target = outputPath(url.pathname);
      assert.ok(existsSync(target), `Broken ${href} in ${file}`);
      if (url.hash && target.endsWith(".html")) {
        const targetPage = load(readFileSync(target, "utf8"));
        assert.ok(
          targetPage(`[id='${url.hash.slice(1)}']`).length,
          `Missing ${url.hash} in ${target}`,
        );
      }
    });
  }
});
