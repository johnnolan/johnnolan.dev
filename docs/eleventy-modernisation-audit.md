# Eleventy modernisation audit

This log contains only outstanding recommendations. Completed work has been removed so the document remains an actionable backlog.

## Prioritised change list

P2 means a worthwhile capability or maintenance improvement. P3 means optional. Effort is relative: small is a focused change; medium spans configuration, templates, or migration checks.

| # | Potential change | Priority | Effort |
| --- | --- | --- | --- |
| 30 | Trial v4 separately after stabilising v3 | P3 | Medium |

## 30. Trial v4 separately after stabilising v3

The verified release listing still labels v4 as prerelease. Its newer work includes TypeScript support, a substantially revised asynchronous Nunjucks implementation, incremental-build changes, configuration types, and the optional Build Awesome package migration. These may eventually help, but this repository's nested Nunjucks macros, local plugins, and mixed module formats make an isolated compatibility trial more appropriate than immediate production adoption.

The alpha notes explicitly call out Nunjucks migration risk; they also document changing data/template suffixes and Node requirements. Recheck the actual release status before starting a trial. Do not use APIs copied from v4 documentation in the stable v3 cleanup without confirming availability. [Prerelease notes and migration guidance](https://github.com/11ty/buildawesome/releases).

## Suggested implementation sequence

1. Explore v4 only after the remaining v3 changes are stable and verified on the pinned Node runtime.
