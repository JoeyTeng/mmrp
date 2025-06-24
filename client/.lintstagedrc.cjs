const format =
  "prettier --config client/.prettierrc --ignore-path client/.prettierignore --ignore-path client/.gitignore --write";

module.exports = {
  "*.{cjs,js,jsx,mjs,ts,tsx}": [
    "eslint --config client/eslint.config.mjs --cache --fix",
    () => "tsc --project client --noEmit",
    format,
  ],
  "*.{css,json,md}": format,
};
