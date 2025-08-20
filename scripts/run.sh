#!/bin/bash
set -e  # exit if any command fails

# Find project root (one level above scripts/)
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

# Start backend (a couple of workers for concurrency)
echo "Starting server…"
cd "$ROOT_DIR/server"
uv run uvicorn main:app --host 0.0.0.0 --port 8000 --workers 2 &

# Start frontend (serve prebuilt app)
echo "Starting client…"
cd "$ROOT_DIR/client"
npm run start -- -p 3000 -H 0.0.0.0