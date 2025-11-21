# Cisco VIPER: VIsual Pipeline EditoR

[![Contributor-Covenant](https://img.shields.io/badge/Contributor%20Covenant-2.1-fbab2c.svg)](CODE_OF_CONDUCT.md)
[![License](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](LICENSE)
[![Maintainer](https://img.shields.io/badge/Maintainer-Cisco-00bceb.svg)](https://opensource.cisco.com)

A visual, approachable multimedia research pipeline editor & executor. VIPER lets you design processing pipelines graphically, run them locally or remotely, evaluating the results in browser or download for professional investigation, and optionally stream intermediate frames for insight without gluing ad‑hoc scripts together.

## Overview

VIPER offers a browser-based environment to compose directed graphs of video / image processing modules, persist them as JSON, and execute them via a FastAPI backend. Two execution styles are available: efficient batch mode and experimental per‑frame streaming.

### Client (Frontend)

React + Next.js (static-site generation (SSG) exported) + React Flow + MUI. Users drag modules (nodes), connect edges, configure parameters, and export/share JSON pipeline definitions. Light client-side validation precedes submission.

### Server (Backend)

FastAPI + uvicorn orchestrate execution. WebSocket channels deliver frame-level updates in streaming mode. OpenCV currently powers media I/O; planned migration to PyAV/FFmpeg will broaden codec and performance capabilities. Certain external binary executables as processing modules are supported (non‑streaming).

### Execution Modes

1. **Normal (Batch) Mode** – Runs the full pipeline; artifacts become available upon completion (most efficient).
2. **Streaming Mode (Experimental)** – Executes frame by frame, sending intermediate visuals/metrics over WebSocket for debugging and exploration; slower and not guaranteed to support every module combination.

### High-Level Architecture

```text
┌───────────┐ JSON (REST) / WebSocket (WS) ┌─────────────┐
│  Browser  │ ───────────────────────────▶ │ FastAPI API │
│ (Next.js) │ ◀── whole video + metrics ── │  + Workers  │
└───────────┘     (HTTP) / frames (WS)     └─────┬───────┘
     ▲                                           │ executes
     │ (Static export)                           ▼
  Built assets                             Module chain
                            │
                Video I/O (OpenCV; future PyAV/FFmpeg)
                            │
                    Output artifacts / videos
```

### Technology Stack (Concise)

| Layer | Tech | Notes |
|-------|------|-------|
| UI | Next.js (SSG), React, React Flow, MUI | Visual graph editing |
| State | React State, Context, React Flow | Pipelines, modules, metrics |
| Backend | FastAPI + uvicorn | REST + WebSocket |
| Media | OpenCV (current) | Processing + I/O (planned PyAV/FFmpeg) |
| Packaging | uv, npm | Python dependency management |
| Scripts | Bash (`setup.sh`, `run.sh`) | Convenience automation |

## Build Instructions

### Prerequisites

* Node.js (v22 or later)
* NPM (v10 or later). `yarn` / `pnpm` also fine (scripts assume npm)
* uv (v0.7 or later)

---

Quick setup script (installs dependencies and builds static client):

```bash
bash scripts/setup.sh
```

## Execution Instructions

Convenience script:

```bash
bash scripts/run.sh
```

View available options:

```bash
bash scripts/run.sh --help
```

Example (4 workers, custom port):

```bash
scripts/run.sh --worker 4 --port 8002
```

Output videos and intermediate artifacts are written under `server/output/` (adjustable in future configuration). FastAPI interactive docs: `http://localhost:<port>/docs`.

### Using Streaming Mode

Enabling streaming in the UI triggers a WebSocket session for frame-wise updates. If frames appear missing, verify each module's streaming support.

## Development Setup

Install dependencies (client + server):

```bash
cd client
npm install  # or yarn / pnpm
cd ../server
uv sync
```

Suggested:

```bash
# Client
cd client && npm run lint && npm run format && npm run test:unit && npm run build

# Server
cd ../server/ && uv run ruff check && uv run ruff format && uv run pyright -p .
```

Pre-commit hooks for both client and server with `husky` should be done when you do `npm install` in `/client`.

## Documentation

See the [docs/](docs/) directory for deeper usage and extension notes. Selected entry points:

* How to create an example pipeline: `docs/how-to-create-an-example-pipeline.md`
* Runtime API reference: FastAPI auto docs at `/docs`

## Community & Governance

* License: Apache 2.0 (see [`LICENSE`](LICENSE))
* We use GitHub Issues for all proposals, feature requests, discussions, and bug reports.
* [`DEVELOPMENT.md`](DEVELOPMENT.md) & [`CONTRIBUTING.md`](CONTRIBUTING.md) & [`CODE_OF_CONDUCT.md`](CODE_OF_CONDUCT.md) to formalize workflows & expectations
* Security: Please report sensitive vulnerabilities privately by emailing `oss-security@cisco.com`. For more details, see [`SECURITY.md`](SECURITY.md).

We value respectful, constructive collaboration.
