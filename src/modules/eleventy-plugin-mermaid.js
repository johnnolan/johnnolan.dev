module.exports = (eleventyConfig, options) => {
  const html_tag = options?.html_tag || "pre";
  const extra_classes = options?.extra_classes ? " " + options.extra_classes : "";

  eleventyConfig.addShortcode("mermaid_js", () => {
    let src = options?.mermaid_js_src || "https://unpkg.com/mermaid@10/dist/mermaid.esm.min.mjs";
    return `<script type="module" async>import mermaid from "${src}";document.addEventListener('DOMContentLoaded', mermaid.initialize({startOnLoad:true}));</script>`;
  });

  eleventyConfig.amendLibrary("md", (md) => {
    const renderFence = md.renderer.rules.fence;
    md.renderer.rules.fence = (tokens, index, markdownOptions, env, renderer) => {
      const token = tokens[index];
      if (token.info.trim().split(/\s+/)[0] === "mermaid") {
        return `<${html_tag} class="mermaid${extra_classes}">${md.utils.escapeHtml(token.content)}</${html_tag}>`;
      }
      return renderFence(tokens, index, markdownOptions, env, renderer);
    };
  });
};
