from typing import Mapping, Any, Optional

from pymongo import MongoClient
from pymongo.database import Database

client: MongoClient[Mapping[str, Any]]
database: Optional[Database[Mapping[str, Any]]] = None
