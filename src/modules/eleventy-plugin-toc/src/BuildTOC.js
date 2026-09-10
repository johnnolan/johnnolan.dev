import * as cheerio from "cheerio";

import ParseOptions from "./ParseOptions.js";
import NestHeadings from "./NestHeadings.js";
import BuildList from "./BuildList.js";

const defaults = {
  tags: ["h2", "h3", "h4"],
  wrapper: "nav",
  wrapperClass: "toc",
  wrapperLabel: undefined,
  ul: false,
  flat: false,
  anchorClass: undefined,
};

const BuildTOC = (text, opts) => {
  const { tags, wrapper, wrapperClass, wrapperLabel, ul, flat, anchorClass } = ParseOptions(
    opts,
    defaults,
  );

  const $ = cheerio.load(text);

  const headings = NestHeadings(tags, $);

  if (headings.length === 0) {
    return undefined;
  }

  const label = wrapperLabel ? `aria-label="${wrapperLabel}"` : "";

  return wrapper
    ? `<${wrapper} class="${wrapperClass}" ${label}>
        ${BuildList(headings, ul, flat, anchorClass)}
      </${wrapper}>`
    : BuildList(headings, ul, flat, anchorClass);
};

export default BuildTOC;
