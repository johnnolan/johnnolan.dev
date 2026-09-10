import assert from "node:assert/strict";
import test from "node:test";

import { buildPageMetadata, safeJson } from "../src/modules/page-metadata.js";

const site = {
  name: "John Nolan",
  description: "Site description",
  url: "https://example.com",
  authorImage: "/assets/images/johnnolan.jpg",
  socialImage: "/assets/posts/johnnolan.jpg",
  jobTitle: "Technical Architect",
};

test("page metadata supplies canonical fallbacks for index pages", () => {
  const metadata = buildPageMetadata({ title: "Archive", pageUrl: "/archive/" }, site);

  assert.equal(metadata.description, site.description);
  assert.equal(metadata.canonicalUrl, "https://example.com/archive/");
  assert.equal(metadata.imageUrl, "https://example.com/assets/posts/johnnolan.jpg");
  assert.equal(metadata.openGraphType, "website");
  assert.equal(metadata.jsonLd["@type"], "CollectionPage");
  assert.equal(metadata.author.image, "https://example.com/assets/images/johnnolan.jpg");
});

test("article metadata includes publication and modification dates", () => {
  const metadata = buildPageMetadata(
    {
      title: "Article",
      description: "Description",
      image: "/assets/posts/article.jpg",
      pageUrl: "/article/",
      isArticle: true,
      date: "2025-01-01",
      updated: "2025-02-02",
    },
    site,
  );

  assert.equal(metadata.openGraphType, "article");
  assert.equal(metadata.datePublished, "2025-01-01");
  assert.equal(metadata.dateModified, "2025-02-02");
  assert.equal(metadata.jsonLd.dateModified, "2025-02-02");
  assert.equal(metadata.jsonLd.image, "https://example.com/assets/posts/article.jpg");
});

test("JSON-LD serialization cannot terminate its script element", () => {
  const serialized = safeJson({ description: "Text </script><script>alert(1)</script>" });

  assert.doesNotMatch(serialized, /</);
  assert.deepEqual(JSON.parse(serialized), {
    description: "Text </script><script>alert(1)</script>",
  });
});
