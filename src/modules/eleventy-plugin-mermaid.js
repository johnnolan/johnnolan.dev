export default (eleventyConfig, options) => {
  const html_tag = options?.html_tag || "pre";
  const extra_classes = options?.extra_classes ? " " + options.extra_classes : "";

  eleventyConfig.addShortcode("mermaid_js", () => {
    const src =
      options?.mermaid_js_src ||
      "https://unpkg.com/mermaid@10.9.5/dist/mermaid.esm.min.mjs";
    return `<script type="module">import mermaid from "${src}";const render=()=>{mermaid.initialize({startOnLoad:false,theme:"neutral"});mermaid.run({querySelector:".mermaid"});};if(document.readyState==="loading"){document.addEventListener("DOMContentLoaded",render,{once:true});}else{render();}</script>`;
  });

  eleventyConfig.amendLibrary("md", (md) => {
    const renderFence = md.renderer.rules.fence;
    md.renderer.rules.fence = (tokens, index, markdownOptions, env, renderer) => {
      const token = tokens[index];
      if (token.info.trim().split(/\s+/)[0] === "mermaid") {
        return `<${html_tag} class="mermaid${extra_classes}">${md.utils.escapeHtml(token.content)}</${html_tag}>`;
      }
      return renderFence(tokens, index, markdownOptions, env, renderer).replace(
        "<pre>",
        '<pre tabindex="0">',
      );
    };
  });
};
