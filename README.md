# mmrp

Cisco VIPER: VIsual Pipeline EditoR

## Contributors

Fredrik Pihl, Hongyu Teng, Everly Precia Suresh Kumar, Romy Sophia Richter, Ana Georgieska, Brandon Alexander and Frank Cruz.

## Contribution

### Client

Please install the precommit hooks for automatic linting and formatting:

```bash
cd client
npm install
```


## Frontend

### How to Run

```sh
cd client
npm install
npm run build
npm run start
```

## Backend

### How to Run

```sh
cd server

uv run uvicorn main:app --reload
```
## Creating your own example pipeline configurations

### Convert from Exported JSON
Draw the needed example configuration on the canvas and export it. When you export, the JSON contains extra frontend data that needs to be removed. To convert to Target JSON for storing in the backend follow below steps:

## 1. Remove wrapper metadata

```json
  {
    "metadata": { "version": "1.0", "timestamp": "..." },
    "data": { "nodes": [], "edges": [] }
  }
````

**Target JSON**:

  ```json
  {
    "name": "My Pipeline",
    "nodes": [],
    "edges": []
  }
  ```

## 2. Rename keys (camelCase → snake\_case)

Convert field names:

* `moduleClass` → `module_class`
* `inputFormats` → `input_formats`
* `outputFormats` → `output_formats`
* `pixelFormat` → `pixel_format`
* `colorSpace` → `color_space`

## 3. Drop UI-only fields

Remove properties that are frontend-only:

* `measured` (canvas node size)
* `flag`, `options` (outside constraints)

## 4. Edges

### Ensure edges expose the following keys and remove other excesss keys :

```json
{
  "id" : "e1-e2",
  "source": "n1",
  "target": "n2",
  "sourceHandle": "output-0-handle",
  "targetHandle": "input-0-handle"
}
```
