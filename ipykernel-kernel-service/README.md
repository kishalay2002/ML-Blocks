# Kernel Service

Manages spawning and the lifecycle of ipykernel containers

## Instructions

```sh
# install dependencies
poetry install --no-root

# active the virtual env
poetry shell

# start mongodb
docker compose up

# run the service
uvicorn master.app:app --reload --host 0.0.0.0 --port 8080
```
