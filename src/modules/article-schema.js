import fs from "node:fs";
import path from "node:path";

const categories = ["hcta", "iam", "other"];

export function validateArticle(data) {
  const file = data.page.inputPath;
  const fail = (message) => {
    throw new Error(`${file}: ${message}`);
  };
  for (const key of ["title", "description"]) {
    if (typeof data[key] !== "string" || !data[key].trim())
      fail(`${key} must be a non-empty string`);
  }
  if (!categories.includes(data.category)) fail("category must be hcta, iam, or other");
  for (const key of ["tags", "topics"]) {
    if (
      !Array.isArray(data[key]) ||
      data[key].some((value) => typeof value !== "string" || !value.trim())
    ) {
      fail(`${key} must be an array of non-empty strings`);
    }
  }
  if (data.draft !== undefined && typeof data.draft !== "boolean") fail("draft must be a boolean");
  // Eleventy may infer dates from the filesystem. Require an editorial value in
  // the article itself before publication, rather than accepting that fallback.
  const source = fs.readFileSync(file, "utf8");
  const frontmatter = source.match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/)?.[1] || "";
  const hasDate = /^date:[ \t]*\S/m.test(frontmatter);
  if (!data.draft && !hasDate) fail("published articles need an explicit date in frontmatter");
  const checkDate = (value, key) => {
    const text = value instanceof Date ? value.toISOString().slice(0, 10) : value;
    if (typeof text !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(text))
      fail(`${key} must be an ISO calendar date`);
    const parsed = new Date(text);
    if (Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== text)
      fail(`${key} must be a valid calendar date`);
    return text;
  };
  const rawDate = frontmatter
    .match(/^date:[ \t]*([^#\r\n]*)/m)?.[1]
    .trim()
    .replace(/^["']|["']$/g, "");
  const date = hasDate ? checkDate(rawDate, "date") : undefined;
  if (hasDate && checkDate(data.date, "date") !== date)
    fail("date must match its frontmatter value");
  if (data.updated !== undefined) {
    const updated = checkDate(data.updated, "updated");
    if (date && updated < date) fail("updated cannot precede date");
  }
  if (data.image !== undefined) {
    if (typeof data.image !== "string" || !data.image.trim())
      fail("image must be a non-empty local asset path");
    const image = data.image.replace(/^\//, "");
    if (!image.startsWith("assets/") || image.split("/").includes(".."))
      fail("image must reference a local assets/ path");
    const relative = image.slice("assets/".length);
    const roots = ["src/_includes/img", "src/_includes/assets"];
    if (
      !roots.some(
        (root) =>
          fs.existsSync(path.join(root, relative)) &&
          fs.statSync(path.join(root, relative)).isFile(),
      )
    ) {
      fail(`image does not exist: ${data.image}`);
    }
  }
}

export default (category) => ({
  category,
  eleventyDataSchema: validateArticle,
});
