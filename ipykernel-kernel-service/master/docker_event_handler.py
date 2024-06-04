import json
import logging
import os
import signal

import docker
from pymongo import MongoClient

from master import context
from master.repository.kernel_repository import KernelRepository
from master.models.kernel import KernelStatus

docker_client: docker.DockerClient | None = None
kernel_repository: KernelRepository

logger = logging.getLogger(__name__)
logger.setLevel(logging.DEBUG)
f_handler = logging.FileHandler('docker_events.log')
f_handler.setLevel(logging.DEBUG)
f_format = logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s')
f_handler.setFormatter(f_format)
logger.addHandler(f_handler)


def cleanup(signum, frame):
    logger.debug("received signal %d", signum)
    if docker_client:
        docker_client.close()
    logger.info("cleaned up docker event handler")
    if context.client:
        context.client.close()
    logger.info("closed database connection")
    exit(signum)


def handle_container_death(event_json: dict):
    container_id = event_json['id']
    kernel = kernel_repository.find_kernel_by_container_id(container_id)
    if kernel is None:
        return
    if 'Actor' not in event_json or 'Attributes' not in event_json['Actor']:
        return
    try:
        exit_code = int(event_json['Actor']['Attributes']['exitCode'] or "0")
        status = KernelStatus.STOPPED
        if exit_code in (1,):
            status = KernelStatus.ERROR
        kernel.status = status
        kernel_repository.save(kernel)
    except Exception as e:
        logger.error(e)


def handle_event(event: str):
    logger.debug("[docker event] %s", event)
    event_json = json.loads(event)
    if 'Type' not in event_json or 'Action' not in event_json or 'id' not in event_json:
        return

    if event_json['Type'] == 'container' and event_json['Action'] == 'die':
        handle_container_death(event_json)


def connect_to_db():
    context.client = MongoClient(os.getenv("MONGO_URI"))
    context.database = context.client[os.getenv("DB_NAME")]
    logger.info("connected to database")


def handle_docker_event():
    # connect to docker server
    global docker_client
    docker_client = docker.from_env()
    logger.info("connected to docker")

    # initialize database and repository
    global kernel_repository
    connect_to_db()
    kernel_repository = KernelRepository()

    # cleanup resources on exit
    signal.signal(signal.SIGTERM, cleanup)

    # listen for events
    for event in docker_client.api.events():
        handle_event(event)
