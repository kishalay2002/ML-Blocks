from app.controller.kernel_controller import KernelController
from app.repository import project_repository
from app.service import kernel_service

kernel_controller = KernelController(project_repository, kernel_service)
