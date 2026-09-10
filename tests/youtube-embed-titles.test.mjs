import assert from "node:assert/strict";
import test from "node:test";

import { uniqueYouTubeEmbedTitles } from "../src/modules/youtube-embed-titles.js";

test("YouTube iframe titles are unique within each HTML page", () => {
  const input = '<iframe title="Embedded YouTube video"></iframe>'.repeat(2);
  const output = uniqueYouTubeEmbedTitles(input, "page.html");

  assert.match(output, /title="Embedded YouTube video 1"/);
  assert.match(output, /title="Embedded YouTube video 2"/);
  assert.equal(uniqueYouTubeEmbedTitles(input, "feed.xml"), input);
});
