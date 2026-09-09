# John Nolan Blog

A simple personal blog built with Eleventy, Sass, and Markdown.

## Overview

This repo contains the source for my website and blog. Content is written in Markdown and generated into a static site.

## Local development

```bash
yarn install
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
