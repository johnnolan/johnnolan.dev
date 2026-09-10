// Accept legacy relative paths while articles migrate to root-relative URLs.
export default function assetPath(value) {
  return "/" + String(value ?? "").replace(/^\/+/, "");
}
