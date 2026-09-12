import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { mkdtemp, mkdir, readFile, writeFile, rm, access } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { promisify } from "node:util";
import test from "node:test";

const exec = promisify(execFile);

test("verification controls the build environment, cleans production, and isolates failed previews", async () => {
  const root = await mkdtemp(path.join(tmpdir(), "verify-site-test-"));
  try {
    for (const dir of ["scripts", "tests", "node_modules/@11ty/eleventy", "_site"]) {
      await mkdir(path.join(root, dir), { recursive: true });
    }
    for (const file of ["verify-site.mjs", "clean-site.mjs"]) {
      await writeFile(
        path.join(root, "scripts", file),
        await readFile(new URL(`../scripts/${file}`, import.meta.url)),
      );
    }
    // A tiny build process records what the real CLI would receive.
    await writeFile(
      path.join(root, "node_modules/@11ty/eleventy/cmd.cjs"),
      `
      const fs = require("node:fs");
      const output = process.argv[2].slice("--output=".length);
      fs.mkdirSync(output, { recursive: true });
      fs.writeFileSync(output + "/index.html", process.env.INCLUDE_DRAFTS || "production");
      fs.writeFileSync("build.json", JSON.stringify({ output, mode: process.env.ELEVENTY_RUN_MODE }));
    `,
    );
    await writeFile(
      path.join(root, "tests/output.test.mjs"),
      `
      import assert from "node:assert/strict";
      import { readFileSync } from "node:fs";
      const preview = process.env.SITE_OUTPUT_MODE === "preview";
      assert.equal(readFileSync(process.env.SITE_OUTPUT_DIR + "/index.html", "utf8"), preview ? "true" : "production");
      if (preview) throw new Error("Broken draft link");
    `,
    );
    await writeFile(path.join(root, "_site/stale-draft.html"), "draft");
    const run = (mode) =>
      exec(process.execPath, [path.join(root, "scripts/verify-site.mjs"), mode], {
        env: {
          ...process.env,
          INCLUDE_DRAFTS: "true",
          ELEVENTY_RUN_MODE: "serve",
          SITE_OUTPUT_MODE: "preview",
        },
      });
    await run("production");
    await assert.rejects(access(path.join(root, "_site/stale-draft.html")));
    assert.equal(await readFile(path.join(root, "_site/index.html"), "utf8"), "production");
    await assert.rejects(
      run("preview"),
      (error) => error.code === 1 && error.stderr.includes("Broken draft link"),
    );
    const build = JSON.parse(await readFile(path.join(root, "build.json"), "utf8"));
    assert.equal(build.mode, "build");
    assert.notEqual(build.output, path.join(root, "_site"));
    await assert.rejects(access(build.output));
    assert.equal(await readFile(path.join(root, "_site/index.html"), "utf8"), "production");
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
