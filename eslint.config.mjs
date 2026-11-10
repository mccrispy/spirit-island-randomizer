import eslint from "@eslint/js";

export default [
  {
    ignores: ["**/*.ts", "**/*.tsx"],
  },
  eslint.configs.recommended,
];
