# Creating posts: required checklist

This guide describes the current repository behaviour. Follow it for every new post.

## 1. Use the pinned tools

With nvm installed, run from the repository root:

```bash
nvm install
nvm use
npm install --global yarn@1.22.22
yarn install --frozen-lockfile
```

`.nvmrc` pins the required Node version. Commit intentional dependency changes with their lockfile; writing a post normally needs no new package.

## 2. Choose the directory and a stable filename

| Subject                        | Create the Markdown file directly in       | Published URL                                   |
| ------------------------------ | ------------------------------------------ | ----------------------------------------------- |
| Identity and access management | `src/identity-access-management/articles/` | `/identity-access-management/articles/my-post/` |
| Architecture and development   | `src/hcta/articles/`                       | `/hcta/articles/my-post/`                       |
| Historical/other posts         | `src/random/articles/`                     | `/random/articles/my-post/`                     |

Use a descriptive lowercase filename such as `my-post.md`. Keep the file directly inside `articles/`: post collection matching currently excludes nested article folders. Once published, changing the filename or section changes the URL; preserve it or arrange a redirect. Do not add a custom permalink casually.

## 3. Start with a draft and complete frontmatter

```yaml
---
title: "Managing application access"
description: "A practical walkthrough of reviewing and updating application access."
draft: true
topics:
  - entra-id
  - security
image: /assets/posts/johnnolan.jpg
---

Explain what the reader will learn and any prerequisites.

## Prerequisites

List what is needed to follow the article.

## Walkthrough

Describe and explain the steps.

## References

Link to the sources used.
```

Required authoring rules:

- Supply a non-empty title and description, and a `topics` array. Use `topics: []` when no topics apply. Topics must be unique, non-empty strings.
- Write `draft: true` or `draft: false` as a YAML boolean, not a quoted string. Keep it true while work is unfinished.
- Before publication, add an explicit real calendar date such as `date: 2026-09-10` and change the draft flag to false. Omitted draft flags allow publication; keep the flag explicit for clarity.
- Keep the original publication date when updating a post. Add `updated: YYYY-MM-DD` for a substantive revision; it must not precede `date`.
- If supplied, `image` must identify an existing local file under the mapped `/assets/` paths. It is the social/listing image, not automatically a hero image in the article. Omitting it uses the site's social-image fallback for metadata.
- Omit `layout`, `category`, `categoryLabel`, `backLink` and `tags`; directory data supplies those. Do not use `hcta`, `iam`, `other` or `posts` as topics.
- The contributor defaults to John Nolan. Override with a non-empty array of names only when authorship differs.

Drafts can omit the date, but still need valid metadata when previewed. A future date does not delay publication: a non-draft article is eligible immediately.

## 4. Write accessible Markdown

The layout generates the H1 from the title. Start article sections at H2 (`##`) and use H3 for subsections. Headings generate links and a table of contents. Inspect the generated fragment before linking to it; punctuation can be encoded. Changing a published heading can break existing links and the stored heading baseline.

Use fenced code with a language label such as `bash`, `hcl`, `yaml`, `json`, `jsx` or `html`. Examples are escaped as text; syntax colouring is not guaranteed. Markdown preprocessing is disabled, so Liquid or Nunjucks expressions in a post do not execute. The renderer retains `breaks: true`: a single newline in prose becomes a visible line break, so avoid arbitrary hard wrapping within paragraphs.

Use descriptive links and image alt text. Explain diagrams in nearby prose. For Mermaid fences, add `mermaid: true` to frontmatter and preview the rendered diagram. Without that flag, the loader is absent. Mermaid is excluded from automated accessibility checks, so manually check readability and contrast. Verify video embeds have useful, distinct titles and can be operated with a keyboard.

## 5. Put images at the source path and link to the public path

For example, add `diagram.png` under `src/_includes/img/posts/my-post/` and reference it as:

```markdown
![The access review flow from application owners to approvers](/assets/posts/my-post/diagram.png)
```

To let readers open the original screenshot:

```markdown
[![Access review results](/assets/posts/my-post/results.png)](/assets/posts/my-post/results.png)
```

Do not use `src/`, `_includes/` or `_site/` in public links. Keep published asset URLs stable. Markdown images under `/assets/posts/` are transformed into responsive images at build time from the matching files in `src/_includes/img/posts/`. Export images at sensible dimensions and file sizes, preserve SVG diagrams and GIF animation, and remove secrets or personal information from screenshots before committing them.

Avoid raw HTML `<img>` tags unless the image transform's source mapping has been checked: they follow a different path from Markdown images. Old `imagewidth` and `imageheight` frontmatter fields do not size the rendered images.

## 6. Check links while the post is still a draft

Link to published article URLs such as `/hcta/articles/self-hosted-vscode-server/`. Links to source `.md` files are not automatically transformed. For GitHub documentation, use the verified repository file URL. Files next to an article are not automatically published attachments; put downloads in an existing mapped asset location or configure their copying deliberately.

```bash
yarn serve
```

Open the draft's URL directly using the local address printed in the terminal. Drafts show a label but are absent from listings, sitemap and feed. Check desktop and narrow layouts, headings, code scrolling, keyboard interaction, images, full-size links and diagrams. Restart the server after editing build plugins.

Validate draft content before publication:

```bash
yarn verify:preview
```

This builds static preview output in a temporary directory and checks every article, including draft links and images. It leaves `_site` untouched and removes temporary output even when validation fails. Drafts must remain absent from listings, sitemap and feed. A missing draft attachment or broken link must be resolved before publication; do not suppress the failure.

## 7. Validate the production output before merging

When the post is ready, set `draft: false` and its publication date. Run:

```bash
yarn lint:all
yarn test:content
yarn test:scss
yarn verify:production
yarn pa11y-ci
```

`yarn verify:production` forces drafts off even if `INCLUDE_DRAFTS` was set in the shell, cleans `_site`, builds, and checks the resulting output. It rejects empty output, draft pages and development image URLs. `yarn test:output` remains a low-level check of existing output and does not rebuild it. A passing production check cannot validate excluded drafts; use `yarn verify:preview` for those.

Manually confirm the new article appears in its section, in Latest Posts if it is among the newest twelve, and in `_site/sitemap.xml` and `_site/feed.xml`. Verify title, description, author, dates and social image. Inspect the feed entry's code and images as well as the page.

Existing heading contracts live in `tests/fixtures/output-baseline.json`. For a new published article, record its URL and actual H2 IDs there to extend coverage. For an intentional edit to an existing heading, review compatibility before changing the baseline. Do not blindly regenerate expected values to hide regressions.

Automated checks skip external-link availability and exclude Mermaid from accessibility scanning. Verify those manually. If making build or style changes, also verify watch behaviour and the pinned runtime; the Sass test currently uses fresh builds.

## 8. Publish through a reviewed pull request

Review `git diff` and `git status` for accidental draft publication, secrets and generated files. Commit the Markdown, original assets and any deliberate baseline changes with a descriptive message. Do not commit `_site`, `node_modules` or generated reports.

Open a pull request to main, wait for its quality checks and review its preview. Confirm the intended article is present and drafts remain excluded. A merge/push to main triggers the production deployment workflow. After deployment, open the public article and verify its images, links, sitemap and feed. Keep the same publication date and URL for later corrections.
