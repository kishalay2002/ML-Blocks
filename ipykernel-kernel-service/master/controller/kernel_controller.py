from datetime import datetime

import requests

from master.controller.kernel_container_controller import KernelContainerController
from master.repository.kernel_repository import KernelRepository
from master.models.kernel import KernelModel
from fastapi import HTTPException, status


class KernelController:
    def __init__(self,
                 kernel_repository: KernelRepository,
                 kernel_container_controller: KernelContainerController):
        self._kernel_repository = kernel_repository
        self._kernel_container_controller = kernel_container_controller

    def allocate_kernel(self, callback: str, token: str):
        # Add a new entry in the database
        kernel = KernelModel(
            container_image=self._kernel_container_controller.get_image_name()
        )
        kernel = self._kernel_repository.save(kernel)

        # launch container
        container = self._kernel_container_controller.launch_kernel_container(kernel.id, callback, token)
        kernel.container_id = container.id
        kernel = self._kernel_repository.save(kernel)
        return kernel

    def delete_kernel(self, kernel_id: str, callback, token):
        kernel = self._kernel_repository.get(kernel_id)
        self._kernel_repository.delete(kernel_id)
        if kernel is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="kernel not found")
        if kernel.container_id:
            self._kernel_container_controller.delete_container(kernel.container_id)
            if callback:
                requests.put(callback, headers={"Authorization": token}, json={
                    "type": "deleted",
                    "timestamp": datetime.utcnow().isoformat(),
                    "kernel_id": kernel_id,
                    "status": "deleted"
                })