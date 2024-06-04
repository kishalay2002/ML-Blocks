from abc import ABC, abstractmethod
from typing import List, Optional

from app.model.project_model import Project


class ProjectRepository(ABC):
    @abstractmethod
    def fetch_by_id(self, project_id: str) -> Optional[Project]:
        pass

    @abstractmethod
    def fetch_all(self, skip=None, limit=0) -> List[Project]:
        pass

    @abstractmethod
    def fetch_by_kernel_id(self, kernel_id: str) -> Optional[Project]:
        pass

    @abstractmethod
    def persist(self, project: Project):
        pass

    @abstractmethod
    def delete(self, project_id: str) -> bool:
        pass
