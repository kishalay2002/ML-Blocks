from abc import ABC, abstractmethod


class KernelService(ABC):
    @abstractmethod
    def provision_kernel(self, project_id: str):
        pass

    @abstractmethod
    def stop_kernel(self, project_id: str, kernel_id: str):
        pass
