import assert from "node:assert/strict";
import test from "node:test";
import { publishedPosts } from "../src/modules/content-collections.mjs";

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
