# Contributing to Cisco VIPER

Thanks for your interest in contributing! This guide helps you get productive quickly and ensure changes are consistent and high‑quality.

## Ways to Contribute

- Bug reports / issue triage
- Feature requests & design discussion
- Documentation & examples
- Adding or improving modules / transforms
- Benchmarking & performance improvements

## Ground Rules

- Be respectful and inclusive (see Code of Conduct).
- Keep PRs focused and reasonably small; large changes should be discussed in an issue first.
- Add/update tests for behavior changes.
- Ensure lint, type check, and tests pass (see below) before requesting review.

## Development Environment

### Prerequisites

- Node.js >= 22
- npm >= 10 (or pnpm/yarn if you adapt commands yourself)
- Python >= 3.13
- [uv](https://github.com/astral-sh/uv) >= 0.7 (dependency & venv manager)

### One‑Shot Setup

```bash
bash scripts/setup.sh
```

This will:

1. Install and build the client (static export written to `client/out`)
2. Install server dependencies with `uv sync`

### Running in Development

Separate terminals (recommended):

```bash
# Terminal 1: backend (auto-reload single process)
cd server
uv run main.py --reload --log-level debug

# Terminal 2: frontend dev server (port 3000)
cd client
# rm -r out # use this command to ensure `client/out` is not there so the server will serve the dev files.
npm run dev
```

`main.py` will NOT mount built static assets in dev unless `client/out` exists (it provides a JSON message at `/`).

### Production‑Like Run

```bash
# Build the client first
# bash scripts/setup.sh
bash scripts/run.sh --workers 4 --port 8002
```

## Project Structure (High Level)

```
client/  # Next.js + React Flow UI
  src/
    app/            # Basic app setup (app layout, themes, global CSS, etc.)
    components/     # React components (graph, module forms, etc.)
    contexts/       # React context providers for cross-component states (modules list, metrics, etc.)
    hooks/          # Custom React hooks (retrieving data from backend, persistent storage, etc.)
    services/       # API interaction logic
    types/          # TypeScript types & interfaces (incl. some data models)
    utils/          # Shared utility codes
server/  # FastAPI application
  app/routers/      # REST + WebSocket endpoints
  app/modules/      # Module definitions (generic, transforms, etc.)
  app/services/     # Execution & registry logic
  app/schemas/      # Pydantic models
  app/utils/        # Shared helpers & metrics
  videos/           # Example video assets
scripts/            # setup & run helpers
docs/               # How-to and conceptual docs
```

## Testing

### Frontend Unit Tests

```bash
cd client
npm run test:unit
```

Add tests under `client/src/tests/unit` (mirroring folder structure).

### Backend Tests

```bash
cd server
uv run pytest
```

Place tests in `server/tests/`.

### Coverage

```bash
cd client
npm run coverage:unit

cd ../server
uv run pytest --cov=app --cov-report=term-missing
```

## Linting & Type Checking

```bash
# Frontend
cd client
npm run lint  # ESLint + TypeScript noEmit
npm run build # during Next.js build, it will do more extensive checks

# Backend
cd ../server
uv run ruff check .
uv run pyright .
```

Optionally add `--fix` to Ruff for autofixes.

## Formatting

```bash
cd client
npm run format

cd ../server
uv run ruff format
```

## Git Hooks

Husky is configured for the whole repo (client and server). After installing dependencies the `prepare` script sets up hooks:

```bash
cd client
npm install  # triggers husky setup
```

## Submitting a Pull Request

1. Fork & branch.
2. Keep commits logical; squash locally if noisy. PRs will be always squashed when merged.
   1. Please try not to force-push after review comments are given, so the reviewers can easily see what changed in further reviews.
3. Update README / docs / schemas if behavior or API changes.
4. Ensure CI (will be added) is green.
5. Reference the issue: `Fixes #123`.

## Design Guidelines

- Prefer explicit, typed Pydantic models for request/response.
- Keep module execution pure where practical; isolate side effects (I/O) in services.
- Frontend state: colocate minimal local state, use context only for cross-cutting data (modules list, metrics, pipeline persistence).
- Avoid premature optimization.

## Security & Disclosure

See `SECURITY.md` for reporting instructions. Do not open public issues for sensitive vulnerabilities.

## License

Apache-2.0 – contributions are accepted under the same license. By submitting a PR you certify you have the right to license your contribution under Apache-2.0.

## Questions / Discussion

(If Discussions are enabled) Use GitHub Discussions; otherwise open an issue tagged `question`.

Thanks for contributing! 🙌
