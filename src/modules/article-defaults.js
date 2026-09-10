import { validateArticle } from "./article-schema.js";

import { articleSections } from "./article-sections.js";

export default function articleDefaults(category) {
  return {
    layout: "layouts/article.njk",
    contributors: ["John Nolan"],
    category,
    categoryLabel: articleSections[category].label,
    backLink: articleSections[category].url,
    tags: [category],
    eleventyDataSchema: validateArticle,
  };
}
