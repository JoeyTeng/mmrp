module.exports = {
  "*.py": [
    "uv --project server run ruff check --fix --show-fixes",
    "uv --project server run ruff format",
  ],
};