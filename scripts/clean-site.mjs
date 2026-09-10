import { rm } from "node:fs/promises";

// Only the repository's generated default output is removed. This prevents
// unpublished or renamed pages surviving from an earlier preview/build.
await rm(new URL("../_site/", import.meta.url), { recursive: true, force: true });
