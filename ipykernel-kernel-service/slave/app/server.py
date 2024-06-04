import logging
import os
import stat
import typing
from contextlib import asynccontextmanager
from datetime import datetime
from multiprocessing import Process
from multiprocessing.connection import Listener
from typing import Optional, List
from urllib.request import urlretrieve
import pandas as pd
import base64
import io
import matplotlib.pyplot as plt

import aiofiles
import uvicorn
import zmq
from fastapi import FastAPI, UploadFile, HTTPException
from jupyter_client import BlockingKernelClient
from pydantic import BaseModel
from starlette import status
from starlette.responses import RedirectResponse
from zmq import Context

import kernel
from code_generator import CodeGenerator
from graph_processor import NodeScheduler

kernel_process: Optional[Process] = None
context = Context()
heartbeat_sock = context.socket(zmq.XREQ)  # REQ: Send, Receive pattern
client = BlockingKernelClient()


@asynccontextmanager
async def lifespan(_: FastAPI) -> None:
    global kernel_process
    ipc_address = ('localhost', 7000)
    ipc_listener = Listener(ipc_address, authkey=b'password')
    kernel_process = Process(target=kernel.main, daemon=True, name="mlblock-kernel")
    kernel_process.start()
    kernel_conn = ipc_listener.accept()
    kernel_conn.recv()
    # TODO: do some conditional stuff based on the message from the kernel subprocess
    client.load_connection_file(os.getenv("KERNEL_CONFIG_FILE"))
    client.start_channels()
    heartbeat_sock.connect("tcp://127.0.0.1:6004")
    yield
    heartbeat_sock.close()
    kernel_process.kill()


# noinspection PyTypeChecker
app = FastAPI(lifespan=lifespan)
started_on = datetime.utcnow()
dataset_schema_database = {}
dataset_viz_database = {}


@app.get("/health")
def health():
    message = b"ping"
    heartbeat_sock.send(message)
    reply = heartbeat_sock.recv()
    return {
        "server": "ok",
        "kernel_id": os.getenv("KERNEL_ID"),
        "ipykernel": {
            "process_alive": kernel_process.is_alive() if kernel_process is not None else False,
            "heartbeat": reply == message,
            "exitcode": kernel_process.exitcode if kernel_process is not None else None,
        },
        "started_on": started_on.isoformat(),
    }


def get_visualizations(df: pd.DataFrame):
    df = df.select_dtypes(include='number')

    plt.rcParams.update({'font.size': 22})
    pd.plotting.scatter_matrix(df, figsize=(12, 8))
    pic = io.BytesIO()
    plt.savefig(pic, format='png')
    pic.seek(0)
    pic1_base64 = base64.b64encode(pic.read()).decode()
    pic.close()

    df.hist(bins=50, figsize=(20, 15))
    pic = io.BytesIO()
    plt.savefig(pic, format='png')
    pic.seek(0)
    pic2_base64 = base64.b64encode(pic.read()).decode()
    pic.close()
    return [pic1_base64, pic2_base64]


def extract_schema(file: typing.IO, filename: str):
    _, ext = os.path.splitext(filename)

    if ext not in ('.csv', '.json'):
        raise Exception(f"invalid file extension {ext}")

    df: pd.DataFrame | None = None

    if ext == '.csv':
        df = pd.read_csv(file)
    elif ext == '.json':
        try:
            df = pd.read_json(file)
        except ValueError:
            df = pd.read_json(file, lines=True)

    if df is None:
        raise Exception("reached an invalid state, dataframe is None")

    schema = []
    for col in df.columns:
        schema.append({
            'name': col,
            'type': str(df[col].dtype)
        })

    try:
        dataset_viz_database[filename] = get_visualizations(df)
    except Exception as e:
        logging.error(e)

    return schema


def get_file_details(file_name: str, cwd: str) -> dict:
    st = os.stat(os.path.join(cwd, file_name))
    return {
        "name": file_name,
        "last_modified": st.st_mtime_ns,
        "last_accessed": st.st_atime_ns,
        "size": st.st_size,
        "mode": stat.filemode(st.st_mode),
        "kind": "file" if os.path.isfile(file_name) else "directory",
        "schema": dataset_schema_database[file_name],
        "viz": dataset_viz_database.get(file_name, [])
    }


# File System Endpoints
# TODO: Add rename endpoint

@app.get("/fs")
def read_filesystem(hidden: bool = False):
    try:
        cwd = os.getcwd()
        dir_content = [get_file_details(f, cwd) for f in os.listdir(cwd) if
                       (not f.startswith(".") or hidden) and f in dataset_schema_database]
        return {"content": dir_content}
    except Exception as e:
        logging.error(e)
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to retrieve files")


@app.get("/fs/cd/{destination:path}")
def change_directory(destination: str, hidden: bool = False):
    print(f"{destination=}")
    os.chdir(destination if len(destination) > 0 else '.')
    return RedirectResponse("/fs" + ("?hidden=true" if hidden else ""))


@app.post("/fs")
async def upload_file(file: UploadFile):
    if file.size > 512 * 1024 * 1024:
        raise HTTPException(status_code=status.HTTP_406_NOT_ACCEPTABLE, detail="File too large")
    file_path = os.path.join(os.getcwd(), file.filename)
    try:
        schema = extract_schema(file.file, file.filename)
    except Exception as e:
        print(e)
        logging.getLogger("uvicorn").error(e)
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Schema could not be extracted")

    dataset_schema_database[file.filename] = schema

    async with aiofiles.open(file_path, 'wb') as fp:
        await file.seek(0)
        while content := await file.read(1024):
            await fp.write(content)

    cwd = os.getcwd()

    return {
        "status": "OK",
        "file": get_file_details(file.filename, cwd)
    }


class UploadFromUrlParam(BaseModel):
    url: str


@app.post("/fs/url")
async def upload_file_from_url(params: UploadFromUrlParam):
    dataset_url = params.url
    _, filename = os.path.split(dataset_url)
    try:
        path, _ = urlretrieve(dataset_url, filename)
    except Exception:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to download the dataset")

    try:
        with open(filename, "r") as fp:
            schema = extract_schema(fp, filename)
    except Exception:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Schema could not be extracted")

    dataset_schema_database[filename] = schema

    cwd = os.getcwd()

    return {
        "status": "OK",
        "file": get_file_details(filename, cwd)
    }


@app.delete("/fs/{path}")
def remove_file(path: str):
    if path in ('.', '..', ''):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Action cannot be performed")
    file_path = os.path.join(os.getcwd(), path)
    if not os.path.exists(file_path):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Path doesn't exist")
    if os.path.isfile(file_path):
        os.remove(file_path)
    else:
        os.removedirs(file_path)
    return {
        "status": "deleted",
        "path": file_path
    }


# Execution endpoints
class Graph(BaseModel):
    nodes: List[dict]
    edges: List[dict]


@app.post("/execute/{source_node_id}")
def execute(source_node_id: str, graph: Graph):
    node_scheduler = NodeScheduler(graph.nodes, graph.edges, source_node_id)
    code_generator = CodeGenerator(node_scheduler)

    results = {}

    def handle_response(response: dict):
        response_cell_id = response["parent_header"]["msg_id"]
        msg_type = response["msg_type"]

        if response_cell_id not in results:
            results[response_cell_id] = {}

        if msg_type == "error":
            results[response_cell_id]["error"] = response["content"]

        if msg_type == "stream":
            value = results[response_cell_id].get("stream_text", "")
            results[response_cell_id]["stream_text"] = value + response["content"]["text"]

    cell_to_node_id_map = {}
    for idx in node_scheduler.get_execution_order():
        reply = client.execute_interactive(code_generator.generate_code(graph.nodes[idx]), silent=True,
                                           output_hook=handle_response, timeout=20)
        cell_id = reply["parent_header"]["msg_id"]
        cell_to_node_id_map[cell_id] = graph.nodes[idx]["id"]
        content = reply["content"]
        if content["status"] == "error":
            break

    results = {cell_to_node_id_map[cell_id]: data for cell_id, data in results.items()}

    return results


class InferenceParams(BaseModel):
    graph: Graph
    inputs: List[typing.Any]


@app.post("/execute/{source_node_id}/infer")
def infer(source_node_id: str, params: InferenceParams):
    graph = params.graph
    node_scheduler = NodeScheduler(graph.nodes, graph.edges, source_node_id)
    code_generator = CodeGenerator(node_scheduler)

    results = {}

    def handle_response(response: dict):
        response_cell_id = response["parent_header"]["msg_id"]
        msg_type = response["msg_type"]

        if response_cell_id not in results:
            results[response_cell_id] = {}

        if msg_type == "error":
            results[response_cell_id]["error"] = response["content"]

        if msg_type == "stream":
            value = results[response_cell_id].get("stream_text", "")
            results[response_cell_id]["stream_text"] = value + response["content"]["text"]

    cell_to_node_id_map = {}
    reply = client.execute_interactive(code_generator.get_inference_code(source_node_id, params.inputs), silent=True,
                                       output_hook=handle_response, timeout=20)
    cell_id = reply["parent_header"]["msg_id"]
    cell_to_node_id_map[cell_id] = source_node_id
    results = {cell_to_node_id_map[cell_id]: data for cell_id, data in results.items()}

    return results


if __name__ == '__main__':
    uvicorn.run('server:app', host='0.0.0.0', port=5000, log_level='info', reload=True)
