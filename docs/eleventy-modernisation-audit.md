# Eleventy modernisation audit

The repository already runs Eleventy **3.1.5**. Its main modernisation opportunity is to use capabilities available in that version, correct problems in content selection and rendering, and simplify the surrounding tooling. A framework rewrite is unnecessary.

The review covers releases and practices relevant to **9 September 2023–9 September 2026**, with the current working tree as the baseline. Upstream documentation lists **3.1.6 as stable** and **4.0.0-alpha.10 as prerelease**. Recommend a small stable patch upgrade, followed by focused changes on v3. The upstream repository now redirects to Build Awesome; that rename does not itself require migrating this site's package or templates. [Stable release notes](https://github.com/11ty/buildawesome/releases/tag/v3.1.6), [upstream release status](https://github.com/11ty/buildawesome/releases).

## Evidence and limits

There are 17 article Markdown files: 16 have frontmatter, and the untracked `blog-terraform-security-audit-with-repo-skills.md` has none. All 16 frontmatter blocks contain `layout`, `title`, `description`, `image`, `date`, `tags`, and `contributors`. Ten also contain unused `imagewidth` and `imageheight` strings. No directory data files currently establish an article contract.

An isolated build using installed dependencies wrote 23 files, including 21 HTML pages, and copied 89 files in a reported 0.64 seconds. Sass compiled separately with deprecation warnings. These checks used local Node **22.23.1**, whereas `.nvmrc` specifies **24.15.0**. This is a useful baseline, not confirmation of a clean installation or CI execution on the pinned runtime.

Generated-output checks found category pages in Latest Posts, missing IAM articles in the sitemap, unescaped fenced code, and the unfinished article emitted without a site layout. All current JSON-LD blocks parsed as JSON, but their author-image URL points to a missing file. Browser behaviour, live hosting, external links, Lighthouse, and a full accessibility run were not verified. No application files or dependency versions were changed.

## Relevant changes within the three-year window

| Capability | Availability | Application here |
| --- | --- | --- |
| Explicit ESM configuration and modules | Eleventy 3.0, October 2024 | Finish the partial module migration. |
| Data schema callback | Eleventy 3.0 | Reject incomplete article metadata. |
| Preprocessors | Eleventy 3.0 | Exclude drafts before rendering and collection generation. |
| Virtual templates | Eleventy 3.0; RSS plugin 2+ | Generate a feed using the installed RSS plugin. |
| Bundled asset bundler | Eleventy 3.0 | Per-page script inclusion and hashed asset URLs. |
| Input-path URL transform | Eleventy 3.0 | Resolve links to source Markdown into published URLs. |
| HTML image transformation | Eleventy 3.0 with Image 4.0.1+ | Optimise existing Markdown images without rewriting every article. |
| HTML-relative passthrough copy | Eleventy 3.1, May 2025 | Keep new article attachments beside their source. |
| Import attributes and incremental-build fixes | Eleventy 3.1 | Already available; mainly relevant when restructuring data and asset compilation. |
| Maintenance dependency updates | Eleventy 3.1.6, June 2026 | Small upgrade from the installed 3.1.5. |

The version boundaries come from the [v3 release notes](https://github.com/11ty/buildawesome/releases/tag/v3.0.0), [v3.1 release notes](https://github.com/11ty/buildawesome/releases/tag/v3.1.0), and feature documentation linked below. Directory data, computed data, pagination, syntax highlighting, and HTML Base are useful established capabilities; they should not be presented as inventions of the last three years.

## Prioritised change list

P1 means address early because there is a demonstrated failure or incorrect output. P2 means a worthwhile capability or maintenance improvement. P3 means optional. Effort is relative: small is a focused change; medium spans configuration, templates, or migration checks.

| # | Potential change | Priority | Effort |
| --- | --- | --- | --- |
| 1 | Escape ordinary code fences and restore proper highlighting | P1 | Small |
| 2 | Replace `collections.all` with an explicit post collection | P1 | Small |
| 3 | Rebuild sitemap selection and modification dates | P1 | Small |
| 4 | Add article data validation | P1 | Medium |
| 5 | Add a draft workflow | P1 | Small |
| 6 | Repair ESLint/parser compatibility | P1 | Small |
| 7 | Make ESM/CJS boundaries explicit | P2 | Medium |
| 8 | Upgrade Eleventy and the separately pinned Markdown parser | P2 | Small |
| 9 | Centralise article defaults in directory data | P2 | Medium |
| 10 | Separate category membership from topic tags | P2 | Medium |
| 11 | Establish date and updated-date semantics | P2 | Small |
| 12 | Consolidate metadata and JSON-LD | P2 | Medium |
| 13 | Add a virtual-template feed | P2 | Small |
| 14 | Repair local links and adopt input-path links | P2 | Small |
| 15 | Introduce responsive image transforms | P2 | Medium |
| 16 | Colocate new article attachments | P3 | Medium |
| 17 | Load Mermaid only where needed | P2 | Small |
| 18 | Replace custom CSS hashing with an asset pipeline | P2 | Medium |
| 19 | Integrate Sass dependency tracking and simplify watching | P2 | Medium |
| 20 | Replace deprecated Sass imports | P2 | Medium |
| 21 | Repair and simplify the local TOC plugin | P2 | Medium |
| 22 | Declare Markdown preprocessing deliberately | P2 | Small |
| 23 | Simplify passthrough rules and template formats | P2 | Small |
| 24 | Make CI dependency installation reproducible | P2 | Small |
| 25 | Make quality checks meaningful and enforceable | P2 | Medium |
| 26 | Remove unused and redundant dependencies | P2 | Small |
| 27 | Add focused output regression checks | P2 | Medium |
| 28 | Simplify fonts and browser script configuration | P3 | Small |
| 29 | Consider navigation, pagination, and newer template options selectively | P3 | Medium |
| 30 | Trial v4 separately after stabilising v3 | P3 | Medium |

## 1. Escape ordinary code fences and restore proper highlighting

### Status: Done

Evidence: `src/modules/eleventy-plugin-mermaid.js:13–24` replaces the global Markdown highlighter. Its fallback emits `<pre class="${language}">${str}</pre>` without escaping `str`. Generated output from `react-callbacks-refs.md` contains a real `<button>` inside `<pre>`; the preconnect article contains an active `<link>` element inside its code example. This is a current rendering defect, not a hypothetical upgrade incompatibility.

Keep Mermaid handling narrowly scoped to Mermaid fences and delegate other languages to Markdown's normal escaped renderer or the official syntax-highlighting plugin. Do not rely on an earlier highlighter being present. Preserve `<pre><code>` semantics, safely handle unknown languages, and check HCL, YAML, shell, JSON, JSX, HTML, and plain fences. The existing syntax-highlighting stylesheet is not a substitute for generating highlighted markup. [Official syntax-highlighting plugin](https://www.11ty.dev/docs/plugins/syntaxhighlight/).

## 2. Replace `collections.all` with an explicit post collection

### Status: Done

Evidence: `src/index.njk` uses `collections.all.reverse().slice(0,12)`. `reverse()` mutates the shared array. The listing macro then filters for `article.data.date`, after the slice. The audited homepage has nine cards, including `/identity-access-management/` and `/hcta/`, instead of twelve articles.

Create one `posts` collection using article input paths or a dedicated internal marker. Filter first, sort deterministically by publication date, then take twelve. Reverse a copy or use a non-mutating filter. Keep category landing pages out of this collection. This fixes both membership and ordering without changing existing public URLs.

## 3. Rebuild sitemap selection and modification dates

### Status: Done

Evidence: `src/sitemap.njk` concatenates only `collections.hcta`, `collections.other`, and category records. The generated sitemap omits the published Entra article, the homepage, and the historical-post index. Category records have no `date`; the Day.js filter formats `undefined` as the current date, giving them `2026-09-09` in the audit build.

Define an explicit set of indexable pages, covering all public sections and articles, with exclusions for drafts and non-page outputs. Deduplicate URLs. Use an editorial `updated` value where available, otherwise a deliberate publication-date fallback; omit `lastmod` if no meaningful date exists. Avoid inventing modification dates from the build clock. Keep URL generation and XML escaping in one place.

## 4. Add article data validation with `eleventyDataSchema`

### Status: Done

The unfinished active article is a concrete example: Eleventy currently builds it into an unstyled public HTML file because nothing requires metadata. Add a schema callback to the article directories, checking non-empty title and description, explicit publication date, recognised category, string-array topics, boolean draft status, and valid image references when supplied.

Scope validation to article directories so that indexes, robots, and sitemap templates are not subject to article rules. Prefer a few clear JavaScript assertions initially; a schema library is optional. Check the explicit editorial date rather than accepting a date inferred from filesystem metadata. This hook is present in the installed Eleventy source and is documented as a v3 feature. [Data validation](https://www.11ty.dev/docs/data-validate/).

## 5. Add a draft workflow using a preprocessor

### Status: Done

Introduce `draft: true` and an `addPreprocessor` callback that returns `false` for drafts in production builds. Allow local previews through a deliberate development mode or environment switch. A future publication date should only schedule publication if a scheduled build also exists; a static deployment cannot publish itself when the clock changes.

Do not merely hide drafts from a listing: their HTML, sitemap entries, and feed entries should all be absent from a clean production build. The active article should be explicitly classified as draft before adding inherited layout defaults. Clean output matters because excluding a file does not guarantee removal of an older emitted copy. [Preprocessors and draft example](https://www.11ty.dev/docs/config-preprocessors/).

## 6. Repair ESLint/parser compatibility

### Status: Done

Evidence: `eslint.config.js` selects `@babel/eslint-parser` 7.28.6, whose installed peer range supports ESLint 7–9. The installed ESLint is 10.3.0. Running the check crashes with `TypeError: scopeManager.addGlobals is not a function`. `lint:report` also fails immediately because `--ignore-path` is invalid with the current configuration system.

Use ESLint's standard parser for the repository's ordinary JavaScript unless a demonstrated Babel-only syntax requires otherwise. Add an appropriate recommended ruleset and separate browser/Node globals. Configure ignores in flat config for `_site`, generated assets, and reports. Currently the only configured rule is Prettier formatting, so the check offers little code-correctness coverage even if the parser works. [ESLint migration guide](https://eslint.org/docs/latest/use/configure/migration-guide).

## 7. Make ESM/CJS boundaries explicit

### Status: Done

`.eleventy.js`, `markdown-it.js`, and `eslint.config.js` use ESM; the filters, cache helper, Mermaid plugin, TOC modules, and GitHub comment script use CommonJS. `package.json` does not declare a module type. The build emits Node's `MODULE_TYPELESS_PACKAGE_JSON` warning.

A coherent migration is to add `"type": "module"`, convert local build modules, and use explicit `.js` extensions for relative ESM imports. Preserve the GitHub script as `.cjs` and update its workflow `require`, or convert both ends of that interface together. Renaming the configuration to `eleventy.config.js` is optional housekeeping, not a requirement. Adding the package type alone would break existing CommonJS `.js` files. Eleventy 3 supports both formats, so retaining explicit `.cjs` islands is valid. [Eleventy 3 ESM support](https://github.com/11ty/buildawesome/releases/tag/v3.0.0).

## 8. Upgrade Eleventy and the separately pinned Markdown parser

### Status: Done

Move from 3.1.5 to the verified stable 3.1.6 in a small dependency-only change. Its release notes describe maintenance dependency updates and a Node 26 warning fix. Separately review the direct `markdown-it` pin of 14.1.1: `.eleventy.js` installs a custom Markdown library, so upgrading Eleventy's transitive parser does not replace the parser selected by `markdown-it.js`.

The 3.1.6 notes name Markdown-it 14.2.0 as an updated dependency; evaluate that version or a subsequently verified compatible release for the direct dependency too. Regenerate the lockfile and compare rendered fences, heading IDs, links, and raw HTML. This review did not perform a package vulnerability scan and makes no claim of a specific exploitable advisory. [3.1.6 maintenance notes](https://github.com/11ty/buildawesome/releases/tag/v3.1.6).

## 9. Centralise article defaults in directory data

### Status: Done

All sixteen complete articles repeat the same layout and contributor. Put common defaults in a small shared module and reference it from `articles.11tydata.js` in each article directory. Keep section-specific values there, including category and an optional section backlink. The article layout currently hard-codes `/hcta/` as `backLink`, though no rendering consumer was found.

Keep editorial facts in YAML. An illustrative proposed contract is:

```yaml
---
title: Managing Entra ID as Code with Terraform
description: An introduction to managing Microsoft Entra ID with Terraform.
date: 2026-09-05
draft: false
topics:
  - entra-id
  - terraform
  - security
image: /assets/posts/johnnolan.jpg
---
```

Here `topics` is a proposed site field, not an Eleventy reserved key. Layout, category, default contributor, and schema come from directory data. Introduce root-relative image paths only alongside template changes: current templates already prepend slashes. Directory data is an established feature, not new in v3. [Directory data](https://www.11ty.dev/docs/data-template-dir/).

## 10. Separate category membership from topic tags

### Status: Done

`tags` currently combines structural values (`hcta`, `iam`, `other`) and topics (`terraform`, `security`, `architecture`). These internal collection names are displayed to readers by `pageContentMetaData.njk`.

Use one category field with a readable label and separate topic tags, or keep existing tags internally while filtering structural values from display. If adding a `posts` tag through directory data, account for Eleventy's array merging so it neither appears as a reader-facing badge nor produces unexpected duplicates. Preserve existing section collections during migration. Either render `contributors` through the already imported author macro or remove the unused presentation interface; currently it is passed around but not shown.

## 11. Establish date and updated-date semantics

### Status: Done

The three date filters all use Day.js; two perform exactly the same `YYYY-MM-DD` formatting. The names `date24HourFilter` and `dateSitemap` obscure this duplication. Use clearly named display-date and ISO-date helpers with explicit missing-value handling and timezone semantics.

For editorial date-only values, use a consistent UTC convention and verify rendering across timezones. Add an optional `updated` date rather than changing original publication dates after edits. Eleventy's newer `addDateParsing` API is available if custom input formats become necessary, but ISO dates already meet this site's needs; no custom parser is warranted simply to use a new API. [Eleventy content dates](https://www.11ty.dev/docs/dates/).

## 12. Consolidate metadata and JSON-LD

### Status: Done

The homepage and three section indexes have no populated description. `layouts/fullwidth.njk` always emits `og:type=article`, even on indexes. Its `post.image`, `page.image`, `renderData`, and `metadata` fallbacks do not match a consistent data model. `site.authorImage` points to `assets/images/johnnolan.png`, while the existing file is `.jpg`.

Use computed data or a small helper to produce one canonical URL, description fallback, social image, page type, author, and publication/update metadata. Build JSON-LD from an object and serialise it safely for an HTML script element, including escaping `<`; string interpolation is fragile with quotes or multiline editorial text. Current JSON-LD parses successfully, so this is a robustness improvement alongside the confirmed missing image. Do not assume HTML URL transforms will rewrite URLs inside JSON-LD or XML.

## 13. Add a virtual-template feed

### Status: Done

The RSS plugin is installed and registered, but there is no feed template or generated feed. Configure its named `feedPlugin` export against the explicit post collection to produce Atom or RSS and add an autodiscovery link in the head. The installed RSS 3.0.0 supports this approach.

Check that feed URLs are absolute, dates correct, and drafts excluded. Decide between summaries and full content. If including full content, test image transformations and code blocks separately from HTML pages. Virtual feeds arrived with RSS 2.0 and Eleventy 3; they avoid maintaining a separate XML template for this simple use case. [RSS virtual templates](https://www.11ty.dev/docs/plugins/rss/).

## 14. Repair local links and adopt input-path links

The active draft links to `terraform-audit-issues.md`, `../README.md`, and two relative skill documents that are not published at those paths. All four are missing targets in the generated output.

Use the bundled `InputPathToUrlTransformPlugin` for links between actual site source files, or the built-in `inputPathToUrl` filter where explicit control is useful. Link repository documentation to its real repository location, once identified. The transform leaves unmatched paths unchanged; it cannot repair absent files, so retain a broken-link check. Preserve public permalinks independently of source filename cleanups. [Input-path URL transformation](https://www.11ty.dev/docs/plugins/inputpath-to-url/).

## 15. Introduce responsive image transforms

The image source directory is approximately 12 MB and is copied wholesale. Existing image markup lacks a central sizing pipeline; the ten historical width/height frontmatter pairs are never consumed. Adopt `@11ty/eleventy-img` and its HTML transform to process Markdown-generated images, supplying sensible responsive widths, formats, dimensions, and loading behaviour.

Start with a screenshot-heavy article. Map source locations carefully: current `/assets/posts/...` output paths originate under `_includes/img/posts`, not `src/assets/posts`. Keep SVG diagrams sharp and preserve animated GIF behaviour. Do not lazy-load a prominent above-the-fold image indiscriminately. Measure output size and build time before expanding. Image v7 requires Node 22+ and ESM, compatible with the pinned Node line. [Image transform and runtime requirements](https://www.11ty.dev/docs/plugins/image/).

## 16. Colocate new article attachments

Eleventy 3.1's `mode: "html-relative"` passthrough copy supports copying referenced files alongside an emitted HTML page. This is useful for new downloadable examples, PDFs, and diagrams stored near their article.

Do not bulk-move old assets: published asset URLs may be externally linked. Use narrow extension globs, preserve existing mappings, and test files referenced by several pages. References inside CSS, JSON-LD, or feeds need their own handling. Coordinate image ownership with the Image plugin so the same assets are not unnecessarily copied twice. [HTML-relative copying](https://www.11ty.dev/docs/copy/#copy-a-file-alongside-a-template).

## 17. Load Mermaid only where needed

### Status: Done

The common layout emits the Mermaid module on all 20 laid-out pages; only one page contains Mermaid diagrams. Add a per-page requirement, preferably derived during Markdown rendering, or a simple explicit flag initially. A v3 bundle can carry the small loader only to pages that need it.

The current shortcode calls `mermaid.initialize(...)` immediately and passes its return value to `addEventListener`; this does not register the intended callback. Use a supported initialisation sequence, and pin an exact Mermaid release rather than a floating major CDN URL. Rendering Mermaid to SVG at build time is an optional later tradeoff that removes the client runtime but adds build dependencies. [Mermaid usage](https://mermaid.js.org/config/usage.html).

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

## 21. Repair and simplify the local TOC plugin

### Status: Done

The vendored TOC implementation reparses HTML with Cheerio and maintains its own hierarchy algorithm. A small fixture with `h2 A`, `h4 B`, `h2 C` produces `B, A, C`, demonstrating incorrect source order for a skipped heading level. Recursive list construction also drops `anchorClass` when descending.

Fix ordering with a document-order heading stack, or evaluate a maintained alternative that shares heading information with the Markdown renderer. Suppress empty TOC containers and remove the unused macro argument. Add fixtures for skipped levels, repeated headings, nested inline markup, and headings without IDs. The newer IdAttribute plugin is an option for mixed-template heading IDs, but it does not replace a TOC; do not run competing ID generators or change existing fragments without compatibility checks.

## 22. Declare Markdown preprocessing deliberately

The config sets `htmlTemplateEngine: "njk"` but does not set `markdownTemplateEngine`, so Markdown is still preprocessed with Eleventy's default Liquid engine. This matters for technical articles containing template-like code: code fences do not necessarily protect text from the earlier template pass.

Audit actual Liquid usage and choose `markdownTemplateEngine: false` for plain Markdown, or explicitly choose Nunjucks if its features are required inside articles. Keep layout rendering in Nunjucks. Do not change `breaks: true` casually: it currently turns soft line breaks into HTML breaks, and removing it can change older article formatting. Treat preprocessing and typography as separate changes.

## 23. Simplify passthrough rules and template formats

### Status: Done

`.eleventy.js` copies `_data` into public `/data`, although no browser code consumes those JSON files. Remove that copy unless the JSON URLs are an intentional public interface. Keep an explicit public-data allowlist if one is needed later.

Restrict `templateFormats` to actual template languages. `css` and `yml` do not have custom compilers registered here and there is already explicit asset copying. The legacy `passthroughFileCopy: true` has no matching setting in the installed core source and should be removed after an output comparison. Consolidate asset destinations without moving stable URLs. Replace the partial `BASE_URL` scheme with Eleventy's `pathPrefix`/HTML Base approach only if subdirectory deployment matters; root deployment already works. HTML Base dates to v2, outside this review window. [HTML Base](https://www.11ty.dev/docs/plugins/html-base/).

## 24. Make CI dependency installation reproducible

### Status: Done

Both workflows cache `node_modules` using only the lockfile hash and skip installation on a cache hit. The key omits Node and OS characteristics, and installs are not frozen. Prefer the package-manager download cache through `setup-node`, then run `yarn install --frozen-lockfile` on every CI build for Yarn Classic.

Declare the chosen package-manager version and document the Node version setup. Pin Wrangler as a project dependency: `npx wrangler` currently fetches an unpinned deploy tool if it is absent. Preserve the existing commit-SHA pins on GitHub Actions. These are reproducibility improvements, not reasons to migrate to a different package manager. [setup-node caching guidance](https://github.com/actions/setup-node#caching-global-packages-data).

## 25. Make quality checks meaningful and enforceable

The PR workflow marks ESLint, Lighthouse, Pa11y, and the report comment as `continue-on-error`. After fixing current failures and choosing thresholds, make the relevant checks required. Review broad accessibility exclusions—especially contrast—against specific accepted exceptions.

The installed Pa11y CI **does** expand the quoted HTML glob, and its JSON reporter **does** write the configured output file; those interfaces are valid. The report script can simply parse the entire JSON file rather than search for a one-line object. Handle missing reports explicitly and avoid confusing browser launch failures with accessibility findings. Prefer an HTTP-served output site for representative browser checks, and ensure comment permissions/fork behaviour are intentional. A generated artifact is useful even when posting a PR comment is unavailable. [Pa11y CI configuration](https://github.com/pa11y/pa11y-ci).

## 26. Remove unused and redundant dependencies

| Dependency or module | Suggested treatment |
| --- | --- |
| `@11ty/eleventy-plugin-inclusive-language` | Installed but unregistered; remove or deliberately enable. |
| Direct `globby` | No application imports found; remove the direct dependency. Pa11y has its own transitive usage. |
| JSHint and `.jshintrc` | Retire after ESLint provides equivalent useful coverage. |
| Babel core/parser/preset and config | Remove if standard-parser linting meets requirements; no Babel transpilation build exists. |
| `eslint-config-prettier` | Installed but not used by the flat config; wire it in if retaining conflicting style rules, otherwise remove. |
| `eslint-plugin-prettier` | Consider separate `prettier --check` instead of formatting through ESLint. |
| `htmlencode` | Remove after Markdown rendering uses the renderer's escape utility or another existing encoder. |
| Day.js | Retain if useful; otherwise replace three small filters with explicit native date formatting. |
| `concurrently` | Remove only after watcher consolidation. |
| Cheerio | Remove only if replacing the local TOC and no output checks need it. |
| RSS plugin | Keep and use for the feed; installing it alone does not create one. |
| YouTube embed plugin | Keep if existing embeds still need it; confirm output before removal. |

Mark the root package private if it is never published and remove the unused `main: index.js` declaration. Build-only packages can consistently be dev dependencies, provided hosting installs them. Dependency cleanup should follow behavioural changes so removals have clear evidence.

## 27. Add focused output regression checks

Use Node's test runner or a small validation script against a clean output directory. Prioritise checks that would catch the demonstrated failures: twelve actual articles on the homepage where available; published IAM content in the sitemap; drafts absent; fenced HTML remaining text; JSON-LD parsing and referenced images existing; local links resolving; and TOC fragments mapping to headings.

Record current article URLs and heading fragments before restructuring. Compare a full build with an incremental edit sequence covering an article, its metadata, a Sass partial, and an imported helper. Avoid snapshots of all whitespace-heavy HTML or tests that merely duplicate configuration constants. Node 24 verification and a frozen clean install remain required before treating the upgrade as validated.

## 28. Simplify fonts and browser script configuration

There is a local Inter WOFF2 file, but the main layout loads Inter from Google Fonts. Choose a single delivery strategy; if self-hosting, verify that the local font covers the required weights and replace the remote stylesheet and preconnects.

`src/_includes/scripts/index.js` mixes `var` and `const`, hard-codes environment behaviour, and supplies Cloudflare beacon data using single-quoted object text rather than valid JSON. Generate that attribute with `JSON.stringify`. The accept handler saves a cookie but does not initialise analytics until another page load; decide whether this is intended. These are small browser-script improvements, not a justification for adding a full JavaScript bundler or changing consent policy.

## 29. Consider navigation, pagination, and newer template options selectively

The current two-category navigation is simple enough to retain. Use the Navigation plugin if hierarchical sections or breadcrumbs become a real requirement. Add archive pagination when article growth warrants it; existing older pagination APIs are sufficient. Keep Nunjucks macros where they work.

Eleventy 3 also offers JavaScript frontmatter, asynchronous configuration/plugins, named configuration exports, virtual templates, and cross-template heading IDs. JavaScript frontmatter would make ordinary articles harder to edit without solving a current problem; keep YAML and put logic in data modules. WebC, JSX, TypeScript templates, islands, and Vite are optional architecture choices, not a mandatory modern standard. The current 21-page HTML output and subsecond Eleventy run provide little evidence for a broad framework or build-tool rewrite. [v3 capability inventory](https://github.com/11ty/buildawesome/releases/tag/v3.0.0).

## 30. Trial v4 separately after stabilising v3

The verified release listing still labels v4 as prerelease. Its newer work includes TypeScript support, a substantially revised asynchronous Nunjucks implementation, incremental-build changes, configuration types, and the optional Build Awesome package migration. These may eventually help, but this repository's nested Nunjucks macros, local plugins, and mixed module formats make an isolated compatibility trial more appropriate than immediate production adoption.

The alpha notes explicitly call out Nunjucks migration risk; they also document changing data/template suffixes and Node requirements. Recheck the actual release status before starting a trial. Do not use APIs copied from v4 documentation in the stable v3 cleanup without confirming availability. [Prerelease notes and migration guidance](https://github.com/11ty/buildawesome/releases).

## Suggested implementation sequence

1. **Correct output and checks:** repair code-fence escaping, article selection, sitemap, missing author image, and ESLint compatibility. Establish a clean-build output baseline.
2. **Define the content contract:** add directory defaults, validation, explicit drafts, category/topic semantics, and consistent dates. Classify the unfinished article before enabling inherited rendering.
3. **Use stable Eleventy features:** take the patch update, add the feed, repair source links, and introduce image transforms on one representative article.
4. **Simplify the build:** complete explicit ESM boundaries, migrate Sass modules, decide on integrated compilation and bundles, then remove redundant dependencies.
5. **Strengthen delivery:** freeze installs, pin deploy tooling, require useful checks, and compare full versus incremental output. Explore v4 only after these changes are stable.

## Sources

Repository evidence refers to the working-tree paths named above. Installed-package source was also inspected for data schemas, default Markdown preprocessing, Babel's peer range, and Pa11y glob/report behaviour. External sources below are primary maintainer documentation or release notes, consulted on 9 September 2026; documentation pages without a publication date are living references.

| Publisher | Source | Date or status |
| --- | --- | --- |
| Eleventy | [v3.0 release](https://github.com/11ty/buildawesome/releases/tag/v3.0.0) | October 2024 |
| Eleventy | [v3.1 release](https://github.com/11ty/buildawesome/releases/tag/v3.1.0) | May 2025 |
| Eleventy | [v3.1.6 release](https://github.com/11ty/buildawesome/releases/tag/v3.1.6) | June 2026 |
| Eleventy / Build Awesome | [Release listing](https://github.com/11ty/buildawesome/releases) | Stable/prerelease status |
| Eleventy | [Data validation](https://www.11ty.dev/docs/data-validate/) | v3 capability |
| Eleventy | [Preprocessors](https://www.11ty.dev/docs/config-preprocessors/) | v3 capability |
| Eleventy | [Directory data](https://www.11ty.dev/docs/data-template-dir/) | Established capability |
| Eleventy | [Content dates](https://www.11ty.dev/docs/dates/) | Living documentation |
| Eleventy | [RSS](https://www.11ty.dev/docs/plugins/rss/) | Virtual feeds and plugin versions |
| Eleventy | [Input-path URL transformation](https://www.11ty.dev/docs/plugins/inputpath-to-url/) | v3 capability |
| Eleventy | [Image](https://www.11ty.dev/docs/plugins/image/) | Image transform and v7 runtime |
| Eleventy | [Passthrough copy](https://www.11ty.dev/docs/copy/) | Includes v3.1 relative mode |
| Eleventy | [Bundle](https://www.11ty.dev/docs/plugins/bundle/) | Bundled in v3 |
| Eleventy | [Sass](https://www.11ty.dev/docs/languages/sass/) | Custom compilation example |
| Eleventy | [HTML Base](https://www.11ty.dev/docs/plugins/html-base/) | v2 capability |
| Eleventy | [Syntax highlighting](https://www.11ty.dev/docs/plugins/syntaxhighlight/) | Established plugin |
| Sass | [Import deprecation](https://sass-lang.com/documentation/breaking-changes/import/) | Deprecation since 1.80.0 |
| ESLint | [Configuration migration](https://eslint.org/docs/latest/use/configure/migration-guide) | Flat config and removed flags |
| Mermaid | [Usage](https://mermaid.js.org/config/usage.html) | Initialisation guidance |
| GitHub Actions | [setup-node](https://github.com/actions/setup-node#caching-global-packages-data) | Package-manager cache guidance |
| Pa11y | [Pa11y CI](https://github.com/pa11y/pa11y-ci) | Runner configuration and reports |
