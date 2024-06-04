import logging
import os

from pymongo import MongoClient
from pymongo.database import Database
from dotenv import load_dotenv

from app.singleton import Singleton

logger = logging.getLogger('uvicorn')


class ApplicationContext(metaclass=Singleton):
    database: Database = None
    database_client: MongoClient = None

    def __init__(self):
        load_dotenv()
        self.database_client = MongoClient(os.getenv('MONGO_URI'))
        self.database = self.database_client[os.getenv('MONGO_DATABASE')]
        logger.info(f"connected to database {os.getenv('MONGO_URI')}")
        logger.info("application context loaded")
