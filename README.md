# Cisco VIPER: VIsual Pipeline EditoR

## Contributors

Fredrik Pihl, Hongyu Teng, Everly Precia Suresh Kumar, Romy Sophia Richter, Ana Georgieska, Brandon Alexander and Frank Cruz.

## Contribution

### Client

Please install the precommit hooks for automatic linting and formatting:

```bash
cd client
npm install
```

## How to Run

### Frontend

```sh
cd client
npm install
npm run build
npm run start
```

### Backend

```sh
cd server

uv run uvicorn main:app --reload
```

### Scripts

There are also two scripts that can be used for deployment. You can deploy the server in the VM, the project is already installed there (inside test/mmrp).

#### Preparing the environment
This will install all dependencies and build the client.

```sh
./scripts/setup.sh
```

#### Starting the server
This will run the server. You can run the application on `http://<VM_IP>:8000/`.

```sh
./scripts/run.sh
```
