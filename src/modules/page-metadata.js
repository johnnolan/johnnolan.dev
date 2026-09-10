import assetPath from "../filters/asset-path.js";
import { isoDate } from "../filters/date-filters.js";

const absoluteUrl = (value, baseUrl) => new URL(value, `${baseUrl.replace(/\/$/, "")}/`).href;

export function buildPageMetadata(data, site) {
  const title = data.title || site.name;
  const description = data.description || site.description;
  const canonicalUrl = absoluteUrl(data.pageUrl || "/", site.url);
  const imageUrl = absoluteUrl(assetPath(data.image || site.socialImage), site.url);
  const author = {
    "@type": "Person",
    name: site.name,
    image: absoluteUrl(assetPath(site.authorImage), site.url),
    url: site.url,
    jobTitle: site.jobTitle,
  };
  const datePublished = isoDate(data.date) || undefined;
  const dateModified = isoDate(data.updated) || undefined;

  const shared = {
    "@context": "https://schema.org/",
    name: title,
    description,
    url: canonicalUrl,
    author,
  };
  const jsonLd = data.isArticle
    ? {
        ...shared,
        "@type": "Article",
        headline: title,
        image: imageUrl,
        datePublished,
        dateModified,
        publisher: { "@type": "Organization", name: site.name, url: site.url },
      }
    : {
        ...shared,
        "@type": data.pageUrl === "/" ? "WebSite" : "CollectionPage",
        isPartOf: { "@type": "WebSite", name: site.name, url: site.url },
      };

  return {
    title,
    description,
    canonicalUrl,
    imageUrl,
    openGraphType: data.isArticle ? "article" : "website",
    author,
    datePublished,
    dateModified,
    jsonLd,
  };
}

export function safeJson(value) {
  return JSON.stringify(value).replace(/</g, "\\u003c").replace(/\u2028/g, "\\u2028").replace(/\u2029/g, "\\u2029");
}
