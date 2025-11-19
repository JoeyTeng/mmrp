# MMRP: Multimedia Research Pipeline

[![Contributor-Covenant](https://img.shields.io/badge/Contributor%20Covenant-2.1-fbab2c.svg)](CODE_OF_CONDUCT.md)
[![License](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](LICENSE.md)
[![Maintainer](https://img.shields.io/badge/Maintainer-Cisco-00bceb.svg)](https://opensource.cisco.com)

MMRP (Multimedia Research Pipeline) is a visual pipeline editor designed for building and experimenting with multimedia processing workflows. It provides an intuitive drag-and-drop interface for creating complex video processing pipelines with real-time preview and comparison capabilities.

## About The Project

MMRP enables researchers and developers to:

- **Visually design** multimedia processing pipelines using a node-based editor
- **Compare video outputs** side-by-side with multiple viewing modes (split-screen, interleaving, unified player)
- **Analyze quality metrics** including PSNR, SSIM, MSE, and VMAF
- **Export and share** pipeline configurations for reproducibility
- **Process frames** through customizable transformation modules

The project consists of a React/Next.js frontend providing the visual editor interface and a FastAPI backend handling video processing, pipeline execution, and quality metric calculations.

## Getting Started

To get a local copy up and running, follow these steps.

### Prerequisites

- **Node.js** (v20 or higher) and npm
- **Python** (v3.13 or higher)
- **uv** (Python package manager) - Install via:
  ```sh
  curl -LsSf https://astral.sh/uv/install.sh | sh
  ```

### Installation

1. Clone the repository
   ```sh
   git clone https://github.com/JoeyTeng/mmrp.git
   cd mmrp
   ```

2. Set up the frontend
   ```sh
   cd client
   npm install
   npm run build
   ```

3. Set up the backend
   ```sh
   cd ../server
   uv sync
   ```

### Quick Start with Scripts

For streamlined deployment, use the provided scripts:

#### Preparing the Environment
Install all dependencies and build the client:
```sh
./scripts/setup.sh
```

#### Starting the Server
Run the server (supports command-line arguments like `--workers 2`):
```sh
./scripts/run.sh
```

The application will be available at `http://localhost:8000/`

## Usage

### Running the Application

#### Frontend Development Mode
```sh
cd client
npm run dev
```
Access the development server at `http://localhost:3000/`

#### Backend Development Mode
```sh
cd server
uv run uvicorn main:app --reload
```
The API will be available at `http://localhost:8000/`

#### Production Deployment
```sh
cd client
npm run build
npm run start
```

### Creating Pipeline Configurations

#### Exporting Pipelines

Draw your pipeline configuration on the canvas and export it. The exported JSON needs conversion to the backend format:

**Exported JSON format:**
```json
{
  "metadata": { "version": "1.0", "timestamp": "" },
  "data": { "nodes": [], "edges": [] }
}
```

**Target backend format:**
```json
{
  "name": "My Pipeline",
  "nodes": [],
  "edges": []
}
```

#### Conversion Steps

1. **Remove wrapper metadata** - Extract the `nodes` and `edges` from the `data` field
2. **Rename keys** (camelCase → snake_case):
   - `moduleClass` → `module_class`
   - `inputFormats` → `input_formats`
   - `outputFormats` → `output_formats`
   - `pixelFormat` → `pixel_format`
   - `colorSpace` → `color_space`
3. **Drop UI-only fields** - Remove frontend-specific properties like `measured`, `flag`, `options` (outside `constraints`)
4. **Clean up edges** - Ensure edges only contain:
   ```json
   {
     "id": "e1-e2",
     "source": "n1",
     "target": "n2",
     "sourceHandle": "output-0-handle",
     "targetHandle": "input-0-handle"
   }
   ```

### Video Comparison Features

- **Side-by-Side View**: Compare two video streams simultaneously
- **Interleaving Frames**: Alternate between frames from different sources
- **Unified Player**: View multiple outputs in a single player
- **Quality Metrics**: Real-time PSNR, SSIM, MSE, and VMAF calculations

## Development

### Frontend

The frontend uses:
- **Next.js 15** with React 19
- **TypeScript** for type safety
- **Material-UI** and **Tailwind CSS** for styling
- **React Flow** for the node-based editor
- **Jest** for unit testing

Install pre-commit hooks for automatic linting and formatting:
```sh
cd client
npm install
```

Run tests:
```sh
npm run test:unit
npm run coverage:unit
```

### Backend

The backend uses:
- **FastAPI** for the REST API
- **OpenCV** for video processing
- **NumPy** and **scikit-image** for image operations
- **Pydantic** for data validation
- **pytest** for testing

Run tests:
```sh
cd server
uv run pytest
uv run pytest --cov
```

## Roadmap

See the [open issues](https://github.com/JoeyTeng/mmrp/issues) for a list of proposed features and known issues.

## Contributing

Contributions are what make the open source community such an amazing place to learn, inspire, and create. Any contributions you make are **greatly appreciated**. 

For detailed contributing guidelines, please see [CONTRIBUTING.md](CONTRIBUTING.md)

## License

Distributed under the Apache License 2.0. See [LICENSE.md](LICENSE.md) for more information.

## Acknowledgements

**Contributors:** Fredrik Pihl, Hongyu Teng, Everly Precia Suresh Kumar, Romy Sophia Richter, Ana Georgieska, Brandon Alexander, and Frank Cruz.

## Contact

Project Link: [https://github.com/JoeyTeng/mmrp](https://github.com/JoeyTeng/mmrp)
