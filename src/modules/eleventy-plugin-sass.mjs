import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";
import * as sass from "sass";

export default function pluginSass(eleventyConfig) {
  const entrypoint = path.resolve("src/scss/main.scss");
  const preview = process.env.ELEVENTY_RUN_MODE === "serve";
  const compilations = new Map();

  if (preview) {
    eleventyConfig.setServerOptions({
      ready(server) {
        const reload = server.reload.bind(server);
        // Eleventy 3 classifies live CSS updates by the input extension.
        // SCSS is compiled CSS too; keep its updates in the existing CSS client.
        server.reload = (event = {}) => {
          if (event.files?.length && event.files.every((file) => file.endsWith(".scss"))) {
            return reload({
              ...event,
              subtype: "css",
              build: {
                ...event.build,
                stylesheets: event.build.templates
                  .filter((template) => path.resolve(template.inputPath) === entrypoint)
                  .map((template) => template.url),
              },
            });
          }
          return reload(event);
        };
      },
    });
  }

  // Share the exact compilation between HTML cache versioning and CSS output.
  // Invalidate on every build, including edits to imported modules.
  eleventyConfig.on("eleventy.before", () => compilations.clear());

  function compile(input) {
    if (!compilations.has(input)) {
      compilations.set(
        input,
        sass.compileStringAsync(input, {
          url: pathToFileURL(entrypoint),
          loadPaths: ["node_modules"],
          style: preview ? "expanded" : "compressed",
          sourceMap: preview,
          sourceMapIncludeSources: preview,
        }),
      );
    }
    return compilations.get(input);
  }

  eleventyConfig.addGlobalData("cssFile", async () => {
    if (preview) return "/assets/main.css";
    const result = await compile(await readFile(entrypoint, "utf8"));
    const hash = createHash("sha256").update(result.css).digest("hex").slice(0, 12);
    return `/assets/main.${hash}.css`;
  });

  eleventyConfig.addTemplateFormats("scss");
  eleventyConfig.addExtension("scss", {
    outputFileExtension: "css",
    useLayouts: false,
    compile: async function (input, inputPath) {
      if (path.resolve(inputPath) !== entrypoint) return;
      const result = await compile(input);
      this.addDependencies(inputPath, result.loadedUrls);
      let css = result.css;
      if (preview) {
        const map = Buffer.from(JSON.stringify(result.sourceMap)).toString("base64");
        css += `\n/*# sourceMappingURL=data:application/json;base64,${map} */\n`;
      }
      return () => css;
    },
  });
}
