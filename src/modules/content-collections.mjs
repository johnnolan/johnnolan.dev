export function isArticle(item) {
  return /\/articles\/[^/]+\.md$/.test(item.inputPath);
}

export function publishedPosts(items) {
  return items
    .filter(
      (item) => isArticle(item) && item.data.draft !== true && item.data.title && item.data.date,
    )
    .sort((a, b) => {
      const difference = new Date(b.data.date) - new Date(a.data.date);
      return difference || a.inputPath.localeCompare(b.inputPath, "en");
    });
}

export function atomFeedPosts(items) {
  return publishedPosts(items).reverse();
}

export default function contentCollections(config) {
  config.addCollection("posts", (collection) => publishedPosts(collection.getAll()));
  config.addCollection("feedPosts", (collection) => atomFeedPosts(collection.getAll()));
}
