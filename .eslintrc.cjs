// eslint-disable-next-line @typescript-eslint/no-var-requires
const path = require("node:path");

module.exports = {
  plugins: ["kuzzle", "jest"],
  extends: [
    "plugin:kuzzle/default",
    "plugin:kuzzle/node",
    "plugin:kuzzle/typescript",
    "plugin:jest/recommended",
    "plugin:jest/style",
  ],
  parserOptions: {
    project: path.join(__dirname, "tsconfig.test.json"),
  },
  overrides: [
    {
      files: [
        ".eslintrc.cjs",
        "**/roles/*.ts",
        "**/collections/*.ts",
        "**tests/**/*.ts",
      ],
      rules: {
        "sort-keys": ["off"],
      },
    },
  ],
};
