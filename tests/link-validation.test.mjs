import assert from "node:assert/strict";
import { mkdtempSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";
import { findBrokenLinks } from "./helpers/link-validation.mjs";

test("link diagnostics collect failures with HTML attribute locations and resolved targets", (t) => {
  const outputRoot = mkdtempSync(path.join(tmpdir(), "link-validation-"));
  t.after(() => rmSync(outputRoot, { recursive: true, force: true }));
  const file = path.join(outputRoot, "index.html");
  writeFileSync(
    file,
    `<p id="literal%3F">Links</p>\n<a href="missing.md">Runbook</a>\n<a href="#absent">Missing heading</a>\n<a href="other.html#absent">Other page</a>\n<a href="#caf%C3%A9">Valid heading</a>\n<h2 id="café">Heading</h2><a href="#literal%3F">Literal encoded ID</a>\n<a href="https://example.org/">External</a>\n<a href="mailto:me@example.org">Email</a>`,
  );
  writeFileSync(path.join(outputRoot, "other.html"), '<h2 id="present">Heading</h2>');
  const failures = findBrokenLinks({
    htmlFiles: [file],
    outputRoot,
    siteOrigin: "https://example.com",
  });
  assert.equal(failures.length, 3);
  assert.ok(failures[0].startsWith(`${file}:2:4\n`));
  assert.ok(failures[0].includes('Link: "Runbook" (href="missing.md")'));
  assert.ok(failures[0].includes(`Target file does not exist: ${outputRoot}/missing.md`));
  assert.ok(failures[1].startsWith(`${file}:3:4\n`));
  assert.ok(failures[1].includes("Missing fragment #absent"));
  assert.ok(failures[2].includes(`in ${outputRoot}/other.html`));
});
