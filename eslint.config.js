import js from "@eslint/js";
import globals from "globals";

export default [
  {
    ignores: [
      "_site/**",
      "node_modules/**",
      "src/_includes/css/**",
      "*_report.json",
      "pa11y-output.json",
    ],
  },
  {
    ...js.configs.recommended,
    files: ["**/*.{js,mjs,cjs}"],
  },
  {
    files: ["**/*.{js,mjs,cjs}"],
    ignores: ["src/_includes/scripts/**"],
    languageOptions: { globals: globals.node },
  },
  {
    files: ["src/_includes/scripts/**/*.js"],
    languageOptions: { sourceType: "script", globals: globals.browser },
  },
];
