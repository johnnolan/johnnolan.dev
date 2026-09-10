import assert from "node:assert/strict";
import test from "node:test";
import { atomFeedPosts, publishedPosts } from "../src/modules/content-collections.mjs";

const article = (inputPath, date, data = {}) => ({
  inputPath,
  data: { title: inputPath, date, ...data },
});

test("posts filter before limiting and sort without mutating the input", () => {
  const articles = Array.from({ length: 14 }, (_, i) => ({
    inputPath: `./src/hcta/articles/post-${i}.md`,
    data: { title: `Post ${i}`, date: new Date(Date.UTC(2025, 0, i + 1)) },
  }));
  const items = [
    { inputPath: "./src/index.njk", data: { date: new Date(), title: "Home" } },
    {
      inputPath: "./src/hcta/articles/draft.md",
      data: { title: "Draft", date: new Date(), draft: true },
    },
    { inputPath: "./src/hcta/articles/incomplete.md", data: {} },
    ...articles,
  ];
  const before = [...items];
  const posts = publishedPosts(items);
  assert.equal(posts.slice(0, 12).length, 12);
  assert.equal(posts[0].data.title, "Post 13");
  assert.equal(posts.at(-1).data.title, "Post 0");
  assert.deepEqual(items, before);
  const tied = articles
    .slice(0, 2)
    .map((item) => ({ ...item, data: { ...item.data, date: "2025-01-01" } }));
  assert.deepEqual(publishedPosts(tied), publishedPosts([...tied].reverse()));
});

test("Atom feed posts are oldest-first for the virtual template and exclude drafts", () => {
  const items = [
    article("./src/hcta/articles/older.md", "2024-01-01"),
    article("./src/hcta/articles/newer.md", "2025-01-01"),
    article("./src/hcta/articles/draft.md", "2026-01-01", { draft: true }),
  ];

  const posts = atomFeedPosts(items);
  assert.deepEqual(
    posts.map((item) => item.inputPath),
    ["./src/hcta/articles/older.md", "./src/hcta/articles/newer.md"],
  );
  assert.equal(posts[1].data.date, "2025-01-01");
});
