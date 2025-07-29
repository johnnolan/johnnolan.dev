import eslintPluginPrettier from "eslint-plugin-prettier";
import babelParser from "@babel/eslint-parser";

export default [
  {
    files: ["**/*.js", "**/*.jsx"],
    languageOptions: {
      parser: babelParser,
    },
    plugins: {
      prettier: eslintPluginPrettier,
    },
    rules: {
      "prettier/prettier": "error",
    },
  },
];
