import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
  {
    // React 19 react-hooks 신규 규칙은 실험적이며 본 MVP에서는 워닝으로만 처리.
    // (set-state-in-effect: 외부 API 호출 후 setState하는 일반 패턴까지 차단되어 과민 반응)
    // (immutability: 함수 선언 순서를 너무 엄격하게 검사)
    rules: {
      "react-hooks/set-state-in-effect": "warn",
      "react-hooks/immutability": "warn",
    },
  },
]);

export default eslintConfig;
