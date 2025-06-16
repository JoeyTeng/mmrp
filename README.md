# mmrp
Multimedia Research Pipeline 

## Contributors

Fredrik Pihl, Hongyu Teng, Everly Precia Suresh Kumar, Romy Sophia Richter, Ana Georgieska, Brandon Alexander and Frank Cruz.

## Frontend

### How to Run

```sh
cd client
npm install
npm run build
npm run start
```

## Backend

### 1. Create and Activate Virtual Environment `mmrp_env` using uv

- **Python 3.13.x** should be installed (check python --version)
- **uv** should be installed (https://docs.astral.sh/uv/getting-started/installation/)

#### Windows
```sh
cd server

# create virtual environment
uv venv .venv

# activate environment
.venv\Scripts\activate

# deactivate once you are done
deactivate
```

#### Linux, Mac
```sh
cd server

# create virtual environment
uv venv .venv

# activate environment
source .venv/bin/activate

# deactivate once you are done
deactivate
```

### 2. Run Server 

```sh
cd server

# activate environment

# install dependencies
uv pip install -r requirements.txt

# run server
uvicorn app.main:app --reload
```


