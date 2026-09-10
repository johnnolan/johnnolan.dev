# Eleventy modernisation audit

This log contains only outstanding recommendations. Completed work has been removed so the document remains an actionable backlog.

## Prioritised change list

P2 means a worthwhile capability or maintenance improvement. P3 means optional. Effort is relative: small is a focused change; medium spans configuration, templates, or migration checks.

| # | Potential change | Priority | Effort |
| --- | --- | --- | --- |
| 14 | Repair local links and adopt input-path links | P2 | Small |
| 15 | Introduce responsive image transforms | P2 | Medium |
| 16 | Colocate new article attachments | P3 | Medium |
| 18 | Replace custom CSS hashing with an asset pipeline | P2 | Medium |
| 19 | Integrate Sass dependency tracking and simplify watching | P2 | Medium |
| 20 | Replace deprecated Sass imports | P2 | Medium |
| 22 | Declare Markdown preprocessing deliberately | P2 | Small |
| 30 | Trial v4 separately after stabilising v3 | P3 | Medium |

## 14. Repair local links and adopt input-path links

The active draft links to `terraform-audit-issues.md`, `../README.md`, and two relative skill documents that are not published at those paths. All four are missing targets in the generated output.

Use the bundled `InputPathToUrlTransformPlugin` for links between actual site source files, or the built-in `inputPathToUrl` filter where explicit control is useful. Link repository documentation to its real repository location, once identified. The transform leaves unmatched paths unchanged; it cannot repair absent files, so retain a broken-link check. Preserve public permalinks independently of source filename cleanups. [Input-path URL transformation](https://www.11ty.dev/docs/plugins/inputpath-to-url/).

## 15. Introduce responsive image transforms

The image source directory is approximately 12 MB and is copied wholesale. Existing image markup lacks a central sizing pipeline; the ten historical width/height frontmatter pairs are never consumed. Adopt `@11ty/eleventy-img` and its HTML transform to process Markdown-generated images, supplying sensible responsive widths, formats, dimensions, and loading behaviour.

Start with a screenshot-heavy article. Map source locations carefully: current `/assets/posts/...` output paths originate under `_includes/img/posts`, not `src/assets/posts`. Keep SVG diagrams sharp and preserve animated GIF behaviour. Do not lazy-load a prominent above-the-fold image indiscriminately. Measure output size and build time before expanding. Image v7 requires Node 22+ and ESM, compatible with the pinned Node line. [Image transform and runtime requirements](https://www.11ty.dev/docs/plugins/image/).

## 16. Colocate new article attachments

Eleventy 3.1's `mode: "html-relative"` passthrough copy supports copying referenced files alongside an emitted HTML page. This is useful for new downloadable examples, PDFs, and diagrams stored near their article.

Do not bulk-move old assets: published asset URLs may be externally linked. Use narrow extension globs, preserve existing mappings, and test files referenced by several pages. References inside CSS, JSON-LD, or feeds need their own handling. Coordinate image ownership with the Image plugin so the same assets are not unnecessarily copied twice. [HTML-relative copying](https://www.11ty.dev/docs/copy/#copy-a-file-alongside-a-template).

## 18. Replace custom CSS hashing with an asset pipeline

`cacheBuster.js` synchronously reads CSS and returns an MD5 query-string suffix, silently falling back to `dev` when the file is missing. The production script orders Sass first, but `serve` starts Sass and Eleventy concurrently, so a fresh checkout can reach hashing before CSS exists.

Consider Eleventy's bundled asset facilities for a content-hashed CSS filename and page-specific script bundles. The bundle plugin is a text bundler, not a Sass compiler, transpiler, or npm module resolver; define compilation order explicitly. For this small site, keeping a single stylesheet with a reliable build step is also reasonable. Test cache updates during watch mode before deleting the existing helper. [Bundled asset facilities](https://www.11ty.dev/docs/plugins/bundle/).

## 19. Integrate Sass dependency tracking and simplify watching

See the [SCSS build and cleanup proposal](scss-build-and-cleanup-proposal.md) for a concrete integration design, preview diagnostics, file organisation, formatting commands, and acceptance checks.

The current setup uses two watchers and an all-of-`src` watch target. A documented alternative is an SCSS custom extension using `useLayouts: false`, compiling only entrypoints and registering Sass `loadedUrls` through `this.addDependencies`.

This can make Eleventy own dependency tracking and eliminate `concurrently`, the extra watcher, and generated CSS inside `_includes`. Keep the `/assets/main.css` URL or introduce a deliberate hashed replacement. If retaining separate processes, compile Sass once before starting both watchers and narrow the Eleventy watch target. Incremental correctness must be checked for partials, imported helpers, collections, and deleted files. The custom-template approach predates v3; the layout opt-out is newer. [Official Sass integration](https://www.11ty.dev/docs/languages/sass/).

## 20. Replace deprecated Sass imports

`src/scss/main.scss:54` imports the full partial tree with `@import`, despite already using `sass:math`. Compilation produces import deprecation warnings. Migrate shared tokens and mixins into modules using `@use` and `@forward`, then update partial dependencies.

This is not a safe mechanical keyword replacement because the current partials share global variables. Compare compiled CSS and representative pages after migration. Sass deprecated imports in 1.80.0, placing this change inside the review window; removal is planned for Dart Sass 3.0.0. [Sass import migration](https://sass-lang.com/documentation/breaking-changes/import/).

## 22. Declare Markdown preprocessing deliberately

The config sets `htmlTemplateEngine: "njk"` but does not set `markdownTemplateEngine`, so Markdown is still preprocessed with Eleventy's default Liquid engine. This matters for technical articles containing template-like code: code fences do not necessarily protect text from the earlier template pass.

Audit actual Liquid usage and choose `markdownTemplateEngine: false` for plain Markdown, or explicitly choose Nunjucks if its features are required inside articles. Keep layout rendering in Nunjucks. Do not change `breaks: true` casually: it currently turns soft line breaks into HTML breaks, and removing it can change older article formatting. Treat preprocessing and typography as separate changes.

## 30. Trial v4 separately after stabilising v3

The verified release listing still labels v4 as prerelease. Its newer work includes TypeScript support, a substantially revised asynchronous Nunjucks implementation, incremental-build changes, configuration types, and the optional Build Awesome package migration. These may eventually help, but this repository's nested Nunjucks macros, local plugins, and mixed module formats make an isolated compatibility trial more appropriate than immediate production adoption.

The alpha notes explicitly call out Nunjucks migration risk; they also document changing data/template suffixes and Node requirements. Recheck the actual release status before starting a trial. Do not use APIs copied from v4 documentation in the stable v3 cleanup without confirming availability. [Prerelease notes and migration guidance](https://github.com/11ty/buildawesome/releases).

## Suggested implementation sequence

1. Repair source links and explicitly configure Markdown preprocessing.
2. Complete the Sass module migration and reconcile the overlapping Sass integration and asset-pipeline recommendations.
3. Introduce image transforms on one representative article, then define the colocation convention for new attachments.
4. Explore v4 only after the remaining v3 changes are stable and verified on the pinned Node runtime.
