# Eleventy template and navigation decisions

This note records the deliberate outcome of recommendation 29 in the modernisation audit. These choices should be revisited when the stated trigger occurs, rather than as part of routine dependency upgrades.

## Keep the current navigation

The site has a small, flat set of hand-authored category and social links. The existing Nunjucks macros make that structure explicit and accessible, so adding the Eleventy Navigation plugin would create configuration without removing meaningful complexity.

Revisit this decision when the site needs nested sections, generated breadcrumbs, or navigation state shared by multiple templates.

## Add pagination when archives need it

Category and home pages remain quick to build and practical to scan at the current article count. Keep their existing collection rendering until a listing becomes unwieldy or materially affects page performance. When that happens, use Eleventy's established pagination data rather than introducing a client-side archive.

## Keep YAML frontmatter and Nunjucks

Articles remain content-first Markdown with YAML frontmatter. Logic belongs in data modules, filters, shortcodes, and plugins. Existing Nunjucks macros are retained where they already express reusable page structure clearly.

JavaScript frontmatter, WebC, JSX, TypeScript templates, virtual templates, and cross-template heading APIs should be adopted only for a specific requirement that the current approach cannot meet cleanly. They are not migration targets by themselves.

## Do not add a browser build framework

The site is a small static Eleventy build with limited browser JavaScript. Vite, islands, or another client build layer would add operational surface without addressing a current performance or authoring problem. Reconsider only if substantial interactive functionality introduces a demonstrated bundling, dependency, or development-server need.
