import datetime
import os

import jwt
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from starlette import status
from starlette.requests import Request

from app.controller import kernel_controller
from app.controller.tunnel_controller import tunnel
from app.model.kernel_event import KernelEvent
from app.model.project_model import Project
from app.repository import project_repository

app = FastAPI()

app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_credentials=True, allow_methods=["*"],
                   allow_headers=["*"])

# Tunnel requests to corresponding container
app.add_route('/tunnel/{kernel_id:str}/{destination:path}', tunnel, methods=['GET', 'POST', 'DELETE', 'PUT'])


@app.get("/health")
def health():
    return {
        "status": "OK"
    }


@app.post("/auth/register", description="Register a new user account")
def auth_register():
    pass


@app.post("/auth/login", description="Login an user account")
def auth_login():
    pass


@app.post("/projects", description="Create a new project")
def create_project():
    project = Project()
    project_repository.persist(project)
    return project


@app.get("/projects", description="Get list of all project sessions")
def get_projects(skip: int = 0, limit: int = 10):
    return project_repository.fetch_all(skip, limit)


@app.get("/projects/{project_id}", description="Fetches a specific project")
def get_project(project_id: str):
    project = project_repository.fetch_by_id(project_id)
    if not project:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")
    return project


@app.delete("/projects/{project_id}", description="Delete a project, and also deallocate commissioned kernel")
def delete_project(project_id: str):
    res = project_repository.delete(project_id)
    if not res:
        raise HTTPException(status_code=404, detail="Failed to delete project")
    return {
        "message": "Project deleted"
    }


@app.post("/projects/{project_id}/connect", description="Connect a kernel to the project")
def connect_kernel(project_id: str):
    return kernel_controller.connect_kernel(project_id)


@app.post("/projects/{project_id}/disconnect", description="Disconnect a kernel from the project")
def disconnect_kernel(project_id: str):
    return kernel_controller.disconnect_kernel(project_id)


@app.post("/projects/{project_id}/checkpoint", description="Create a new checkpoint for the graph")
async def checkpoint(project_id: str, request: Request):
    project = project_repository.fetch_by_id(project_id)
    if not project:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")
    graph = await request.json()
    project.graph = graph
    project_repository.persist(project)
    return {
        "status": "ok",
        "saved_at": datetime.datetime.utcnow()
    }


@app.put("/webhook/kernel/projects", description="Receive kernel state from kernel service")
def kernel_webhook(request: Request, event: KernelEvent):
    # Validate authorization token
    auth_header = request.headers.get("Authorization", None)
    if auth_header is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Action not authorized")

    try:
        payload = jwt.decode(auth_header, os.getenv("JWT_SECRET"), algorithms=["HS256"])
    except Exception:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")

    project_id = payload["project_id"]
    if not project_id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="project_id not in the token")

    kernel_controller.update_kernel_state(project_id, event)
