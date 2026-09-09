import assert from "node:assert/strict";
import test from "node:test";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import schema from "../src/modules/article-schema.cjs";

test("article schema requires editorial metadata and rejects malformed values", () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "article-schema-"));
  const file = path.join(dir, "post.md");
  const valid = {
    page: { inputPath: file },
    title: "Title",
    description: "Description",
    category: "iam",
    tags: ["iam"],
    topics: ["terraform"],
    date: "2025-01-01",
    image: "assets/posts/johnnolan.jpg",
  };
  try {
    fs.writeFileSync(file, "---\ndate: 2025-01-01\n---\nArticle");
    schema.validateArticle(valid);
    for (const changes of [
      { title: "" },
      { description: null },
      { category: "bad" },
      { topics: "terraform" },
      { tags: [123] },
      { draft: "true" },
      { date: "2025-02-30" },
      { updated: "2024-01-01" },
      { image: "assets/missing.png" },
      { image: "assets/../package.json" },
    ]) {
      assert.throws(() => schema.validateArticle({ ...valid, ...changes }));
    }
    fs.writeFileSync(file, "# Missing metadata");
    assert.throws(() => schema.validateArticle(valid), /explicit date/);
    schema.validateArticle({ ...valid, draft: true, date: undefined });
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});
