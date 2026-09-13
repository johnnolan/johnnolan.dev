export default (eleventyConfig, options) => {
  const html_tag = options?.html_tag || "pre";
  const extra_classes = options?.extra_classes ? " " + options.extra_classes : "";

  eleventyConfig.addShortcode("mermaid_js", () => {
    const src =
      options?.mermaid_js_src ||
      "https://unpkg.com/mermaid@10.9.5/dist/mermaid.esm.min.mjs";
    return `<script type="module">
import mermaid from "${src}";
import mermaidTheme from "/assets/mermaid-theme.mjs";
const render=async()=>{
  const element=document.querySelector(".mermaid");
  if(!element)return;
  const styles=getComputedStyle(element);
  const colour=name=>styles.getPropertyValue("--diagram-"+name).trim();
  mermaid.initialize(mermaidTheme({surface:colour("surface"),text:colour("text"),muted:colour("muted"),border:colour("border"),group:colour("group"),font:styles.fontFamily}));
  await document.fonts.ready;
  await mermaid.run({querySelector:".mermaid"});
  document.querySelectorAll(".mermaid > svg").forEach(svg=>{
    // Some diagram types still emit width=100%. Keep their intrinsic scale too.
    const width=svg.viewBox.baseVal.width;
    if(width){svg.style.width=width+"px";svg.style.maxWidth="none";}
  });
};
if(document.readyState==="loading"){document.addEventListener("DOMContentLoaded",render,{once:true});}else{render();}
</script>`;
  });

  eleventyConfig.amendLibrary("md", (md) => {
    const renderFence = md.renderer.rules.fence;
    md.renderer.rules.fence = (tokens, index, markdownOptions, env, renderer) => {
      const token = tokens[index];
      if (token.info.trim().split(/\s+/)[0] === "mermaid") {
        return `<${html_tag} class="mermaid${extra_classes}" tabindex="0" role="region" aria-label="Diagram (scroll horizontally to explore)">${md.utils.escapeHtml(token.content)}</${html_tag}>`;
      }
      return renderFence(tokens, index, markdownOptions, env, renderer).replace(
        "<pre>",
        '<pre tabindex="0">',
      );
    };
  });
};
