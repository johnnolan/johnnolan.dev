import { isoDate } from "../filters/date-filters.js";

export function feedUpdated(posts) {
  // An empty feed still needs a deterministic timestamp, not a build-time date.
  return posts.reduce((latest, post) => {
    const updated = isoDate(post.data.updated ?? post.data.date);
    return updated > latest ? updated : latest;
  }, "1970-01-01");
}

export function atomDate(value) {
  const date = isoDate(value);
  if (!date) throw new Error("Atom entries require an editorial date");
  return `${date}T00:00:00Z`;
}
