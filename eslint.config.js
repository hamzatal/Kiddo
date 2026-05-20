// ESLint flat config (ESLint 9+).
//
// We target the React/Inertia frontend only. Backend PHP files are
// linted by Laravel Pint via `composer pint` — keeping the two
// toolchains separate avoids cross-language false positives.
//
// Rules philosophy:
//   - "error" for things that crash at runtime or break a11y.
//   - "warn"  for stylistic preferences we want to nudge toward.
//   - prettier handles all formatting; ESLint never argues with it.

import js from "@eslint/js";
import reactPlugin from "eslint-plugin-react";
import reactHooks from "eslint-plugin-react-hooks";
import jsxA11y from "eslint-plugin-jsx-a11y";
import prettier from "eslint-config-prettier";
import globals from "globals";

export default [
    {
        ignores: [
            "node_modules/**",
            "public/build/**",
            "vendor/**",
            "storage/**",
            "bootstrap/cache/**",
            "scripts/**",
        ],
    },
    js.configs.recommended,
    {
        files: ["resources/js/**/*.{js,jsx,ts,tsx}"],
        languageOptions: {
            ecmaVersion: 2024,
            sourceType: "module",
            parserOptions: {
                ecmaFeatures: { jsx: true },
            },
            globals: {
                ...globals.browser,
                ...globals.es2024,
                route: "readonly", // Ziggy-style helper if added later
            },
        },
        plugins: {
            react: reactPlugin,
            "react-hooks": reactHooks,
            "jsx-a11y": jsxA11y,
        },
        settings: {
            react: { version: "detect" },
        },
        rules: {
            // React 19 doesn't need React in scope for JSX.
            "react/react-in-jsx-scope": "off",
            "react/prop-types": "off",

            "react-hooks/rules-of-hooks": "error",
            "react-hooks/exhaustive-deps": "warn",

            // Catch a11y regressions automatically.
            "jsx-a11y/alt-text": "error",
            "jsx-a11y/anchor-is-valid": "warn",
            "jsx-a11y/click-events-have-key-events": "warn",
            "jsx-a11y/no-noninteractive-element-interactions": "warn",
            "jsx-a11y/no-static-element-interactions": "warn",

            // General hygiene.
            "no-unused-vars": [
                "warn",
                { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
            ],
            "no-console": ["warn", { allow: ["warn", "error", "info"] }],
            "no-debugger": "error",
            "prefer-const": "error",
            eqeqeq: ["error", "smart"],
        },
    },
    {
        // Test files get jest-style globals.
        files: ["tests/js/**/*.{js,jsx,ts,tsx}"],
        languageOptions: {
            globals: {
                ...globals.browser,
                ...globals.node,
                vi: "readonly",
                describe: "readonly",
                it: "readonly",
                test: "readonly",
                expect: "readonly",
                beforeAll: "readonly",
                beforeEach: "readonly",
                afterAll: "readonly",
                afterEach: "readonly",
            },
        },
    },
    // Prettier comes LAST so it can override conflicting style rules.
    prettier,
];
