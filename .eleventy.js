import markdownIt from "./markdown-it.js";
import pluginRss from "@11ty/eleventy-plugin-rss";
import dateFilter from "./src/filters/date-filter.js";
import date24HourFilter from "./src/filters/date24Hours-filter.js";
import concat from "./src/filters/concat-filter.js";
import dateSitemap from "./src/filters/dateSitemap-filter.js";
import pluginMermaid from "./src/modules/eleventy-plugin-mermaid.js";
import customHelpers from "./src/modules/cacheBuster.js";
import youtubeEmbed from "eleventy-plugin-youtube-embed";
import pluginTOC from "./src/modules/eleventy-plugin-toc/.eleventy.js";

export default function (eleventyConfig) {
  eleventyConfig.addPassthroughCopy({ "src/_includes/css": "assets" });
  eleventyConfig.addPassthroughCopy({ "src/_includes/assets": "assets" });
  eleventyConfig.addPassthroughCopy({ "src/_includes/scripts": "assets" });
  eleventyConfig.addPassthroughCopy({ "src/_includes/img": "assets" });
  eleventyConfig.addPassthroughCopy({ "src/_includes/rootAssets": "/" });

  eleventyConfig.addGlobalData("cssHash", () => {
    return customHelpers.getHash("src/_includes/css/main.css");
  });

  eleventyConfig.addGlobalData("baseUrl", process.env.BASE_URL || "/");

  eleventyConfig.addPassthroughCopy({ "src/_data": "data" });

  eleventyConfig.addWatchTarget("./src/");

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
}
