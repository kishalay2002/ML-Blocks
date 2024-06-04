import { createStore, StoreApi } from "zustand";
import { TProject } from "../types";
import { projectService } from "../service/project";

export enum KernelStatus {
  CONNECTING = "connecting",
  DISCONNECTED = "disconnected",
  CONNECTED = "connected",
  ERROR = "error",
  DISCONNECTING = "disconnecting"
}

interface ProjectProps {
  project: TProject;
  kernelStatus: KernelStatus;
  kernelId: string;
}

export interface ProjectState extends ProjectProps {
  connect: () => void;
  disconnect: () => void;
}

export type ProjectStore = ReturnType<typeof createProjectStore>

interface CreateActionsProps {
  set: (partial: ProjectState | Partial<ProjectState> | ((state: ProjectState) => ProjectState | Partial<ProjectState>), replace?: boolean | undefined) => void;
  get: () => ProjectState;
  storeApi: StoreApi<ProjectState>
}

const createActions = ({ set, get }: CreateActionsProps) => {
  return {
    // Connect to kernel
    connect: () => {
      set({ kernelStatus: KernelStatus.CONNECTING });
      const poll = projectService.connectKernel(get().project.id)
      poll.watch((data, err) => {
        if (err) {
          console.error(err);
        }

        if (data === null) {
          console.log("Expected data but got null");
          return;
        }

        set({ kernelStatus: data.status, kernelId: data.kernel_id ?? "" });

        if (data.status === KernelStatus.CONNECTED || data.status === KernelStatus.ERROR) {
          poll.cancel();
        }
      });
    },

    // Disconnect kernel from the project
    disconnect: () => {
      set({ kernelStatus: KernelStatus.DISCONNECTING });
      projectService.disconnectKernel(get().project.id)
        .then(() => {
          set({ kernelStatus: KernelStatus.DISCONNECTED, kernelId: '' })
        })
        .catch((err) => {
          console.error("Failed to disconnect the kernel from the project", err)
        })
    }
  } as const;
}

export const createProjectStore = (initProps?: Partial<ProjectProps>) => {
  const DEFAULT_PROPS: ProjectProps = {
    project: {} as TProject,
    kernelStatus: KernelStatus.DISCONNECTED,
    kernelId: ''
  }

  const store = createStore<ProjectState>();

  return store((set, get, storeApi) => ({
    ...DEFAULT_PROPS,
    ...initProps,
    ...createActions({ set, get, storeApi })
  }))
}