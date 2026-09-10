import markdownIt from "./markdown-it.js";
import pluginRss from "@11ty/eleventy-plugin-rss";
import assetPath from "./src/filters/asset-path.js";
import { displayDate, isoDate } from "./src/filters/date-filters.js";
import concat from "./src/filters/concat-filter.js";
import sitemap from "./src/modules/sitemap.mjs";
import pluginMermaid from "./src/modules/eleventy-plugin-mermaid.js";
import pluginSass from "./src/modules/eleventy-plugin-sass.mjs";
import { buildPageMetadata, safeJson } from "./src/modules/page-metadata.js";
import youtubeEmbed from "eleventy-plugin-youtube-embed";
import pluginTOC from "./src/modules/eleventy-plugin-toc/.eleventy.js";

import { drafts } from "./src/modules/drafts.mjs";
import contentCollections from "./src/modules/content-collections.mjs";

export default function (eleventyConfig) {
  eleventyConfig.addPlugin(drafts);
  eleventyConfig.addPlugin(contentCollections);
  eleventyConfig.addPlugin(sitemap);
  eleventyConfig.addPassthroughCopy({ "src/_includes/assets": "assets" });
  eleventyConfig.addPassthroughCopy({ "src/_includes/scripts": "assets" });
  eleventyConfig.addPassthroughCopy({ "src/_includes/img": "assets" });
  eleventyConfig.addPassthroughCopy({ "src/_includes/rootAssets": "/" });

  eleventyConfig.addPlugin(pluginSass);

  eleventyConfig.addGlobalData("baseUrl", process.env.BASE_URL || "/");

  eleventyConfig.addPassthroughCopy({ "src/_data": "data" });

  eleventyConfig.addPlugin(pluginRss);
  eleventyConfig.addPlugin(pluginMermaid);
  eleventyConfig.addPlugin(youtubeEmbed);
  eleventyConfig.addPlugin(pluginTOC, {
    wrapper: "div",
    ul: true,
  });

  eleventyConfig.addFilter("log", (value) => {
    console.log(value);
  });
  eleventyConfig.addFilter("limit", function (array, limit) {
    return array.slice(0, limit);
  });
  eleventyConfig.addFilter("assetPath", assetPath);
  eleventyConfig.addFilter("displayDate", displayDate);
  eleventyConfig.addFilter("isoDate", isoDate);

  eleventyConfig.addFilter("concat", concat);
  eleventyConfig.addFilter("pageMetadata", buildPageMetadata);
  eleventyConfig.addFilter("safeJson", safeJson);

  eleventyConfig.setLibrary("md", markdownIt());

  return {
    dir: { input: "src", output: "_site", data: "_data" },
    templateFormats: ["njk", "md", "css", "html", "yml"],
    htmlTemplateEngine: "njk",
    passthroughFileCopy: true,
  };
}
