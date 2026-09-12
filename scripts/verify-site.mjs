import { spawn } from "node:child_process";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const mode = process.argv[2];
if (!["production", "preview"].includes(mode)) {
  throw new Error("Usage: node scripts/verify-site.mjs production|preview");
}

const root = fileURLToPath(new URL("../", import.meta.url));
const preview = mode === "preview";
const output = preview
  ? await mkdtemp(path.join(tmpdir(), "johnnolan-preview-"))
  : path.join(root, "_site");
const env = {
  ...process.env,
  INCLUDE_DRAFTS: preview ? "true" : "",
  ELEVENTY_RUN_MODE: "build",
  SITE_OUTPUT_DIR: output,
  SITE_OUTPUT_MODE: mode,
};

async function run(args) {
  const child = spawn(process.execPath, args, { cwd: root, env, stdio: "inherit" });
  const code = await new Promise((resolve, reject) => {
    child.once("error", reject);
    child.once("exit", (code) => resolve(code ?? 1));
  });
  if (code !== 0) throw new Error(`${mode} verification failed (exit ${code})`);
}

try {
  console.log(`Verifying ${mode} output in ${output}`);
  if (!preview) await run(["scripts/clean-site.mjs"]);
  await run(["node_modules/@11ty/eleventy/cmd.cjs", `--output=${output}`]);
  await run(["tests/output.test.mjs"]);
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
} finally {
  // Draft checks never replace the deployable _site directory.
  if (preview) await rm(output, { recursive: true, force: true });
}
