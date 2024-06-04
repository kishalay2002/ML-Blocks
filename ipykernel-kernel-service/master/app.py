import multiprocessing
import os
from datetime import datetime

import docker
import requests
from dotenv import load_dotenv
from fastapi import FastAPI, status, HTTPException
from pydantic import BaseModel
from pymongo import MongoClient

from master import context
from master import docker_event_handler
from master.controller.kernel_container_controller import KernelContainerController
from master.controller.kernel_controller import KernelController
from master.logger import logger
from master.models.kernel import KernelStatus
from master.repository.kernel_repository import KernelRepository

load_dotenv()

docker_client: docker.DockerClient = docker.from_env()
docker_event_handler_proc: multiprocessing.Process | None = None

app = FastAPI(debug=True)
kernel_container_controller = KernelContainerController(
    "mlblock-kernel-slave:0.0.6", os.getenv("SLAVE_CALLBACK_URL"), docker_client
)
kernel_repository = KernelRepository()
kernel_controller = KernelController(kernel_repository, kernel_container_controller)


@app.on_event("startup")
def on_startup():
    context.client = MongoClient(os.getenv("MONGO_URI"))
    context.database = context.client[os.getenv("DB_NAME")]
    logger.info(f"Connected to {os.getenv('MONGO_URI')}")
    global docker_event_handler_proc
    docker_event_handler_proc = multiprocessing.Process(
        target=docker_event_handler.handle_docker_event
    )
    docker_event_handler_proc.start()


@app.on_event("shutdown")
def on_shutdown():
    context.client.close()
    logger.info("Database disconnected")
    docker_event_handler_proc.terminate()


@app.get("/")
async def index():
    return {"status": "OK", "docker": {"version": docker_client.version()}}


@app.get("/docker/info")
async def docker_info():
    return docker_client.info()


@app.get("/docker/ping")
async def docker_ping():
    return {"active": docker_client.ping()}


@app.get("/docker/df")
async def docker_df():
    return docker_client.df()


@app.get("/kernels")
def get_all_kernels():
    return kernel_repository.get_all()


@app.get("/kernels/{kernel_id}")
def get_kernel(kernel_id: str):
    kernel = kernel_repository.get(kernel_id)
    if kernel is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Kernel not found"
        )
    return kernel


@app.get("/kernels/{kernel_id}/stats")
def get_kernel_top(kernel_id: str):
    kernel = kernel_repository.get(kernel_id)
    if kernel is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Kernel not found"
        )
    if kernel.container_id is None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT, detail="container not allocated"
        )

    return docker_client.api.stats(kernel.container_id, stream=False)


@app.post("/kernels")
def create_kernel(callback: str, token: str):
    return kernel_controller.allocate_kernel(callback, token)


@app.delete("/kernels/{kernel_id}")
def delete_kernel(kernel_id: str, callback: str | None = None, token: str | None = None):
    kernel_controller.delete_kernel(kernel_id, callback, token)
    return {"message": "OK"}


class HeartBeat(BaseModel):
    callback: str
    token: str
    version: str


@app.post("/internal/register/{kernel_id}")
def internal_register_container(kernel_id: str, heartbeat: HeartBeat):
    kernel = kernel_repository.get(kernel_id)
    if kernel is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="kernel registration not found",
        )
    logger.info(f"Received heartbeat from {kernel_id}")

    container_url = f'http://{kernel_container_controller.get_address(kernel.container_id)}'
    kernel.status = KernelStatus.RUNNING
    kernel.url = container_url

    try:
        kernel_repository.save(kernel)
        response = requests.put(heartbeat.callback, headers={"Authorization": heartbeat.token}, json={
            "type": "started",
            "timestamp": datetime.utcnow().isoformat(),
            "kernel_id": kernel.id,
            "status": "started",
            "kernel_url": container_url
        })
        if response.status_code != 200:
            raise Exception(f"Callback returned with status code {response.status_code}")
    except Exception as e:
        logger.error(e)
        kernel_container_controller.delete_container(kernel.container_id)
        kernel_repository.delete(kernel.id)
        return HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Callback failed")

    return {"message": "OK"}
