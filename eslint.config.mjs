import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import reactPlugin from "eslint-plugin-react";

export default defineConfig([
  ...nextVitals,
  ...nextTs,

  {
    // O registo do plugin "react" feito por eslint-config-next/core-web-vitals
    // nao chega a este bloco em flat config (ESLint 9 + Next 16) -- sem isto,
    // "react/no-unescaped-entities" falha com "could not find plugin react".
    plugins: {
      react: reactPlugin,
    },
    rules: {
      "@typescript-eslint/no-explicit-any": "warn",
      "react/no-unescaped-entities": "warn",
      "react-hooks/set-state-in-effect": "warn",
      "react-hooks/error-boundaries": "warn",
      "react-hooks/static-components": "warn",
    },
  },

  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);
