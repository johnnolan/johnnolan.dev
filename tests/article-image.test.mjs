import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { cp, mkdtemp, mkdir, readFile, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { promisify } from "node:util";
import test from "node:test";
import { load } from "cheerio";
import { buildPageMetadata } from "../src/modules/page-metadata.js";

const root = fileURLToPath(new URL("../", import.meta.url));
const exec = promisify(execFile);

test("listing images and page metadata share defaults, preserve overrides and ignore legacy dimensions", async () => {
  const fixture = await mkdtemp(path.join(tmpdir(), "article-images-"));
  const site = {
    name: "Example",
    url: "https://example.com",
    socialImage: "/assets/default.jpg",
    authorImage: "/assets/author.jpg",
  };
  const articles = [undefined, "/assets/custom.jpg", "assets/legacy.jpg"].map((image, i) => ({
    url: `/post-${i}/`,
    data: {
      title: "Example",
      date: "2025-01-01",
      image,
      topics: [],
      imagewidth: "123",
      imageheight: "456",
    },
  }));
  const url = (file) => JSON.stringify(pathToFileURL(path.join(root, file)).href);
  try {
    await mkdir(path.join(fixture, "src/_includes"), { recursive: true });
    await cp(path.join(root, "src/_includes/macros"), path.join(fixture, "src/_includes/macros"), {
      recursive: true,
    });
    await writeFile(
      path.join(fixture, "eleventy.config.mjs"),
      `
      import articleImage from ${url("src/filters/article-image.js")};
      import { displayDate, isoDate } from ${url("src/filters/date-filters.js")};
      export default function(config) {
        config.addFilter("articleImage", articleImage);
        config.addFilter("displayDate", displayDate); config.addFilter("isoDate", isoDate);
        config.addGlobalData("site", ${JSON.stringify(site)});
        config.addGlobalData("articles", ${JSON.stringify(articles)});
        return { dir: { input: "src", output: "out" }, templateFormats: ["njk"] };
      }
    `,
    );
    await writeFile(
      path.join(fixture, "src/index.njk"),
      '{% from "macros/indexlist.njk" import indexList %}{{ indexList("Posts", "", articles, site, true) }}',
    );
    await exec(process.execPath, [path.join(root, "node_modules/@11ty/eleventy/cmd.cjs")], {
      cwd: fixture,
    });
    const $ = load(await readFile(path.join(fixture, "out/index.html"), "utf8"));
    assert.equal($("img").length, 3);
    $("img").each((index, node) => {
      const expected = ["/assets/default.jpg", "/assets/custom.jpg", "/assets/legacy.jpg"][index];
      assert.equal($(node).attr("src"), expected);
      assert.equal($(node).attr("width"), undefined);
      assert.equal($(node).attr("height"), undefined);
      assert.equal(
        buildPageMetadata(articles[index].data, site).imageUrl,
        `https://example.com${expected}`,
      );
    });
  } finally {
    await rm(fixture, { recursive: true, force: true });
  }
});
