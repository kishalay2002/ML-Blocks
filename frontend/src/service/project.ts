import { client } from "../api"
import { GraphController } from "../components/graph-editor/controller";
import { KernelStatus } from "../stores/project";

function connectKernel(projectId: string, intervalMs: number = 1500) {
  const abortController = new AbortController();
  let timeoutId: number | null = null

  return {
    watch: (cb: (data: null | { status: KernelStatus, kernel_id: string }, err: Error | null) => void) => {
      if (timeoutId !== null) return;

      const poll = async () => {
        await client.post(`/projects/${projectId}/connect`, { signal: abortController.signal })
          .then(({ data, status }) => {
            if (status !== 200) {
              cb(null, new Error(`Response status ${status}`));
            } else {
              cb(data, null);
            }
          })
          .catch(err => {
            cb(null, err);
          });

        if (!abortController.signal.aborted) {
          timeoutId = setTimeout(poll, intervalMs);
        }
      }

      timeoutId = setTimeout(poll, intervalMs);
    },
    cancel: () => {
      abortController.abort("Cancelled");
      if (timeoutId !== null) clearTimeout(timeoutId);
    }
  } as const;
}

async function disconnectKernel(projectId: string) {
  const { status } = await client.post(`/projects/${projectId}/disconnect`);
  if (status === 200) {
    return;
  }
  throw new Error(`Server returned status ${status}`)
}

async function execute(kernel_id: string, graphController: GraphController, sourceNode: string) {
  const { data, status } = await client.post(`/tunnel/${kernel_id}/execute/${sourceNode}`, graphController.export())
  if (status !== 200) {
    throw new Error(`Server returned with status code ${status}`);
  }
  return data;
}

const projectService = {
  connectKernel,
  disconnectKernel,
  execute
}

export { projectService }