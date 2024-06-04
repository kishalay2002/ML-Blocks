import logging
import os
import jwt
import requests

from app.service.kernel_service import KernelService

logger = logging.getLogger("uvicorn")


class RestKernelService(KernelService):
    def __init__(self):
        self.kernel_api = os.getenv('REST_KERNEL_API')
        if self.kernel_api is None:
            raise Exception("Missing REST_KERNEL_API")

        self.host_server = os.getenv("HOST_SERVER")
        if self.host_server is None:
            raise Exception("Missing HOST_SERVER")

    def provision_kernel(self, project_id: str):
        response = requests.post(self.__build_url__(project_id, "kernels"))
        if response.status_code != 200:
            raise Exception(f"Kernel service returned status code {response.status_code}")

    def stop_kernel(self, project_id: str, kernel_id: str):
        logger.info(f"Stopping kernel {kernel_id}")
        response = requests.delete(self.__build_url__(project_id, f"kernels/{kernel_id}"))
        if response.status_code not in (200, 404):
            raise Exception(f"Kernel service returned status code {response.status_code}")

    def __build_url__(self, project_id: str, path: str):
        auth_token = jwt.encode({
            "project_id": project_id
        }, os.getenv("JWT_SECRET"), algorithm="HS256")
        return f"{self.kernel_api}/{path}?callback={self.host_server}/webhook/kernel/projects&token={auth_token}"
