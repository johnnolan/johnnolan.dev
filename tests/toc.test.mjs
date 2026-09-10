import assert from "node:assert/strict";
import test from "node:test";

import markdown from "../markdown-it.js";
import buildTOC from "../src/modules/eleventy-plugin-toc/src/BuildTOC.js";

const options = { wrapper: false, ul: true, anchorClass: "toc-link" };

test("TOC preserves document order when heading levels are skipped", () => {
  const toc = buildTOC(
    '<h2 id="a">A</h2><h4 id="b">B</h4><h2 id="c">C</h2>',
    options,
  );

  assert.ok(toc.indexOf("#a") < toc.indexOf("#b"));
  assert.ok(toc.indexOf("#b") < toc.indexOf("#c"));
  assert.match(toc, /href="#a" class="toc-link">A<\/a><ul>/);
  assert.equal((toc.match(/class="toc-link"/g) || []).length, 3);
});

test("TOC supports repeated headings and nested inline markup", () => {
  const html = markdown().render("## Repeat\n\n## Repeat\n\n## Hello *world*");
  const toc = buildTOC(html, options);

  assert.match(toc, /href="#repeat"/);
  assert.match(toc, /href="#repeat-1"/);
  assert.match(toc, />Hello world<\/a>/);
});

test("TOC omits headings without IDs and suppresses empty lists", () => {
  assert.equal(buildTOC("<h2>No ID</h2>", options), undefined);
  assert.equal(buildTOC("<p>No headings</p>", options), undefined);

  const mixed = buildTOC('<h2>No ID</h2><h3 id="child">Child</h3>', options);
  assert.equal(mixed, '<ul><li><a href="#child" class="toc-link">Child</a></li></ul>');
});
