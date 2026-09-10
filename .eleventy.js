import markdownIt from "./markdown-it.js";
import { feedPlugin } from "@11ty/eleventy-plugin-rss";
import { eleventyImageTransformPlugin } from "@11ty/eleventy-img";
import site from "./src/_data/site.json" with { type: "json" };
import assetPath from "./src/filters/asset-path.js";
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

  eleventyConfig.addPlugin(feedPlugin, {
    type: "atom",
    outputPath: "/feed.xml",
    collection: { name: "feedPosts", limit: 0 },
    metadata: {
      language: "en",
      title: site.name,
      subtitle: site.description,
      base: `${site.url}/`,
      author: { name: site.name },
    },
  });
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
  };
}
