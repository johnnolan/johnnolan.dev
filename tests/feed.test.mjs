import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { mkdtemp, mkdir, readFile, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { promisify } from "node:util";
import test from "node:test";
import { load } from "cheerio";
import { atomDate, feedUpdated } from "../src/modules/feed.js";

const root = fileURLToPath(new URL("../", import.meta.url));
const exec = promisify(execFile);
const moduleUrl = (file) => JSON.stringify(pathToFileURL(path.join(root, file)).href);

test("Atom dates accept quoted dates and use deterministic empty-feed metadata", () => {
  assert.equal(atomDate("2025-03-02"), "2025-03-02T00:00:00Z");
  assert.equal(atomDate(new Date("2025-03-02")), "2025-03-02T00:00:00Z");
  assert.equal(feedUpdated([]), "1970-01-01");
  assert.throws(() => atomDate(undefined));
});

test("the real Atom template preserves IDs and publication order when older posts are revised", async () => {
  const fixture = await mkdtemp(path.join(tmpdir(), "feed-test-"));
  try {
    await mkdir(path.join(fixture, "src/articles"), { recursive: true });
    await writeFile(
      path.join(fixture, "src/feed.njk"),
      await readFile(path.join(root, "src/feed.njk")),
    );
    await writeFile(
      path.join(fixture, "eleventy.config.mjs"),
      `
      import rss from ${moduleUrl("node_modules/@11ty/eleventy-plugin-rss/.eleventy.js")};
      import collections from ${moduleUrl("src/modules/content-collections.mjs")};
      import { drafts } from ${moduleUrl("src/modules/drafts.mjs")};
      import { atomDate, feedUpdated } from ${moduleUrl("src/modules/feed.js")};
      export default function(config) {
        config.addPlugin(rss); config.addPlugin(collections); config.addPlugin(drafts);
        config.addFilter("atomDate", atomDate); config.addFilter("feedUpdated", feedUpdated);
        config.addGlobalData("site", { name: "Name & Example", description: "A < B", url: "https://example.com" });
        config.addTransform("imageFixture", function(content) { return content.replaceAll("/source.png", "/img/static.png"); });
        return { dir: { input: "src", output: "out" }, templateFormats: ["njk", "md"], markdownTemplateEngine: false };
      }
    `,
    );
    const older = path.join(fixture, "src/articles/older.md");
    const article = (updated = "") =>
      `---\ntitle: "Older & wiser"\ndate: "2024-01-01"\n${updated}---\n![Example](/source.png)\n\n\`\`\`html\n<div>example</div>\n\`\`\`\n`;
    await writeFile(older, article());
    await writeFile(
      path.join(fixture, "src/articles/newer.md"),
      "---\ntitle: Newer\ndate: 2025-01-01\n---\nNewer",
    );
    await writeFile(
      path.join(fixture, "src/articles/draft.md"),
      "---\ntitle: Secret\ndate: 2026-01-01\ndraft: true\n---\nSecret",
    );
    const build = async () => {
      await exec(process.execPath, [path.join(root, "node_modules/@11ty/eleventy/cmd.cjs")], {
        cwd: fixture,
        env: { ...process.env, INCLUDE_DRAFTS: "true", ELEVENTY_RUN_MODE: "build" },
      });
      return load(await readFile(path.join(fixture, "out/feed.xml"), "utf8"), { xml: true });
    };
    let $ = await build();
    const ids = $("entry > id")
      .map((_, node) => $(node).text())
      .get();
    assert.deepEqual(ids, [
      "https://example.com/articles/newer/",
      "https://example.com/articles/older/",
    ]);
    await writeFile(older, article('updated: "2025-06-01"\n'));
    $ = await build();
    assert.equal($("feed").attr("xmlns"), "http://www.w3.org/2005/Atom");
    assert.equal($("feed > title").text(), "Name & Example");
    assert.equal($("feed > subtitle").text(), "A < B");
    assert.deepEqual(
      $("entry > id")
        .map((_, node) => $(node).text())
        .get(),
      ids,
    );
    assert.equal($("feed > updated").text(), "2025-06-01T00:00:00Z");
    const entry = $("entry").last();
    assert.equal(entry.find("published").text(), "2024-01-01T00:00:00Z");
    assert.equal(entry.find("updated").text(), "2025-06-01T00:00:00Z");
    assert.equal(entry.find("title").text(), "Older & wiser");
    const html = load(entry.find("content").text());
    assert.equal(html("img").attr("src"), "https://example.com/img/static.png");
    assert.equal(html("code").text().trim(), "<div>example</div>");
  } finally {
    await rm(fixture, { recursive: true, force: true });
  }
});
