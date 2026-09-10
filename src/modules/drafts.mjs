export function drafts(config) {
  config.addPreprocessor("drafts", "md,njk", (data) => {
    if (data.draft !== undefined && typeof data.draft !== "boolean") {
      throw new Error("draft must be a boolean");
    }
    const preview = ["serve", "watch"].includes(process.env.ELEVENTY_RUN_MODE);
    if (data.draft && !preview && process.env.INCLUDE_DRAFTS !== "true") return false;
  });
}
