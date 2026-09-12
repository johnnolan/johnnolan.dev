import assert from "node:assert/strict";
import { globSync, readFileSync } from "node:fs";
import path from "node:path";

export function validateOutputMode(outputRoot, mode) {
  assert.ok(["production", "preview"].includes(mode), "Unknown output validation mode");
  const htmlFiles = globSync("**/*.html", { cwd: outputRoot });
  assert.ok(
    htmlFiles.length > 0,
    "No HTML output found; run yarn verify:production or yarn verify:preview",
  );
  for (const file of globSync("**/*.{html,xml}", { cwd: outputRoot })) {
    const content = readFileSync(path.join(outputRoot, file), "utf8");
    assert.ok(
      !content.includes("/.11ty/image/"),
      `Development image URL in ${file}; use a clean static build`,
    );
    if (mode === "production") {
      assert.doesNotMatch(
        content,
        /class=["']draft-notice["']/,
        `Draft page in production: ${file}`,
      );
    }
  }
}
