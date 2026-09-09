import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { execFile } from "node:child_process";
import { mkdtemp, mkdir, readFile, writeFile, readdir, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { promisify } from "node:util";
import { fileURLToPath, pathToFileURL } from "node:url";
import test from "node:test";

const exec = promisify(execFile);
const root = fileURLToPath(new URL("../", import.meta.url));
const cli = path.join(root, "node_modules/@11ty/eleventy/cmd.cjs");

test("Sass builds cleanly, versions compiled imports, and excludes partials from output", async () => {
  const fixture = await mkdtemp(path.join(tmpdir(), "eleventy-sass-test-"));
  try {
    await mkdir(path.join(fixture, "src/scss/settings"), { recursive: true });
    const pluginUrl = pathToFileURL(path.join(root, "src/modules/eleventy-plugin-sass.mjs"));
    await writeFile(
      path.join(fixture, "eleventy.config.mjs"),
      `
      import sass from ${JSON.stringify(pluginUrl.href)};
      export default function(config) { config.addPlugin(sass); }
      export const config = { dir: { input: "src", output: "out" }, templateFormats: ["njk"] };
    `,
    );
    await writeFile(
      path.join(fixture, "src/scss/main.11tydata.json"),
      await readFile(path.join(root, "src/scss/main.11tydata.json")),
    );
    await writeFile(
      path.join(fixture, "src/scss/scss.11tydata.json"),
      await readFile(path.join(root, "src/scss/scss.11tydata.json")),
    );
    await writeFile(
      path.join(fixture, "src/scss/main.scss"),
      '@use "settings/tokens"; body { color: tokens.$color; }',
    );
    await writeFile(
      path.join(fixture, "src/index.njk"),
      '<link rel="stylesheet" href="/assets/main.css?v={{ cssHash }}">{{ collections.all | length }}',
    );
    const tokens = path.join(fixture, "src/scss/settings/_tokens.scss");
    const build = () => exec(process.execPath, [cli], { cwd: fixture });
    let previousHash;
    for (const color of ["red", "blue"]) {
      await writeFile(tokens, `$color: ${color};`);
      const { stderr } = await build();
      assert.doesNotMatch(stderr, /DEPRECATION WARNING/);
      const css = await readFile(path.join(fixture, "out/assets/main.css"), "utf8");
      assert.equal(css, `body{color:${color}}`);
      const hash = createHash("sha256").update(css).digest("hex").slice(0, 12);
      const html = await readFile(path.join(fixture, "out/index.html"), "utf8");
      assert.equal(html, `<link rel="stylesheet" href="/assets/main.css?v=${hash}">1`);
      assert.notEqual(hash, previousHash);
      previousHash = hash;
      const files = await readdir(path.join(fixture, "out"), { recursive: true });
      assert.deepEqual(
        files.filter((file) => /\.(css|scss|map)$/.test(file)),
        ["assets/main.css"],
      );
    }
    await writeFile(tokens, "$color: ;");
    await assert.rejects(build(), (error) => error.code === 1);
  } finally {
    await rm(fixture, { recursive: true, force: true });
  }
});
