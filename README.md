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

This generates the production site output.

## Notes

The site is published as a static blog and the source is kept here for editing and publishing.

## Stylesheets

Eleventy compiles `src/scss/main.scss` directly to `assets/main.css`. There is no separate Sass command or generated CSS source directory. Preview CSS is expanded and includes an inline source map; production CSS is compressed and its URL is versioned from the compiled content.

Shared values live in `src/scss/settings/_tokens.scss`, media mixins in `src/scss/tools/_media.scss`, and components import their dependencies with `@use`. Only `main.scss` emits CSS. Add new component modules to its ordered `@use` list.

```bash
yarn format:scss
yarn format:scss:check
yarn lint:scss
yarn test:scss
```

The repository recommends the Prettier VS Code extension and enables format-on-save for SCSS. CI checks formatting, Stylelint, and the Sass build integration. The styles target current evergreen browsers, consistent with the existing use of `:has()` and `text-wrap: balance`; legacy Internet Explorer prefixes are not maintained.

If changes do not appear, confirm that the preview is served by Eleventy and its reload WebSocket is connected. Fix compilation errors shown in the terminal; saving valid Sass resumes updates without restarting. See [the SCSS implementation notes](docs/scss-build-and-cleanup-proposal.md).

## Articles and drafts

Articles require a title, description, explicit `date: YYYY-MM-DD`, a string array for `topics`, and a valid local image path when provided. Category comes from the article directory. Optional `updated` dates cannot precede publication. Validation fails the build for invalid metadata.

Set `draft: true` for unfinished articles; drafts may omit the publication date. `yarn serve` renders them at their normal URL with a draft label, but excludes them from article listings and the sitemap. To build a preview explicitly, use `INCLUDE_DRAFTS=true yarn build`. Do not deploy that preview output.

Normal `yarn build` excludes drafts before rendering and cleans `_site` first, removing pages left by an earlier preview. If using Eleventy directly with a custom output directory, clean that directory yourself before deployment. Future dates do not schedule publication automatically.

Run `yarn test:content` to check code fences, collections, sitemap generation, metadata validation, and draft publishing.

Article layout, default contributor, category, section backlink, and validation are inherited from `articles.11tydata.js` through `src/modules/article-defaults.js`. Keep editorial facts in frontmatter; omit repeated defaults. Use root-relative image paths such as `/assets/posts/johnnolan.jpg`. Legacy relative image values remain supported by the shared asset-path filter.

Topics describe the article (for example `topics: ["terraform", "security"]`). Omit `tags`: the directory assigns its internal collection tag, preserving the `hcta`, `iam`, and `other` section collections. Do not put those collection names, or `posts`, in topics. Readers see a readable category link, topic badges, and contributor names. Topic lists must not contain duplicates.
