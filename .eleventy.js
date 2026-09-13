import markdownIt from "./markdown-it.js";
import pluginRss from "@11ty/eleventy-plugin-rss";
import { eleventyImageTransformPlugin } from "@11ty/eleventy-img";
import { atomDate, feedUpdated } from "./src/modules/feed.js";
import assetPath from "./src/filters/asset-path.js";
import articleImage from "./src/filters/article-image.js";
import { displayDate, isoDate } from "./src/filters/date-filters.js";
import concat from "./src/filters/concat-filter.js";
import sitemap from "./src/modules/sitemap.mjs";
import pluginMermaid from "./src/modules/eleventy-plugin-mermaid.js";
import pluginSass from "./src/modules/eleventy-plugin-sass.mjs";
import { buildPageMetadata, safeJson } from "./src/modules/page-metadata.js";
import youtubeEmbed from "eleventy-plugin-youtube-embed";
import youtubeEmbedTitles from "./src/modules/youtube-embed-titles.js";
import responsiveImages from "./src/modules/responsive-images.js";
import pluginTOC from "./src/modules/eleventy-plugin-toc/.eleventy.js";

import { drafts } from "./src/modules/drafts.mjs";
import contentCollections from "./src/modules/content-collections.mjs";

export default function (eleventyConfig) {
  eleventyConfig.addPlugin(drafts);
  eleventyConfig.addPlugin(contentCollections);
  eleventyConfig.addPlugin(sitemap);
  eleventyConfig.addPassthroughCopy({
    "src/_includes/assets": "assets",
    "src/_includes/scripts": "assets",
    "src/_includes/img": "assets",
    "src/_includes/rootAssets": "/",
  });

  eleventyConfig.addPlugin(pluginSass);

  eleventyConfig.addPlugin(pluginRss);
  eleventyConfig.addFilter("feedUpdated", feedUpdated);
  eleventyConfig.addFilter("atomDate", atomDate);
  eleventyConfig.addPlugin(pluginMermaid);
  eleventyConfig.addPlugin(responsiveImages);
  eleventyConfig.addPlugin(eleventyImageTransformPlugin, {
    formats: ["webp", "auto"],
    widths: [480, 800, 1200],
    sharpOptions: { animated: true },
    svgShortCircuit: true,
    htmlOptions: {
      imgAttributes: {
        loading: "lazy",
        decoding: "async",
        sizes: "(min-width: 800px) 68ch, 100vw",
      },
    },
  });
  eleventyConfig.addPlugin(youtubeEmbed);
  eleventyConfig.addPlugin(youtubeEmbedTitles);
  eleventyConfig.addPlugin(pluginTOC, {
    wrapper: false,
    ul: true,
  });

  eleventyConfig.addFilter("log", (value) => {
    console.log(value);
  });
  eleventyConfig.addFilter("limit", function (array, limit) {
    return array.slice(0, limit);
  });
  eleventyConfig.addFilter("assetPath", assetPath);
  eleventyConfig.addFilter("articleImage", articleImage);
  eleventyConfig.addFilter("displayDate", displayDate);
  eleventyConfig.addFilter("isoDate", isoDate);

  eleventyConfig.addFilter("concat", concat);
  eleventyConfig.addFilter("pageMetadata", buildPageMetadata);
  eleventyConfig.addFilter("safeJson", safeJson);

  eleventyConfig.setLibrary("md", markdownIt());

  return {
    dir: { input: "src", output: "_site", data: "_data" },
    templateFormats: ["njk", "md"],
    htmlTemplateEngine: "njk",
    markdownTemplateEngine: false,
  };
}
