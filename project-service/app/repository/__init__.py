from app.application_context import ApplicationContext
from app.repository.impl.mongo_project_repository import MongoProjectRepository
from app.repository.project_repository import ProjectRepository

context = ApplicationContext()
project_repository: ProjectRepository = MongoProjectRepository("projects", context)
