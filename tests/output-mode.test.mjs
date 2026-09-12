import assert from "node:assert/strict";
import { mkdtempSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";
import { validateOutputMode } from "./helpers/output-mode.mjs";

test("output validation rejects empty builds and only allows draft HTML in preview mode", () => {
  const root = mkdtempSync(path.join(tmpdir(), "output-mode-"));
  try {
    assert.throws(() => validateOutputMode(root, "production"), /No HTML output/);
    assert.throws(() => validateOutputMode(root, "preview"), /No HTML output/);
    writeFileSync(path.join(root, "index.html"), '<p class="draft-notice">Draft</p>');
    assert.throws(() => validateOutputMode(root, "production"), /Draft page/);
    validateOutputMode(root, "preview");
    writeFileSync(path.join(root, "index.html"), "<p>Published</p>");
    validateOutputMode(root, "production");
    for (const file of ["index.html", "feed.xml"]) {
      writeFileSync(path.join(root, file), '<img src="/.11ty/image/?src=example.png">');
      for (const mode of ["production", "preview"]) {
        assert.throws(() => validateOutputMode(root, mode), /Development image URL/);
      }
      writeFileSync(path.join(root, file), "<p>Static content</p>");
    }
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
