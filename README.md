# Cisco VIPER: VIsual Pipeline EditoR

A Multimedia Research Pipeline Visual Editor and Executor.

## Overview

Cisco VIPER is a web-based visual pipeline editor and executor for multimedia processing tasks. It allows users to create, edit, and execute complex multimedia processing pipelines using a Web-based graphical interface.

### Client (Frontend)

The client is a React-based web single-page application (SPA) using [React Flow](https://reactflow.dev/) for the visual editor. The basic framework is based on [Next.js](https://nextjs.org/) and [Material UI (MUI)](https://mui.com/). To ensure minimal effort for deployment, the client is built and served as static files using [Static Site Generation (SSG)](https://nextjs.org/docs/app/guides/static-exports).

Pipeline is represented as a directed graph, where nodes represent processing modules and edges represent data flow between modules. Users can drag and drop nodes onto the canvas, connect them with edges, and configure their properties through a user-friendly interface.

Pipeline is serialised to JSON format for submitting to the backend for execution, or for exporting and sharing. Basic verification is performed on the client side.

### Server (Backend)

The server is a Python-based backend using [FastAPI](https://fastapi.tiangolo.com/) to provide RESTful APIs for the client. It manages pipeline execution, worker processes, and communication with the client. The server uses [uvicorn](https://www.uvicorn.org/) as the ASGI server for handling requests. In addition, WebSocket is used for real-time communication between the client and server in per-frame pipeline execution mode.

For now we use OpenCV to read and write video files, and to perform basic image processing tasks. Binary executables to process with binary-files are also supported (but not **streaming mode**). In the future the plan is to change to PyAV/FFmpeg for more comprehensive format support.

### Execution Mode

Two execution modes are supported:

1. **Normal Mode**: The entire pipeline is executed on a the input files. After the execution is complete, the output files are made available for review and download. This mode is more efficient since it does not need to encode and transmit intermediate results frame by frame.
2. **Streaming Mode**: The pipeline is executed on a per-frame basis, with intermediate results transmitted back to the client in real-time. This mode is useful for debugging and visualising the processing steps, but it is less efficient. Please take note that this mode is currently experimental and may not work with all modules and/or all parameter sets. In this mode, WebSocket is used for data transmission instead of normal HTTP.

## Build Instructions

### Prerequisites

* Node.js (v22 or later)
* NPM (v10 or later); you may also use yarn or pnpm if preferred. Note that by default the scripts use npm commands.
* uv (v0.7 or later)

---

For convenience, a shell script is included; you can use it to set up the environment and build the client.

```bash
bash scripts/setup.sh
```

## Execution Instructions

For convenience, a shell script is included; you can use it to start the server.

```bash
bash scripts/run.sh
```

This command accepts multiple arguments that are passed to the Python script. You can run `bash scripts/run.sh --help` to see the options.

A example command to run the server with 4 workers, on port 8002, with a specified YUV directory and binaries directory:

```bash
scripts/run.sh --worker 4 --port 8002
```

If you see any failures, please ensure that you have the prerequisites installed, that the project is built as shown in the previous section, and that you are using the correct versions.

## Development setup

Please install the precommit hooks for automatic linting and formatting:

```bash
cd client
npm install  # or use yarn/pnpm depends on your personal preference
```

## Documentation

Please refer to the [documentation](docs/) for more details on how to use and extend VIPER.
