import logging

import requests
from starlette import status
from starlette.exceptions import HTTPException
from starlette.requests import Request
from starlette.responses import Response

from app.repository import project_repository

logger = logging.getLogger("uvicorn")


async def tunnel(request: Request):
    kernel_id = request.path_params.get('kernel_id')
    destination = request.path_params.get('destination', '')
    project = project_repository.fetch_by_kernel_id(kernel_id)

    if not project:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No associated project found")
    if not project.kernel_url:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Kernel URL is not set")

    try:
        response = requests.request(
            request.method,
            url=f"{project.kernel_url}/{destination}" + request.base_url.query,
            allow_redirects=False,
            cookies=request.cookies,
            headers=request.headers,
            data=await request.body()
        )
        return Response(content=response.content, status_code=response.status_code, headers=response.headers)
    except Exception as e:
        logger.error(e)
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Proxy failed")
