import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import reactPlugin from "eslint-plugin-react";
import reactHooksPlugin from "eslint-plugin-react-hooks";

export default defineConfig([
  ...nextVitals,
  ...nextTs,

  {
    // O registo dos plugins "react" e "react-hooks" feito por
    // eslint-config-next/core-web-vitals nao chega a este bloco em flat
    // config (ESLint 9 + Next 16) -- sem isto, as regras destes plugins
    // falham com "could not find plugin ...".
    plugins: {
      react: reactPlugin,
      "react-hooks": reactHooksPlugin,
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
    ".next-e2e/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Gerado localmente pelo `supabase start` (bundle do Edge Runtime) --
    // nao e codigo do projeto, so aparece na maquina de quem corre o
    // Supabase local, e minificado (uma linha gigante) faz disparar
    // centenas de falsos positivos (prefer-const, no-unused-vars, etc.).
    "supabase/.temp/**",
  ]),
]);
