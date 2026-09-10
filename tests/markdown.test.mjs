import assert from "node:assert/strict";
import test from "node:test";
import markdown from "../markdown-it.js";
import mermaid from "../src/modules/eleventy-plugin-mermaid.js";

test("Mermaid fences leave ordinary Markdown code rendering intact", () => {
  const md = markdown();
  let loader;
  mermaid({
    addShortcode(name, shortcode) {
      assert.equal(name, "mermaid_js");
      loader = shortcode();
    },
    amendLibrary(name, amend) {
      amend(md);
    },
  });
  for (const language of ["hcl", "yaml", "bash", "json", "jsx", "html", "unknown", ""]) {
    const output = md.render("```" + language + "\n<button>&example</button>\n``` ");
    assert.match(output, /<pre><code/);
    assert.match(output, /&lt;button&gt;&amp;example&lt;\/button&gt;/);
    assert.doesNotMatch(output, /<button>/);
  }
  assert.match(md.render("```mermaid\ngraph TD; A-->B\n```"), /<pre class="mermaid">/);
  assert.match(loader, /mermaid@10\.9\.5/);
  assert.match(loader, /addEventListener\("DOMContentLoaded",render/);
  assert.match(loader, /mermaid\.run\(\{querySelector:"\.mermaid"\}\)/);
  assert.doesNotMatch(loader, /addEventListener\([^,]+,\s*mermaid\.initialize/);
  md.options.highlight = () => '<span class="token">highlighted</span>';
  assert.match(md.render("```js\nconst x = 1;\n```"), /<span class="token">highlighted<\/span>/);
});
