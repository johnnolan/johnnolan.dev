# Eleventy modernisation and version 4 readiness report

## Assessment

The repository is already substantially modernised. At commit `0d878e3`, it pins Eleventy **3.1.6**, uses explicit ECMAScript modules, validates article data, excludes drafts with a preprocessor, generates an Atom feed, optimises Markdown images, and compiles Sass through Eleventy. Treating it as an old Eleventy 1.x or 2.x project would produce an inaccurate backlog.

As checked on **12 September 2026**, the official documentation identifies **3.1.6 as stable** and **4.0.0-alpha.10 as the v4 canary**. Version 4 exists, but the evidence does not support calling it a stable release. The upstream repository and v4 releases also use the name **Build Awesome**. Keep production on 3.1.6 and evaluate v4 in an isolated compatibility branch when its benefits justify the work. [^1][^2]

The largest remaining opportunities are better coverage of feeds and previews, reducing dependence on development-server internals, and finishing the article metadata contract. Most can be addressed on v3. Version 4 is an optional migration project, not a prerequisite for those improvements.

This assessment covers the current configuration, all 17 article frontmatter blocks, local modules and filters, scripts, workflows, tests, and existing authoring/architecture documentation. The requested three-year window is September 2023–September 2026. Older capabilities are explicitly distinguished from features introduced during that period. This is a source and local-test assessment, not a deployed-site audit or a certification that every installed dependency is vulnerability-free.

## Current baseline and verification

| Area | Current repository evidence | Assessment |
| --- | --- | --- |
| Core | `package.json`: `@11ty/eleventy: 3.1.6` | Already on the documented stable release. |
| Runtime | `.nvmrc`: `24.21.0` | Sufficient for the documented v4 alpha runtime minimum; shell actually used for this review was Node `22.23.1`. |
| Modules | `type: module`; ESM configuration, filters, plugins and data modules | ESM migration is complete. The GitHub helper deliberately uses `.cjs`. |
| Articles | 5 architecture, 2 IAM, 10 historical files | 16 dated non-drafts and one undated explicit draft. |
| Data | Three `articles.11tydata.js` files delegate to `article-defaults.js` | Shared layout, author, category and validation already centralised. |
| Markdown | Explicit `markdownTemplateEngine: false`; renderer extensions through `amendLibrary` | Preserves code examples containing template-like syntax. |
| Assets | Image 7, Sass module system, hashed production CSS | Modern baseline already implemented. |
| CI | Frozen Yarn installation, pinned Wrangler and actions, required PR checks | Earlier cache/install/lint recommendations are already implemented. |

Checks executed without editing application code:

- `yarn run test:content`: passed all ten test files, including temporary-fixture publishing tests.
- `yarn run test:scss`: passed its temporary-fixture build checks.
- `yarn run lint:check`: passed.
- `yarn run test:output`: failed against the **pre-existing** `_site`. Direct execution identified three passing and four failing assertions.

The existing output contains the draft article and `/.11ty/image/` URLs associated with development image transformation. Its failures include development image paths, draft/sitemap expectations, and a draft link to `terraform-audit-issues.md` that does not resolve. These findings describe that local output, not the deployed production site. Eleventy Image intentionally uses request-time image processing in serve mode. [^10]

No fresh production build, dependency installation, v4 installation, deployment, or browser accessibility run was performed. This preserves the existing preview output and keeps the report-only request narrow. The tests above therefore establish a useful v3 baseline, but do not establish v4 compatibility or a passing clean production build on Node 24.21.0.

The previous `docs/eleventy-modernisation-audit.md` now contains only the v4 trial item. Its reference to mixed module formats should be qualified: explicit ESM plus a deliberate `.cjs` helper is valid, not unfinished migration work.

## Relevant developments from the past three years

| Capability | Release context | Application here |
| --- | --- | --- |
| Native ESM support | Eleventy 3, released October 2024 | Already adopted. Keep `.js` imports explicit and retain `.cjs` where required. [^3] |
| Preprocessor API | Added in v3 | Already used for drafts. Could also detect Mermaid fences or support a deliberately designed scheduling policy. [^7] |
| `eleventyDataSchema` | Added in v3 | Already used. Improve validation coverage rather than replace it automatically with a large schema dependency. [^8] |
| Virtual feed templates | Eleventy 3 / RSS plugin 2; RSS 3 uses ESM | Already adopted. A manual feed becomes useful if editorial update dates require greater control. [^9] |
| Input-path URL transformation | Added in v3 | Optional authoring improvement for links to source Markdown files; opt-in plugin is bundled with core. [^11] |
| Bundle API | Added in v3 | Optional small CSS/JS/HTML bundles without introducing a full browser build framework. [^12] |
| Image transform development middleware and newer Image options | Eleventy 3 / Image 5 and subsequent Image releases | Already benefiting from responsive output and request-time preview processing. Review sizing, cache persistence and output validation next. [^10] |
| v3.1 maintenance/performance work | v3.1 released May 2025; stable patch now 3.1.6 | Already acquired through the current pin; no further architectural change needed to obtain core improvements. [^13] |
| Async Nunjucks, incremental changes and configuration types | v4 prereleases | Potential developer benefits, with compatibility work described below. [^4][^5] |

Directory data, computed data, pagination, and YAML frontmatter are useful established features, not inventions of v4. There is no new frontmatter standard that requires migrating this blog to JavaScript, JSX or TypeScript. Retain the decisions in `docs/eleventy-template-decisions.md`: Nunjucks and Markdown suit this site, and navigation plugins, pagination or WebC should follow a concrete need.

## Prioritised opportunities

Priority P1 means useful correctness or migration assurance work; P2 means worthwhile maintenance or authoring improvement; P3 means optional. Effort is relative: small is a focused change, medium spans modules or integration checks. These are recommendations, not changes applied by this report.

| # | Recommendation | Priority | Effort |
| --- | --- | --- | --- |
| 1 | Establish clean production and preview validation as separate modes — implemented | P1 | Medium |
| 2 | Test the complete Atom output and align update semantics | P1 | Medium |
| 3 | Exercise Sass live reload before any v4 upgrade | P1 for v4 | Medium |
| 4 | Expand the schema around author-controlled flags and dates | P2 | Small–medium |
| 5 | Remove obsolete image dimensions and simplify defaults | P2 | Small |
| 6 | Make contributor metadata consistent across HTML and feeds | P2 | Medium |
| 7 | Detect Mermaid usage and improve diagram verification | P2 | Medium |
| 8 | Consolidate image policy and strengthen asset checks | P2 | Medium |
| 9 | Add useful video titles instead of numeric placeholders | P2 | Small–medium |
| 10 | Harden the accessibility runner's lifecycle and content serving | P2 | Small |
| 11 | Make runtime and deployment validation reproducible | P2 | Small–medium |
| 12 | Adopt source-path links where they improve authoring | P3 | Small |
| 13 | Add syntax highlighting if technical articles need it | P3 | Small–medium |
| 14 | Consider Bundle API for browser assets | P3 | Medium |
| 15 | Trim unused abstractions and duplicated section metadata | P3 | Small |
| 16 | Trial v4 without simultaneously renaming the package | P3 | Medium |

### 1. Separate production verification from draft previews

**Implemented:** `yarn verify:production` forces drafts off, cleans and rebuilds `_site`, then validates output. `yarn verify:preview` builds drafts in temporary static output, validates all article links and removes temporary files without changing `_site`. Empty output and development image URLs fail validation. CI now uses production verification. The existing draft attachment link remains an authoring issue; article files were intentionally not changed. The observations below describe the original audit baseline.

Evidence: `scripts/clean-site.mjs`, `src/modules/drafts.mjs`, `tests/output.test.mjs`, and `docs/creating-posts.md` already distinguish production builds from previews. However, `test:output` reads whatever currently occupies `_site`; it does not establish what produced those files. This explains the review's local failures.

Consider a single verification command that performs a clean production build and then output checks, and a distinct preview check that deliberately allows drafts. Include a clear failure when no HTML was generated, and verify that production output contains neither draft routes nor development image middleware URLs. Keep the clean-before-production behaviour.

The current draft's unresolved `terraform-audit-issues.md` link is an authoring issue to resolve before publication. Link to a real attachment or published destination, or represent the filename as code if it is only an illustrative output name. Production checks correctly cannot validate content excluded as a draft; a preview validation mode closes that gap.

### 2. Validate feed output and editorial revision dates

Evidence: `.eleventy.js` registers `feedPlugin`, and `content-collections.mjs` supplies oldest-first feed items because the plugin reverses them. That ordering is intentional and tested; do not remove the reversal as a stylistic cleanup.

The installed RSS 3 template, `node_modules/@11ty/eleventy-plugin-rss/src/virtualTemplate.js`, renders entry `<updated>` from `post.date`, not `post.data.updated`. In contrast, the site's page metadata and sitemap support the editorial `updated` field. A future revised article can therefore have different update semantics in the feed. No current article supplies `updated`, so this is a latent inconsistency rather than an observed incorrect revision timestamp.

If revisions should notify subscribers, use a controlled manual Atom template with separate publication and modification dates, preserving stable entry IDs and ordering. The official plugin supports manual templates for additional control. [^9]

Add integration coverage for XML parsing, entry count and order, draft exclusion, stable IDs, modification dates, and every local image URL in embedded HTML, including `srcset`. The existing tests cover feed collection ordering but not the complete generated XML. Verify Markdown/image transforms also behave correctly through the feed's `renderTransforms` path.

### 3. Treat the custom Sass live-reload adapter as the main v4 risk

Evidence: `src/modules/eleventy-plugin-sass.mjs` replaces `server.reload`, rewrites events to `subtype: "css"`, and reads `event.build.templates`. This is more tightly coupled to the development server than the surrounding documented extension API. The current Sass test launches separate builds; it does not test a running watcher.

Keep the existing compile cache, dependency registration and content hashing unless a measured problem emerges. Before v4 adoption, verify changes to the entrypoint and imported partials, CSS-only refresh, template refresh, compiler-error recovery, and successive edits in one server session. Guard missing event fields or replace the adapter with a supported mechanism only after checking the target server API. v4 changes both server dependencies and event behaviour. [^4][^5]

A successful one-shot build does not settle this compatibility question.

### 4. Finish the article schema contract

Evidence: `src/modules/article-schema.js` correctly requires titles, descriptions, valid categories, topics, contributors, explicit publication dates and existing image files. Preserve those protections.

Remaining improvements:

- Validate `mermaid` as a boolean. A quoted value such as `"false"` is truthy in template conditions.
- Consider warnings for unknown **editorial** keys to catch misspellings. Do not reject arbitrary Eleventy-generated data keys from the merged data object.
- The schema re-reads YAML with regular expressions to prove a date was explicitly authored. This duplicates a subset of the parser and rejects some otherwise valid YAML presentations. Either document the restricted single-line date format as intentional, or extract authored fields with a proper parser and declare that parser directly.
- Test real frontmatter with malformed unquoted dates, quoted dates, missing dates, and `updated` before publication. The existing unit test mostly supplies preconstructed objects, which does not prove every YAML coercion case behaves correctly.
- Require finite valid `Date` values before calling `toISOString`, so invalid input produces a filename-specific validation message instead of a generic exception.

The native v3 schema hook is sufficient for the present size of the contract. Zod or another validator is optional; its value would be more consistent errors or substantially more complex content types. [^8]

### 5. Remove obsolete frontmatter and use defaults deliberately

All ten historical posts still contain `imagewidth` and `imageheight` strings. Searches found no rendering consumer, and `docs/creating-posts.md` explicitly says they do not size images. Remove them in a future cleanup after confirming no external authoring process consumes them. Image dimensions should come from the image pipeline.

Several newer posts repeat `/assets/posts/johnnolan.jpg`, which is already `site.socialImage`. Omitting it would preserve the current metadata fallback, but decide how the dormant `showImages` listing mode should behave before removing explicit images wholesale: that mode tests `article.data.image` directly.

For new posts, the existing model is appropriate:

```yaml
---
title: "A descriptive article title"
description: "A short explanation of the article."
draft: true
topics: ["terraform", "security"]
---
```

Add an explicit `date` when publishing, and `updated` only for substantive revisions. Keep layout, category, internal tags and default contributors in directory data. Add a `permalink` only when stabilising a URL that must survive a file move; preserve existing published routes and heading fragments.

Future publication scheduling is optional. Today, future-dated non-drafts publish immediately, as documented. If scheduling is added through preprocessing, it also needs a build trigger at publication time; a static site does not update merely because the clock advances. [^7]

### 6. Align contributor metadata

Evidence: visible metadata renders the article's `contributors`, but `buildPageMetadata` always creates a single author from `site.name`; the feed also uses the site author. This is consistent for current articles, all of which inherit John Nolan, but becomes inconsistent for guest or co-authored posts.

If multiple authors are planned, introduce a small author registry and resolve contributors into visible bylines, Article JSON-LD, and feed entry authors. Otherwise retain the single-author model and document the constraint. Avoid building a general author database without that requirement.

### 7. Reduce Mermaid authoring errors and cover rendered diagrams

Evidence: the Markdown renderer recognises Mermaid fences, while `base.njk` includes the loader only when frontmatter has `mermaid: true`. These two independent switches can disagree.

Use Markdown token inspection to derive usage, or have validation require the flag when relevant fences occur. Token inspection is preferable to a naive body-wide string search because articles can discuss Mermaid syntax without rendering a diagram. Keep the currently repaired escaping and load lifecycle.

The loader is pinned to Mermaid 10.9.5 on a CDN. It is outside the package lockfile and ordinary npm dependency updates. Consider managing it as an explicit dependency or a separately reviewed asset; do not jump majors without checking existing diagrams. `.pa11yci` hides `.mermaid`, so automated checks do not cover rendered SVG readability or accessibility. Add a targeted browser/manual check with descriptive text and accessible diagram titles. This is a coverage gap, not proof that the current diagrams are inaccessible.

### 8. Consolidate responsive-image policy

Evidence: `.eleventy.js` and `responsive-images.js` duplicate formats, widths, `sizes`, loading and decoding settings. The Markdown adapter recognises only `/assets/posts/`, while raw HTML and other image paths follow different rules.

Define shared policy once, retain a documented source/public-path mapping, and test Markdown and raw HTML explicitly. Expand output validation to check every generated `source[srcset]` candidate, SVG and animated output, and feed images. Current checks inspect `img[src]` and the presence of responsive attributes, not every referenced candidate file.

Evaluate Image's newer automatic sizing support and cache controls with real screenshots and layouts. Avoid making every future above-the-fold image lazy by default; provide an intentional priority override if a hero image is introduced. Preserve full-size screenshot links. Image already supports responsive dimensions, development request-time processing, and newer format handling; these are refinements to an existing integration. [^10]

The Linux-specific `@img/sharp-libvips-linux-x64` optional dependency deserves a short rationale. Do not remove it until clean installation is verified on CI and relevant development platforms; it may be an intentional native-install workaround.

### 9. Improve embedded-video titles

Evidence: `youtube-embed-titles.js` replaces identical titles with numbered variants such as “Embedded YouTube video 2”. This makes them distinct without identifying their subject.

Prefer titles supplied by an explicit embed shortcode or maintained metadata. If the current plugin remains, document transform ordering and test it against plugin upgrades: the implementation matches one exact HTML string. Keep iframe loading and keyboard behaviour in the accessibility review.

### 10. Harden the Node accessibility runner

Evidence: `scripts/run-pa11y.mjs` already uses native `globSync`, a local HTTP server, and argument-array process spawning. Those are reasonable modern choices.

Potential improvements are an explicit error when no HTML exists, server/child startup-error handling, signal forwarding, and cleanup in `finally`. Add MIME mappings for generated WebP, AVIF if introduced, and `.mjs` if introduced. The current map serves unknown formats as `application/octet-stream`; that makes the test server less representative of production even where browsers recover by sniffing.

Keep the server bound to loopback. This script is a test utility, so a general-purpose server framework is unnecessary.

### 11. Make validation and tooling reproducible

Evidence: `.nvmrc` and `packageManager` are pinned, but `package.json` has no `engines` declaration, and the review shell ran a different Node version. Add a compatible runtime range reflecting the **whole toolchain**, and ensure local instructions activate the pinned runtime before install/test. Do not derive that range solely from Eleventy's minimum.

The PR workflow runs the quality suite; the main deployment workflow only installs, builds and deploys. If direct pushes to main are permitted, they bypass the PR-only checks. Either enforce branch protections or share the necessary verification in deployment. Branch protection configuration was not inspected, so this is conditional rather than an established bypass in practice.

Consider deployment concurrency to prevent older overlapping builds finishing after newer ones. Review `renovate.json`'s `group:all`: splitting core/plugin upgrades from unrelated tooling would make rendering regressions easier to attribute.

Preview hostnames are not in the configured analytics exclusion list, which contains only localhost and loopback. Accepted cookies can therefore enable analytics on a Pages preview. If clean production analytics matter, use an explicit production-host allowlist or environment-derived setting.

### 12–15. Optional features and small cleanup

**Source-path links:** the v3 InputPath transform can turn links to article Markdown files into their output URLs. This can improve editor navigation and survive permalink changes. It silently leaves unmatched paths unchanged, so retain broken-link checks. It will not create the draft's missing report attachment. [^11]

**Syntax highlighting:** the site has code-block styling but no registered syntax-highlighting plugin. A build-time plugin could improve Terraform, YAML and JavaScript examples. Preserve escaping, language classes, focusability, Mermaid handling and existing heading URLs. This plugin is an established option, not a new v4 requirement. [^14]

**Bundle API:** consider a small hashed JavaScript bundle if browser code grows. The existing script relies on `document.currentScript.dataset`; simply changing it to `type="module"` would break that configuration access. Preserve classic-script semantics or redesign configuration explicitly. Bundle is a plain-text asset facility, not an npm import resolver or replacement Sass compiler. [^12]

**Cleanup:** the registered `concat` filter appears unused; the template's `.concat(...)` call is an array method, not that filter. The custom `log` filter overlaps Eleventy's built-in filter. Section names and URLs exist in both `article-sections.js` and `categories.json`; a shared source could help, but preserve the intentional omission of historical posts from primary navigation. These are low-value refinements compared with upgrade assurance.

Do not replace the tested TOC implementation solely because alternatives exist. Its currently repaired nesting and escaping should be preserved. Likewise, Day.js is now used consistently with UTC; replacing it with `Intl` is optional dependency reduction, not an urgent fix.

## Version 4 compatibility and upgrade path

### Changes that matter to this repository

| v4 change | Repository impact |
| --- | --- |
| Minimum Node 22.15+ in alpha.8 | The pinned Node 24.21.0 satisfies this; still check all package engines. [^4] |
| Fully async Nunjucks refactor in alpha.9 | Exercise nested macros, `{% set %}` blocks, filters, feed rendering and layout inheritance. Upstream explicitly calls this a risk area. [^5] |
| Layout-cache hotfix in alpha.10 | Verify repeated layout edits in serve mode, not just cold builds. [^2] |
| Sequential event execution by default in alpha.9 | Review Sass cache invalidation and plugin event ordering. [^5] |
| New data/template filename aliases | Scan for `.data.js` and `.server.js` collisions. None were found in the current source inventory. Existing `.11tydata.js` files need not be renamed for the trial. [^4] |
| Removed `slug` filter and `--to=ndjson` | No uses found in the reviewed application/scripts. [^6] |
| Omitted Nunjucks shortcode argument becomes `undefined` | Review shortcode and plugin assumptions; custom Mermaid shortcode takes no arguments. [^6] |
| Date-parser and frontmatter dependency changes | Run integration cases for quoted/unquoted dates and exact publication ordering. [^6] |
| Updated Bundle and development-server dependencies | Test image middleware, Sass refresh and transform ordering. [^4][^5] |

Configuration types and batched incremental builds are promising, but this 17-article repository has no demonstrated build-time problem that requires them. Avoid enabling incremental production builds as part of the first upgrade; full builds give a clearer comparison.

### Recommended trial: retain the Eleventy package name

The following are instructions for a future implementation, **not commands executed during this review**.

1. Start from a clean branch and activate the pinned runtime. Create a separate worktree or checkout for the experiment. Capture a passing clean v3 build, tests and output inventory first.
2. Recheck stable and canary versions at that time. The presently verified target is an alpha, and tags can move.
3. Upgrade only the core package initially. With this repository's Yarn setup, the exact-version equivalent of the documented canary installation is:

   ```sh
   yarn add --dev --exact @11ty/eleventy@4.0.0-alpha.10
   ```

   Confirm the chosen version is available before use; the official release provides `@11ty/eleventy@canary` as its installation channel. An exact pin and committed lockfile make the experiment reproducible. [^2]

4. Retain `.eleventy.js`, YAML frontmatter, `.11tydata.js`, existing `eleventy*` data names, and `eleventy` scripts initially. Do not combine a renderer upgrade with a content architecture rewrite.
5. Run the existing checks on that branch:

   ```sh
   yarn run lint:all
   yarn run test:content
   yarn run test:scss
   yarn run build
   yarn run test:output
   yarn run pa11y-ci
   ```

6. Complete the missing integration checks: actual feed XML; every image candidate; draft preview then production cleanup; Mermaid rendering; and live edits to layouts, Markdown and imported Sass. The latter is necessary because current Sass tests use fresh processes.
7. Compare URLs, heading IDs, metadata, dates, feed IDs, sitemap entries and original-asset links with the v3 baseline. Investigate semantic changes; do not automatically rewrite the baseline to make a test pass.
8. Review a static preview using production build mode. Confirm no development middleware URLs survive. Keep production deployment on v3 until the trial is accepted and prerelease risk is an explicit decision.

Rollback is to restore the paired v3 `package.json` and `yarn.lock`, reinstall with the frozen lockfile and rebuild cleanly. Do not mix a v3 manifest with a v4 lockfile or deploy leftover trial output.

### Optional later step: rename to Build Awesome

The v4 release notes document `@awesome.me/buildawesome@alpha` as an alternative package and a separate optional migration. Keep that rename separate from the compatibility trial. [^2][^4]

This repository has a concrete extra migration surface: `tests/scss.test.mjs`, `tests/drafts.test.mjs`, and `tests/article-defaults.test.mjs` invoke `node_modules/@11ty/eleventy/cmd.cjs` directly. Removing the Eleventy package would break those paths. Resolve the selected package's supported CLI entry and update tests alongside package scripts; do not assume the new package has the same internal file layout.

Confirm plugin compatibility with the selected package before removing `@11ty/eleventy`, then update CLI references and documentation together. There is no benefit in mass-renaming article keys simply to match new branding.

### Acceptance criteria

A v4 trial is ready for a deployment decision only when the pinned-runtime checks pass, generated production assets and feed content resolve, URLs and headings remain stable, drafts stay out of production, and watch-mode behaviour is verified. Record any necessary plugin changes and their upstream API basis. A clean install and successful build alone are insufficient evidence for this particular custom Sass/Nunjucks setup.

## Sources

Repository evidence refers to commit `0d878e3` and the existing local generated output inspected on 12 September 2026. Dependency source was inspected locally where stated. External documentation was checked on the same date; prerelease behaviour may change.

[^1]: Eleventy, [Getting Started and current version indicators](https://www.11ty.dev/docs/). Stable 3.1.6 and canary 4.0.0-alpha.10.
[^2]: Eleventy / Build Awesome, [v4.0.0-alpha.10 release](https://github.com/11ty/buildawesome/releases/tag/v4.0.0-alpha.10). Prerelease, installation channels and cache fix.
[^3]: Eleventy, [v3.0.0 release announcement](https://www.11ty.dev/blog/eleventy-v3/), 2 October 2024.
[^4]: Eleventy / Build Awesome, [v4.0.0-alpha.8 release](https://github.com/11ty/buildawesome/releases/tag/v4.0.0-alpha.8). Runtime, suffixes, incremental work, configuration types and optional migration.
[^5]: Eleventy / Build Awesome, [v4.0.0-alpha.9 release](https://github.com/11ty/buildawesome/releases/tag/v4.0.0-alpha.9). Nunjucks, events and Bundle changes.
[^6]: Eleventy, [v4.0.0-alpha.1 release notes](https://github.com/11ty/buildawesome/releases/tag/v4.0.0-alpha.1). Early breaking changes; use later releases, not alpha.1 itself.
[^7]: Eleventy, [Preprocessors](https://www.11ty.dev/docs/config-preprocessors/).
[^8]: Eleventy, [Validate Data](https://www.11ty.dev/docs/data-validate/).
[^9]: Eleventy, [RSS plugin](https://www.11ty.dev/docs/plugins/rss/). Virtual and manual feed options.
[^10]: Eleventy, [Image](https://www.11ty.dev/docs/plugins/image/). HTML transforms, request-time processing and image options.
[^11]: Eleventy, [InputPath to URL](https://www.11ty.dev/docs/plugins/inputpath-to-url/).
[^12]: Eleventy, [Bundle](https://www.11ty.dev/docs/plugins/bundle/).
[^13]: Eleventy, [v3.1 announcement](https://www.11ty.dev/blog/eleventy-v3-1/), 13 May 2025, and [v3.1.6 release notes](https://github.com/11ty/buildawesome/releases/tag/v3.1.6).
[^14]: Eleventy, [Syntax Highlighting](https://www.11ty.dev/docs/plugins/syntaxhighlight/).
