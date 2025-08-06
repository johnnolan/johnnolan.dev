const markdownIt = require("./markdown-it");
const pluginRss = require("@11ty/eleventy-plugin-rss");
const dateFilter = require("./src/filters/date-filter.js");
const date24HourFilter = require("./src/filters/date24Hours-filter.js");
const concat = require("./src/filters/concat-filter.js");
const dateSitemap = require("./src/filters/dateSitemap-filter.js");
const pluginMermaid = require("./src/modules/eleventy-plugin-mermaid.js");
const customHelpers = require("./src/modules/cacheBuster.js");
const embedYouTube = require("eleventy-plugin-youtube-embed");
const pluginTOC = require("./src/modules/eleventy-plugin-toc/.eleventy.js");

module.exports = function (eleventyConfig) {
  eleventyConfig.addPassthroughCopy({ "src/_includes/css": "assets" });
  eleventyConfig.addPassthroughCopy({ "src/_includes/assets": "assets" });
  eleventyConfig.addPassthroughCopy({ "src/_includes/scripts": "assets" });
  eleventyConfig.addPassthroughCopy({ "src/_includes/img": "assets" });
  eleventyConfig.addPassthroughCopy({ "src/_includes/rootAssets": "/" });

  eleventyConfig.addGlobalData("cssHash", () => {
    return customHelpers.getHash("src/_includes/css/main.css"); // adjust path to output file
  });

  eleventyConfig.addGlobalData("baseUrl", process.env.BASE_URL || "/");

  eleventyConfig.addPassthroughCopy({ "src/_data": "data" });

  eleventyConfig.addWatchTarget("./src/");

  eleventyConfig.addPlugin(pluginRss);
  eleventyConfig.addPlugin(pluginMermaid);
  eleventyConfig.addPlugin(embedYouTube);
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
  eleventyConfig.addFilter("dateFilter", dateFilter);
  eleventyConfig.addFilter("date24HourFilter", date24HourFilter);
  eleventyConfig.addFilter("dateSitemap", dateSitemap);
  eleventyConfig.addFilter("concat", concat);

  eleventyConfig.setLibrary("md", markdownIt());

  return {
    dir: { input: "src", output: "_site", data: "_data" },
    templateFormats: ["njk", "md", "css", "html", "yml"],
    htmlTemplateEngine: "njk",
    passthroughFileCopy: true,
  };
};
