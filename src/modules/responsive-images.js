const PILOT_ARTICLE = "src/identity-access-management/articles/entra-iac-intro.md";
const PUBLIC_IMAGE_PREFIX = "/assets/posts/iam/entra-iac-intro/";
const SOURCE_IMAGE_PREFIX = "/_includes/img/posts/iam/entra-iac-intro/";

export default function responsiveImages(eleventyConfig) {
  eleventyConfig.amendLibrary("md", (markdown) => {
    const renderImage = markdown.renderer.rules.image;

    markdown.renderer.rules.image = (tokens, index, options, env, renderer) => {
      const token = tokens[index];
      const sourceIndex = token.attrIndex("src");
      const source = token.attrs[sourceIndex][1];

      if (env.page?.inputPath === `./${PILOT_ARTICLE}` && source.startsWith(PUBLIC_IMAGE_PREFIX)) {
        token.attrs[sourceIndex][1] = source.replace(PUBLIC_IMAGE_PREFIX, SOURCE_IMAGE_PREFIX);
        token.attrSet("eleventy:widths", "480,800,1200");
        token.attrSet("eleventy:formats", "webp,auto");
        token.attrSet("sizes", "(min-width: 800px) 68ch, 100vw");
        token.attrSet("loading", "lazy");
        token.attrSet("decoding", "async");
      } else {
        token.attrSet("eleventy:ignore", "");
      }

      return renderImage(tokens, index, options, env, renderer);
    };
  });
}
