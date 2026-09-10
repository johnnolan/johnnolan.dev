const PUBLIC_IMAGE_PREFIX = "/assets/posts/";
const SOURCE_IMAGE_PREFIX = "/_includes/img/posts/";

export default function responsiveImages(eleventyConfig) {
  eleventyConfig.amendLibrary("md", (markdown) => {
    const renderImage = markdown.renderer.rules.image;

    markdown.renderer.rules.image = (tokens, index, options, env, renderer) => {
      const token = tokens[index];
      const sourceIndex = token.attrIndex("src");
      const source = token.attrs[sourceIndex][1];

      if (source.startsWith(PUBLIC_IMAGE_PREFIX)) {
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
