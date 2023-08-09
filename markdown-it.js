const markdownItAnchor = require("markdown-it-anchor");

module.exports = function () {
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
