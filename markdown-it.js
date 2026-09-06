import markdownIt from "markdown-it";
import markdownItAnchor from "markdown-it-anchor";

export default function () {
  const options = {
    html: true,
    breaks: true,
    linkify: false,
  };

  const md = markdownIt(options);
  const renderH2Permalink = markdownItAnchor.permalink.headerLink({
    class: "direct-link",
    safariReaderFix: true,
  });

  md.use(markdownItAnchor, {
    permalink(slug, anchorOptions, state, index) {
      if (state.tokens[index].tag === "h2") {
        renderH2Permalink(slug, anchorOptions, state, index);
      }
    },
  });

  return md;
}
