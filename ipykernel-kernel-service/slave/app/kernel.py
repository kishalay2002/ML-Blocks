import os
from typing import Optional
from multiprocessing.connection import Client

import requests
from ipykernel.kernelapp import IPKernelApp
import sys
import signal

__stdout__ = sys.stdout
configuration_file: Optional[str] = None

preprocessing_import = """import importlib.util
import sys
spec = importlib.util.spec_from_file_location("preprocessing", "/slave/app/preprocessing.py")
preprocessing = importlib.util.module_from_spec(spec)
sys.modules["preprocessing"] = preprocessing
spec.loader.exec_module(preprocessing)
del spec
del sys
del importlib
"""


class MLBlockKernel(IPKernelApp):
    no_stdout = True
    kernel_name = "MLBlock"
    description = "MLBlocks interactive kernel"
    version = "0.0.1.SNAPSHOT"
    hb_port = int(os.getenv("KERNEL_HB_PORT", "6004"))
    iopub_port = int(os.getenv("KERNEL_IOPUB_PORT", "6003"))
    stdin_port = int(os.getenv("KERNEL_STDIN_PORT", "6002"))
    control_port = int(os.getenv("KERNEL_CONTROL_PORT", "6001"))
    shell_port = int(os.getenv("KERNEL_SHELL_PORT", "6000"))
    ip = "127.0.0.1"
    connection_file = "config.json"

    def initialize(self, argv=[]):
        super().initialize(argv)
        self.shell.run_cell(
            '__kernel_name__ = "MLBlockKernel:0.0.1.SNAPSHOT"', store_history=False
        )
        self.shell.run_cell(
            preprocessing_import, store_history=False
        )


def close(signum, _):
    if configuration_file is not None:
        os.remove(configuration_file)
    exit(signum)


def ping_master(app: IPKernelApp, kernel_id: str, master_host: str):
    """notify the master about kernel initialization"""
    # TODO: implement retry policy
    response = requests.post(f"{master_host}/internal/register/{kernel_id}", json={
        "version": app.version,
        "callback": os.getenv("CALLBACK_URL"),
        "token": os.getenv("AUTH_TOKEN")
    })

    if response.status_code != 200:
        exit(2)


def get_kernel_id():
    kernel_id = os.getenv("KERNEL_ID")
    if kernel_id is not None:
        return kernel_id

    if len(sys.argv) < 2:
        print("Usage: %s kernel_id" % sys.argv[0])
        exit(1)

    return sys.argv[1]


def main():
    ipc_client = Client(address=('localhost', 7000), authkey=b'password')
    kernel_id = get_kernel_id()
    app = MLBlockKernel.instance()
    app.initialize()
    ipc_client.send('config')
    ipc_client.close()
    ping_master(app, kernel_id, os.getenv("KERNEL_MASTER_HOST", "host.docker.internal"))
    signal.signal(signal.SIGQUIT, close)
    app.start()


if __name__ == "__main__":
    main()
