# John Nolan Blog

A simple personal blog built with Eleventy, Sass, and Markdown.

## Overview

This repo contains the source for my website and blog. Content is written in Markdown and generated into a static site.

## Local development

The repository pins Node.js in `.nvmrc` and uses Yarn Classic 1.22.22, declared in `package.json`. With [nvm](https://github.com/nvm-sh/nvm) installed, set up the matching toolchain and dependencies with:

```bash
nvm install
nvm use
npm install --global yarn@1.22.22
yarn install --frozen-lockfile
```

After the initial setup, start the development server with:

```bash
yarn run serve
```

This starts Eleventy’s development server and watches templates and Sass modules. Open the local URL printed by Eleventy. SCSS changes update the stylesheet automatically without reloading the page or losing scroll position. Restart the server after changing build plugins.

## Build

```bash
yarn run build
```

This generates site output in `_site`. For a clean production build with output validation, use:

```bash
yarn verify:production
```

This forces draft inclusion off, rebuilds `_site`, and validates pages, links, images, and draft exclusion. CI uses this command before its static deployment preview. `yarn test:output` only inspects existing files; it does not rebuild them.

## Notes

The site is published as a static blog and the source is kept here for editing and publishing.

## Stylesheets

Eleventy compiles `src/scss/main.scss` directly into the output. There is no separate Sass command or generated CSS source directory. Preview CSS is expanded at `assets/main.css` with an inline source map; production CSS is compressed and emitted with a content-hashed filename.

Shared values live in `src/scss/settings/_tokens.scss`, media mixins in `src/scss/tools/_media.scss`, and components import their dependencies with `@use`. Only `main.scss` emits CSS. Add new component modules to its ordered `@use` list.

```bash
yarn format:scss
yarn format:scss:check
yarn lint:scss
yarn test:scss
```

The repository recommends the Prettier VS Code extension and enables format-on-save for SCSS. CI checks formatting, Stylelint, and the Sass build integration. The styles target current evergreen browsers, consistent with the existing use of `:has()` and `text-wrap: balance`; legacy Internet Explorer prefixes are not maintained.

If changes do not appear, confirm that the preview is served by Eleventy and its reload WebSocket is connected. Fix compilation errors shown in the terminal; saving valid Sass resumes updates without restarting.

## Articles and drafts

Follow [Creating posts: required checklist](docs/creating-posts.md) for a copyable template and the complete publishing workflow. See the [final project audit](docs/project-final-audit.md) for verification results and remaining actions.

Articles require a title, description, explicit `date: YYYY-MM-DD`, a string array for `topics`, and a valid local image path when provided. Category comes from the article directory. Optional `updated` dates cannot precede publication. Validation fails the build for invalid metadata.

Set `draft: true` for unfinished articles; drafts may omit the publication date. `yarn serve` renders them at their normal URL with a draft label, but excludes them from article listings and the sitemap. Run `yarn verify:preview` to build and check all articles, including draft links, in a temporary directory. It uses static images, leaves `_site` untouched, and removes its temporary output on success or failure. Drafts remain absent from listings, sitemap and feed. A broken draft link fails this check; fix it before publication. Use `yarn serve` for visual preview.

With `INCLUDE_DRAFTS` unset, `yarn build` excludes drafts before rendering and cleans `_site` first, removing pages left by an earlier preview. If using Eleventy directly with a custom output directory, clean that directory yourself before deployment. Future dates do not schedule publication automatically.

Run `yarn test:content` to check code fences, collections, sitemap generation, metadata validation, and draft publishing.

Article layout, default contributor, category, section backlink, and validation are inherited from `articles.11tydata.js` through `src/modules/article-defaults.js`. Keep editorial facts in frontmatter; omit repeated defaults. Omit `image` to use `site.socialImage` for both social metadata and image-enabled listings. Set a root-relative `image` only for an article-specific override. Do not add `imagewidth` or `imageheight`: those legacy fields are ignored. Legacy relative image values remain supported by the shared asset-path filter.

Topics describe the article (for example `topics: ["terraform", "security"]`). Omit `tags`: the directory assigns its internal collection tag, preserving the `hcta`, `iam`, and `other` section collections. Do not put those collection names, or `posts`, in topics. Readers see a readable category link, topic badges, and contributor names. Topic lists must not contain duplicates.

## Atom feed

`src/feed.njk` generates `/feed.xml` using the RSS plugin filters and the site image transforms. Entry IDs are stable article URLs. Entries stay ordered by publication date; `updated` changes entry and feed modification timestamps without changing publication dates or IDs. Drafts never appear in the feed, including in preview verification.

Production output checks compare feed entries with published pages and verify embedded image URLs, including every generated `srcset` candidate. `yarn test:content` also tests revisions, escaped HTML, dates and draft exclusion against the real feed template.

## Continuous integration

Pull requests report four separate jobs in GitHub Actions:

1. **Validate source** checks JavaScript, Markdown, spelling and SCSS.
2. **Build production site** creates and verifies `_site`, then stores it as a short-lived workflow artifact.
3. **Test generated site** restores that exact artifact and runs content, Sass, Lighthouse and pa11y checks.
4. **Publish Cloudflare preview** publishes the tested artifact and comments its URL on same-repository pull requests.

The jobs run in that order through explicit dependencies. A failed validation, build, or test prevents preview publication. Pull requests from forks run the read-only jobs but skip preview publication and comment-writing steps because repository secrets are unavailable.

Pushes to `main` use two further jobs: **Build production site** rebuilds, verifies and stores the output, then **Publish production to Cloudflare** restores that exact artifact for deployment. A failed build cannot reach the production publishing job.
