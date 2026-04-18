const markdownItAnchor = require("markdown-it-anchor");

export default function () {
  const options = {
    html: true,
    breaks: true,
    linkify: false,
  };
  var md = require("markdown-it")(options);
  md.use(markdownItAnchor, {
    permalinkClass: "direct-link",
    permalinkSymbol: "",
  });

  return md;
};
