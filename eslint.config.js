// ESLint flat config: TypeScript, React hooks and JSX accessibility for the
// islands, and the Astro plugin (with its accessibility rules) for .astro files.
import js from "@eslint/js";
import astro from "eslint-plugin-astro";
import jsxA11y from "eslint-plugin-jsx-a11y-x";
import reactHooks from "eslint-plugin-react-hooks";
import globals from "globals";
import tseslint from "typescript-eslint";

export default tseslint.config(
  {
    ignores: [
      "**/dist/**",
      "**/node_modules/**",
      "**/.astro/**",
      "**/playwright-report/**",
      "**/test-results/**",
      "artifacts/proof-atlas/public/**",
      "research_notes/**",
      "reports/**",
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    languageOptions: { globals: { ...globals.node } },
    rules: {
      "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_", varsIgnorePattern: "^_", caughtErrors: "none" }],
    },
  },
  {
    files: ["**/*.cjs"],
    languageOptions: { sourceType: "commonjs" },
    rules: { "@typescript-eslint/no-require-imports": "off" },
  },
  {
    // Browser code, plus build scripts whose callbacks run inside Playwright's page.
    files: ["artifacts/proof-atlas/src/**/*.{ts,tsx}", "artifacts/proof-atlas/scripts/**/*.mjs"],
    languageOptions: { globals: { ...globals.browser } },
  },
  {
    files: ["artifacts/proof-atlas/src/**/*.tsx"],
    ...jsxA11y.configs.recommended,
    plugins: { "react-hooks": reactHooks, "jsx-a11y-x": jsxA11y },
    rules: { ...jsxA11y.configs.recommended.rules, ...reactHooks.configs.recommended.rules },
  },
  ...astro.configs["flat/recommended"],
  ...astro.configs["flat/jsx-a11y-recommended"],
  {
    files: ["**/*.astro", "**/*.astro/*.ts"],
    languageOptions: { globals: { ...globals.browser } },
  },
);
