import buildTOC from "./src/BuildTOC.js";
import parseOptions from "./src/ParseOptions.js";

export default (eleventyConfig, globalOpts) => {
  globalOpts = globalOpts || {};
  eleventyConfig.namespace(globalOpts, () => {
    eleventyConfig.addFilter("toc", (content, localOpts) => {
      return buildTOC(content, parseOptions(localOpts, globalOpts));
    });
  });
};
