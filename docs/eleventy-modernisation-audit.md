# Eleventy modernisation audit

This log contains only outstanding recommendations. Completed work has been removed so the document remains an actionable backlog.

## Prioritised change list

P2 means a worthwhile capability or maintenance improvement. P3 means optional. Effort is relative: small is a focused change; medium spans configuration, templates, or migration checks.

| # | Potential change | Priority | Effort |
| --- | --- | --- | --- |
| 22 | Declare Markdown preprocessing deliberately | P2 | Small |
| 30 | Trial v4 separately after stabilising v3 | P3 | Medium |

## 22. Declare Markdown preprocessing deliberately

The config sets `htmlTemplateEngine: "njk"` but does not set `markdownTemplateEngine`, so Markdown is still preprocessed with Eleventy's default Liquid engine. This matters for technical articles containing template-like code: code fences do not necessarily protect text from the earlier template pass.

Audit actual Liquid usage and choose `markdownTemplateEngine: false` for plain Markdown, or explicitly choose Nunjucks if its features are required inside articles. Keep layout rendering in Nunjucks. Do not change `breaks: true` casually: it currently turns soft line breaks into HTML breaks, and removing it can change older article formatting. Treat preprocessing and typography as separate changes.

## 30. Trial v4 separately after stabilising v3

The verified release listing still labels v4 as prerelease. Its newer work includes TypeScript support, a substantially revised asynchronous Nunjucks implementation, incremental-build changes, configuration types, and the optional Build Awesome package migration. These may eventually help, but this repository's nested Nunjucks macros, local plugins, and mixed module formats make an isolated compatibility trial more appropriate than immediate production adoption.

The alpha notes explicitly call out Nunjucks migration risk; they also document changing data/template suffixes and Node requirements. Recheck the actual release status before starting a trial. Do not use APIs copied from v4 documentation in the stable v3 cleanup without confirming availability. [Prerelease notes and migration guidance](https://github.com/11ty/buildawesome/releases).

## Suggested implementation sequence

1. Repair source links and explicitly configure Markdown preprocessing.
2. Complete the Sass module migration and reconcile the overlapping Sass integration and asset-pipeline recommendations.
3. Explore v4 only after the remaining v3 changes are stable and verified on the pinned Node runtime.
