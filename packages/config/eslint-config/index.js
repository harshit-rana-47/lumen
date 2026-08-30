module.exports = {
  root: true,
  parserOptions: {
    ecmaVersion: "latest",
    sourceType: "module"
  },
  env: {
    es2022: true
  },
  rules: {
    "no-console": ["warn", { allow: ["warn", "error"] }]
  }
};
