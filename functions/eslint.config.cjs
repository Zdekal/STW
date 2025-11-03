module.exports = [
  {
    languageOptions: {
      ecmaVersion: 12,
      sourceType: "module",
      globals: {
        node: true,
        es2021: true,
      },
    },
    rules: {
      indent: ["error", 2],
      semi: ["error", "always"],
      "max-len": ["error", 80],
      quotes: ["error", "double"],
      "object-curly-spacing": ["error", "never"],
    },
  },
];