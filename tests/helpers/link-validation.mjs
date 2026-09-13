import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { load } from "cheerio";

export function findBrokenLinks({ htmlFiles, outputRoot, siteOrigin }) {
  const failures = [];
  const pages = new Map();
  const readPage = (file) => {
    if (!pages.has(file)) {
      pages.set(file, load(readFileSync(file, "utf8"), { sourceCodeLocationInfo: true }));
    }
    return pages.get(file);
  };
  for (const file of htmlFiles) {
    const $ = readPage(file);
    const pageUrl = new URL(
      `/${path
        .relative(outputRoot, file)
        .split(path.sep)
        .join("/")
        .replace(/index\.html$/, "")}`,
      siteOrigin,
    );
    $("a[href]").each((_, node) => {
      const href = $(node).attr("href");
      const location = node.sourceCodeLocation?.attrs?.href ?? node.sourceCodeLocation;
      const at = location ? `${file}:${location.startLine}:${location.startCol}` : file;
      const report = (reason) =>
        failures.push(
          `${at}\n  Link: ${JSON.stringify($(node).text().trim())} (href=${JSON.stringify(href)})\n  ${reason}`,
        );
      let url;
      try {
        url = new URL(href, pageUrl);
      } catch {
        report("Invalid link URL.");
        return;
      }
      if (url.origin !== siteOrigin) return;
      let pathname;
      let fragment;
      try {
        pathname = decodeURI(url.pathname).replace(/^\//, "");
        fragment = decodeURIComponent(url.hash.slice(1));
      } catch {
        report("Invalid percent encoding in local link.");
        return;
      }
      const target = path.join(
        outputRoot,
        pathname,
        pathname.endsWith("/") || !pathname ? "index.html" : "",
      );
      if (!existsSync(target)) {
        report(`Target file does not exist: ${target}\n  Resolved URL: ${url.href}`);
        return;
      }
      if (fragment && target.endsWith(".html")) {
        const targetPage = readPage(target);
        if (
          !targetPage("[id]")
            .toArray()
            .some((element) =>
              [url.hash.slice(1), fragment].includes(targetPage(element).attr("id")),
            )
        ) {
          report(
            `Missing fragment #${fragment}: no element with id=${JSON.stringify(fragment)} in ${target}`,
          );
        }
      }
    });
  }
  return failures;
}
