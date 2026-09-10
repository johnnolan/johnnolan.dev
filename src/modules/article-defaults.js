import { validateArticle } from "./article-schema.js";

const sectionUrls = {
  hcta: "/hcta/",
  iam: "/identity-access-management/",
  other: "/random/",
};

export default function articleDefaults(category) {
  return {
    layout: "layouts/article.njk",
    contributors: ["John Nolan"],
    category,
    backLink: sectionUrls[category],
    eleventyDataSchema: validateArticle,
  };
}
