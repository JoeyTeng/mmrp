#!/bin/bash
set -e  # exit if any command fails

# Find project root (one level above scripts/)
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

# Install frontend dependencies and build once
echo "Intstalling frontend dependencies..."
cd "$ROOT_DIR/client"
npm install
npm run build

# Install backend dependencies
echo "Installing backend dependencies..."
cd "$ROOT_DIR/server"
uv sync

echo "Setup complete"