import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { mkdtemp, mkdir, writeFile, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { promisify } from "node:util";
import test from "node:test";
const exec = promisify(execFile);
const root = fileURLToPath(new URL("../", import.meta.url));

test("articles inherit layout, contributor, category and section backlink", async () => {
  const fixture = await mkdtemp(path.join(tmpdir(), "article-defaults-"));
  try {
    await mkdir(path.join(fixture, "src/_includes/layouts"), { recursive: true });
    await writeFile(path.join(fixture, "package.json"), '{"type":"module"}');
    await writeFile(
      path.join(fixture, "eleventy.config.mjs"),
      'export default {dir: {input: "src", output: "out"}, templateFormats: ["md", "njk"]};',
    );
    await writeFile(
      path.join(fixture, "src/_includes/layouts/article.njk"),
      '{{ contributors | join(", ") }}|{{ category }}|{{ backLink }}|{{ content | safe }}',
    );
    const defaults = pathToFileURL(path.join(root, "src/modules/article-defaults.js")).href;
    for (const [section, category] of [
      ["hcta", "hcta", "/hcta/"],
      ["random", "other", "/random/"],
      ["identity-access-management", "iam", "/identity-access-management/"],
    ]) {
      const dir = path.join(fixture, "src", section, "articles");
      await mkdir(dir, { recursive: true });
      await writeFile(
        path.join(dir, "articles.11tydata.js"),
        `import defaults from ${JSON.stringify(defaults)}; export default defaults(${JSON.stringify(category)});`,
      );
      await writeFile(
        path.join(dir, "post.md"),
        "---\ntitle: Title\ndescription: Description\ndate: 2025-01-01\ntopics: []\n---\nBody",
      );
    }
    await exec(process.execPath, [path.join(root, "node_modules/@11ty/eleventy/cmd.cjs")], {
      cwd: fixture,
    });
    for (const [section, category] of [
      ["hcta", "hcta"],
      ["random", "other"],
      ["identity-access-management", "iam"],
    ]) {
      const html = await readFile(
        path.join(fixture, "out", section, "articles/post/index.html"),
        "utf8",
      );
      assert.equal(html, `John Nolan|${category}|/${section}/|<p>Body</p>\n`);
    }
  } finally {
    await rm(fixture, { recursive: true, force: true });
  }
});
