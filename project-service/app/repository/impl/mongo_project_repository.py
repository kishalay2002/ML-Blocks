from datetime import datetime
from typing import List, Optional

from pymongo.collection import ObjectId

from app.application_context import ApplicationContext
from app.model.project_model import Project
from app.repository.project_repository import ProjectRepository


class MongoProjectRepository(ProjectRepository):
    def __init__(self, collection_name: str, context: ApplicationContext):
        self.collection = context.database[collection_name]

    def fetch_by_id(self, project_id: str) -> Optional[Project]:
        result = self.collection.find_one({"_id": ObjectId(project_id)})
        return Project(**result) if result is not None else None

    def fetch_by_kernel_id(self, kernel_id: str) -> Optional[Project]:
        result = self.collection.find_one({"kernel_id": kernel_id})
        return None if result is None else Project(**result)

    def fetch_all(self, skip=0, limit=0) -> List[Project]:
        return [Project(**record) for record in
                self.collection.find(sort=[('created_at', -1)], skip=skip, limit=limit)]

    def persist(self, project: Project):
        if project.id is None:
            result = self.collection.insert_one(project.model_dump(exclude={"id"}, by_alias=True))
            project.id = str(result.inserted_id)
        else:
            project.updated_at = datetime.utcnow()
            self.collection.update_one({"_id": ObjectId(project.id)}, {"$set": project.model_dump()})

    def delete(self, project_id: str) -> bool:
        response = self.collection.delete_one({"_id": ObjectId(project_id)})
        return response.acknowledged
