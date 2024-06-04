from typing import Optional, List

from pymongo.collection import ObjectId

import master.context as ctx
from master.models.kernel import KernelModel


class KernelRepository:
    def __init__(self, collection_name="kernels"):
        self._collection_name = collection_name

    def save(self, kernel: KernelModel) -> KernelModel:
        if kernel.id is None:
            result = ctx.database[self._collection_name].insert_one(kernel.model_dump(by_alias=True, exclude={"id"}))
            kernel.id = str(result.inserted_id)
        else:
            ctx.database[self._collection_name].update_one({"_id": ObjectId(kernel.id)},
                                                           {"$set": kernel.model_dump(by_alias=True, exclude={"id"})},
                                                           upsert=False)
        return kernel

    def get(self, kernel_id: str) -> Optional[KernelModel]:
        result = ctx.database[self._collection_name].find_one({"_id": ObjectId(kernel_id)})
        if result is None:
            return None
        return KernelModel(**result)

    def delete(self, kernel_id: str) -> bool:
        result = ctx.database[self._collection_name].delete_one({"_id": ObjectId(kernel_id)})
        return result.deleted_count > 0

    def get_all(self) -> List[KernelModel]:
        return [KernelModel(**record) for record in list(ctx.database[self._collection_name].find())]

    def find_kernel_by_container_id(self, container_id: str) -> Optional[KernelModel]:
        result = ctx.database[self._collection_name].find_one({"container_id": container_id})
        if result is None:
            return None
        return KernelModel(**result)
