import markdownIt from "markdown-it";
import markdownItAnchor from "markdown-it-anchor";

export default function () {
  const options = {
    html: true,
    breaks: true,
    linkify: false,
  };

  const md = markdownIt(options);
  md.use(markdownItAnchor, {
    permalinkClass: "direct-link",
    permalinkSymbol: "",
  });

  return md;
}