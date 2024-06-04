import docker


class KernelContainerController:
    def __init__(self, image: str, master_host: str, client: docker.DockerClient):
        self._client = client
        self._image = image
        self._master_host = master_host

    def launch_kernel_container(self, kernel_id: str, callback_url: str, token: str):
        env = {
            'KERNEL_ID': kernel_id,
            'KERNEL_MASTER_HOST': self._master_host or "http://host.docker.internal:8000",
            'CALLBACK_URL': callback_url,
            'AUTH_TOKEN': token,
            'KERNEL_CONFIG_FILE': '/root/.local/share/jupyter/runtime/config.json'
        }

        config = {
            'detach': True,
            'publish_all_ports': True,
            'extra_hosts': {
                'host.docker.internal': 'host-gateway'
            },
            'environment': env
        }

        container = self._client.containers.run(self._image, **config)

        return container

    def delete_container(self, container_id: str):
        container = self._client.containers.get(container_id)
        container.remove(force=True)

    def get_image_name(self):
        return self._image

    def get_address(self, container_id):
        container = self._client.containers.get(container_id)
        ip = container.attrs['NetworkSettings']['Gateway']
        port = container.attrs['NetworkSettings']['Ports']['5000/tcp'][0]['HostPort']
        return f"{ip}:{port}"
