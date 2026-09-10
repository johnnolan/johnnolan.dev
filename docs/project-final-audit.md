# Project audit after modernisation

Reviewed on 10 September 2026 against commit `2fb5dac` on `refactor/infra-2`. This is a review of the implementation and generated output, not a new upstream version survey. Application code was not changed during this audit.

## Assessment

The current published content builds successfully and the principal publishing defects from the original audit are resolved. The site has explicit article collections, metadata validation, draft exclusion, safe code fences, shared metadata, an Atom feed, local fonts, integrated Sass compilation, and content-hashed production CSS.

There are still maintenance and verification gaps. The earlier completion summaries overstate the extent of incremental-build verification and image rollout. Passing the existing tests does not establish that every new article or future build change is covered. Address the actions below before calling the modernisation fully verified; a v4 trial is optional and lower priority.

## Verification performed

| Check                     | Result                                                                                                                                                  |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Runtime                   | Local Node 22.23.1; repository pins 24.15.0                                                                                                             |
| Frozen dependency install | Passed against existing dependencies; not a fresh install                                                                                               |
| Full lint suite           | Passed JavaScript, spelling, Markdown, Sass formatting and Stylelint                                                                                    |
| Content tests             | All 10 test files passed                                                                                                                                |
| Sass integration test     | Passed clean builds after imported token changes and rejection of invalid Sass                                                                          |
| Clean production build    | 20 HTML pages, 16 published articles, 24 generated files plus copied and transformed assets; reported Eleventy time 1.21 seconds                        |
| Output tests              | Passed homepage count, existing heading baseline, IAM sitemap coverage, draft exclusion, JSON parsing, responsive Markdown image output and local links |
| Additional asset scan     | 322 local references checked, no missing files; includes HTML scripts/styles/images, responsive sources, JSON-LD image strings and feed images          |
| Atom feed                 | 16 entries; generated responsive image references resolve locally                                                                                       |
| Accessibility             | Configured Pa11y run passed all 20 URLs                                                                                                                 |

Accessibility results use the repository's `.pa11yci`: Mermaid is hidden and `frame-tested` is ignored. They are not a complete accessibility certification. Lighthouse, live deployment, external-link availability, dependency vulnerability advisories, browser consent/network behaviour, branch protection and a clean installation on Node 24 were not verified. No full-versus-incremental watch sequence was run in this review.

## Remaining actions

### A1. Verify the pinned runtime and actual incremental rebuilds — P2

Evidence: `.nvmrc`, `tests/scss.test.mjs`, `src/modules/eleventy-plugin-sass.mjs`.

The Sass test starts a fresh Eleventy process and removes its fixture output for each colour change. This demonstrates fresh-build correctness, not watch dependency invalidation. It does not exercise a continuously running watcher, imported JavaScript helpers, article metadata changes or deletion. The production hash and emitted CSS agree in the current build, but incremental equivalence remains unproven.

Acceptance: run a fresh frozen install on Node 24.15.0. In an isolated fixture, compare clean output with a persistent watch/incremental sequence covering article content, frontmatter, a Sass partial, an imported helper and deletion. Verify the served stylesheet and page references after each edit, including preview source maps and CSS reload behaviour. Record the result in CI or a repeatable integration check.

### A2. Verify image handling across article layouts — P2

Evidence: `src/modules/responsive-images.js`, `.eleventy.js`, `src/_includes/macros/indexlist.njk`.

Markdown images under `/assets/posts/` are mapped to their matching source files in `src/_includes/img/posts/` before the Eleventy Image transform runs. Listing images still opt out through `eleventy:ignore`, which keeps article cards stable. Raw HTML images bypass the Markdown source mapping, so a normal public `/assets/posts/...` source can still resolve against the wrong input directory.

The current transform emits variants in addition to the retained originals. This increases deployment storage; it does not mean browsers download every variant. Its `sizes` value describes 68ch on wide screens, while article paragraphs containing images span the wider article grid. That mismatch can cause a browser to choose a smaller source than the displayed image needs. All transformed Markdown images are forced lazy, which would be inappropriate if one became a prominent initial-viewport image.

Acceptance: verify representative desktop/mobile rendering and transferred bytes for the global Markdown image rollout, support any permitted raw HTML consistently, align `sizes` with actual layout, and permit eager loading where needed. Preserve existing original URLs, SVGs and animations.

### A3. Broaden publishing checks beyond fixed fixtures — P2

Evidence: `tests/output.test.mjs`, `tests/fixtures/output-baseline.json`, `tests/markdown.test.mjs`.

The baseline iterates only known article URLs; a new article is not automatically added to its heading coverage. Sitemap checking is specific to IAM. The test labelled JSON-LD/image integrity parses JSON but checks image files through HTML and Open Graph, not every JSON-LD reference. It also omits responsive source files, stylesheets and scripts. The additional scan in this audit covers those current files, but is not a committed regression check.

The preprocessing regression test checks an existing JSX closing-brace sequence that also survived the old Liquid configuration. It would not reliably detect accidental re-enabling of preprocessing. Use a fixture with literal opening interpolation and tag syntax whose content would change or fail under Liquid.

Acceptance: enumerate all published articles and reconcile their URLs against sitemap and feed; validate relevant generated asset references; retain intentional historical URL/heading contracts. Add a meaningful preprocessing fixture. Update old baselines only when an editorial change is intended and reviewed.

### A4. Confirm quality gates protect production — P2

Evidence: `.github/workflows/pr_workflow.yml`, `.github/workflows/build_deploy_workflow.yml`.

The PR workflow runs quality checks, but production runs install, build and deploy only. A direct push to main can deploy without those checks if repository settings permit it. Repository branch protection was not inspected, so this is a conditional delivery gap rather than a confirmed settings defect. Same-repository PR previews are deployed before Lighthouse and Pa11y complete.

Acceptance: confirm required checks and protected merging on main, or run the needed gates in the production workflow before deploy. Both workflows should also explicitly provision/verify the declared Yarn version instead of relying on the runner's installed command.

### A5. Review excluded diagrams and browser behaviour — P2

Evidence: `.pa11yci`, `src/modules/eleventy-plugin-mermaid.js`, `src/_includes/scripts/index.js`, `src/_includes/layouts/base.njk`.

The accessibility run excludes all Mermaid diagrams. New diagrams require manual contrast, readability and text-equivalent review. The Mermaid loader also requires the author's `mermaid: true` flag; this is not inferred or enforced by validation.

Analytics acceptance now calls an initializer immediately and its beacon configuration is valid JSON, but there are no browser consent regression tests. Only localhost and 127.0.0.1 are disabled; an accepted consent cookie on a Pages preview can initialise analytics for that preview.

Acceptance: verify accept, reject, returning visits and repeated clicks with browser network observation; decide whether preview analytics are intended. Test diagrams with their real rendered colours and readable alternatives. Do not interpret the current Pa11y pass as covering these cases.

### A6. Repair draft links before publication — P2, publication-specific

Evidence: `src/identity-access-management/articles/blog-terraform-security-audit-with-repo-skills.md` links to `terraform-audit-issues.md`, `../README.md` and two relative skill documents that are not site pages at those locations.

The draft is safely excluded from production, so current output tests pass. Resolve these references to verified repository URLs or deliberately published attachments before setting `draft: false`. Automatic source-path link transformation and attachment colocation are not configured merely because they disappeared from the old backlog.

## Documentation and follow-up

The README's link to a missing Sass proposal was replaced with links to the existing stylesheet section and the new authoring guide during this documentation task. The old modernisation backlog remains historical context; its sole remaining v4 item should not be read as evidence that the actions above are complete.

Use [Creating posts](creating-posts.md) for the current authoring contract. Prioritise A1–A5 as verification and implementation follow-up, A6 before publishing that draft, and trial a new major version separately only after these are understood.
