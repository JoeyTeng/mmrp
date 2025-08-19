module.exports = {
  "*.py": [
    "uv --project server run pyright -p server",
    "uv --project server run ruff check --fix --show-fixes",
    "uv --project server run ruff format",
    () => "uv --project server run pytest -c server/pyproject.toml" // to prevent lint-staged to pass in any positional argument to interfere with pytest.
  ],
};
