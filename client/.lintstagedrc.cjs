module.exports = {
  "*.{cjs,js,jsx,mjs,ts,tsx}": [
    "eslint --cache --fix",
    () => "tsc --noEmit",
    "prettier --write",
  ],
  "*.{css,json,md}": "prettier --write",
};
