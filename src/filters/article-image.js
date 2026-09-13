import assetPath from "./asset-path.js";

// Social metadata and optional listing images share the same default.
export default function articleImage(image, site) {
  return assetPath(image || site.socialImage);
}
