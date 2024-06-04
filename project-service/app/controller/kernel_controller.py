import logging

from fastapi import HTTPException
from starlette import status
from starlette.responses import JSONResponse

from app.model.kernel_event import KernelEvent
from app.model.project_model import KernelStatus
from app.repository.project_repository import ProjectRepository
from app.service.kernel_service import KernelService

logger = logging.getLogger("uvicorn")


class KernelController:
    def __init__(self, project_repository: ProjectRepository, kernel_service: KernelService):
        self.project_repository = project_repository
        self.kernel_service = kernel_service

    def connect_kernel(self, project_id: str):
        project = self.project_repository.fetch_by_id(project_id)

        if project is None:
            return HTTPException(status_code=404, detail="Project doesn't exist")

        if project.kernel_id is not None or project.kernel_status in (KernelStatus.CONNECTED, KernelStatus.CONNECTING):
            return {
                "status": project.kernel_status,
                "kernel_id": project.kernel_id
            }

        project.kernel_status = KernelStatus.CONNECTING
        self.project_repository.persist(project)

        try:
            self.kernel_service.provision_kernel(project_id)
        except Exception as e:
            logger.error(e)
            return HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Kernel provisioning failed")

        return JSONResponse({
            "status": KernelStatus.CONNECTING,
            "kernel_id": None
        })

    def disconnect_kernel(self, project_id: str):
        project = self.project_repository.fetch_by_id(project_id)

        if not project:
            return HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project doesn't exist")

        project.kernel_status = KernelStatus.DISCONNECTED

        if project.kernel_id:
            if project.kernel_status == KernelStatus.CONNECTING:
                return HTTPException(status_code=status.HTTP_501_NOT_IMPLEMENTED,
                                     detail="Doesn't support disconnection while kernel state is in 'CONNECTING'")

            try:
                self.kernel_service.stop_kernel(project.id, project.kernel_id)
                project.kernel_id = None
                project.kernel_url = None
            except Exception as e:
                logger.error(e)
                return HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Kernel decommissioning failed")

        self.project_repository.persist(project)

    def update_kernel_state(self, project_id: str, event: KernelEvent):
        project = self.project_repository.fetch_by_id(project_id)
        if not project:
            return HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project doesn't exist")

        logger.info(f"Project {project.id} received event: {event}")

        if event.type == "started":
            logger.info(f"Kernel connected to project {project.id}")
            project.kernel_status = KernelStatus.CONNECTED
            project.kernel_id = event.kernel_id
            project.kernel_url = event.kernel_url
            self.project_repository.persist(project)
