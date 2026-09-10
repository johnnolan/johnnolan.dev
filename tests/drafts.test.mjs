import assert from "node:assert/strict";
import test from "node:test";
import { mkdtemp, mkdir, writeFile, readFile, rm, access } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
const exec = promisify(execFile);
const root = fileURLToPath(new URL("../", import.meta.url));

test("production drops draft HTML and collections, including stale preview output", async () => {
  const fixture = await mkdtemp(path.join(tmpdir(), "drafts-test-"));
  try {
    await mkdir(path.join(fixture, "src"));
    await mkdir(path.join(fixture, "scripts"));
    await writeFile(
      path.join(fixture, "scripts/clean-site.mjs"),
      await readFile(path.join(root, "scripts/clean-site.mjs")),
    );
    await writeFile(
      path.join(fixture, "eleventy.config.mjs"),
      `
      import { drafts } from ${JSON.stringify(pathToFileURL(path.join(root, "src/modules/drafts.mjs")).href)};
      export default function(config) { config.addPlugin(drafts); }
      export const config = { dir: { input: "src", output: "_site" }, templateFormats: ["md", "njk"] };
    `,
    );
    await writeFile(
      path.join(fixture, "src/draft.md"),
      "---\ndraft: true\ntags: [posts]\n---\nUnpublished content",
    );
    await writeFile(
      path.join(fixture, "src/published.md"),
      "---\ntags: [posts]\n---\nPublished content",
    );
    await writeFile(path.join(fixture, "src/index.njk"), "{{ collections.posts | length }}");
    const build = async (includeDrafts) => {
      await exec(process.execPath, [path.join(fixture, "scripts/clean-site.mjs")]);
      return exec(process.execPath, [path.join(root, "node_modules/@11ty/eleventy/cmd.cjs")], {
        cwd: fixture,
        env: { ...process.env, INCLUDE_DRAFTS: includeDrafts ? "true" : "" },
      });
    };
    await build(true);
    await access(path.join(fixture, "_site/draft/index.html"));
    assert.equal(await readFile(path.join(fixture, "_site/index.html"), "utf8"), "2");
    await build(false);
    await assert.rejects(access(path.join(fixture, "_site/draft/index.html")));
    assert.equal(await readFile(path.join(fixture, "_site/index.html"), "utf8"), "1");
    await writeFile(path.join(fixture, "src/draft.md"), '---\ndraft: "true"\n---\nBad flag');
    await assert.rejects(build(false));
  } finally {
    await rm(fixture, { recursive: true, force: true });
  }
});
