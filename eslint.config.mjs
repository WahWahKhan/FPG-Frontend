import nextCoreWebVitals from "eslint-config-next/core-web-vitals";

const eslintConfig = [
  { ignores: ["public/**", ".next/**", "node_modules/**"] },
  ...nextCoreWebVitals,
  {
    // New React Compiler rules shipped with eslint-config-next 16. They flag
    // long-standing patterns; kept as warnings so they don't block lint.
    rules: {
      "react-hooks/set-state-in-effect": "warn",
      "react-hooks/purity": "warn",
      "react-hooks/refs": "warn",
      "react-hooks/static-components": "warn",
      "react-hooks/immutability": "warn",
    },
  },
];

export default eslintConfig;
