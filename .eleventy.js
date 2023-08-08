const inclusiveLangPlugin = require("@11ty/eleventy-plugin-inclusive-language");
const pluginRss = require("@11ty/eleventy-plugin-rss");
const dateFilter = require('./src/filters/date-filter.js');
const date24HourFilter = require('./src/filters/date24Hours-filter.js');
const pluginMermaid = require('@kevingimbel/eleventy-plugin-mermaid');
const embedYouTube = require('eleventy-plugin-youtube-embed');

module.exports = function (eleventyConfig) {
  eleventyConfig.addPassthroughCopy({ "src/_includes/css": "assets" });
  eleventyConfig.addPassthroughCopy({ "src/_includes/assets": "assets" });
  eleventyConfig.addPassthroughCopy({ "src/_includes/scripts": "assets" });
  eleventyConfig.addPassthroughCopy({ "src/_includes/img": "assets" });
  eleventyConfig.addPassthroughCopy({ "src/_includes/rootAssets": "/" });

  eleventyConfig.addPassthroughCopy({ "src/_data": "data" });

  eleventyConfig.addWatchTarget("./src/");

  eleventyConfig.addPlugin(inclusiveLangPlugin);
  eleventyConfig.addPlugin(pluginRss);
  eleventyConfig.addPlugin(pluginMermaid);
  eleventyConfig.addPlugin(embedYouTube);

  eleventyConfig.addFilter("log", (value) => {
    console.log(value);
  });
  eleventyConfig.addFilter("limit", function (array, limit) {
    return array.slice(0, limit);
  });
  eleventyConfig.addFilter('dateFilter', dateFilter);
  eleventyConfig.addFilter('date24HourFilter', date24HourFilter);

  return {
    dir: { input: "src", output: "_site", data: "_data" },
    templateFormats: ["njk", "md", "css", "html", "yml"],
    htmlTemplateEngine: "njk",
    passthroughFileCopy: true,
  };
};
