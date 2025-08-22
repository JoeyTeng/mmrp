#!/bin/bash
set -e  # exit if any command fails

# Find project root (one level above scripts/)
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

# Start backend (forward arguments)
echo "Starting server…"
cd "$ROOT_DIR/server"
uv run main.py "$@"
