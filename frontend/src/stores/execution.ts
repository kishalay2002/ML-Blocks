import { createStore, StoreApi } from "zustand";
import { GraphController } from "../components/graph-editor/controller";
import { projectService } from "../service/project";

interface ExecutionProps {
  nodes: {
    [key: string]: any
  }
  executing: boolean,
}

export interface ExecutionState extends ExecutionProps {
  execute: (kernelId: string, graphController: GraphController, sourceNodeId: string) => void;
}

export type ExecutionStore = ReturnType<typeof createExecutionStore>

interface CreateActionsProps {
  set: (partial: ExecutionState | Partial<ExecutionState> | ((state: ExecutionState) => ExecutionState | Partial<ExecutionState>), replace?: boolean | undefined) => void;
  get: () => ExecutionState;
  storeApi: StoreApi<ExecutionState>
}

const createActions = ({ set }: CreateActionsProps) => {
  return {
    execute: async (kernelId: string, graphController: GraphController, sourceNodeId: string) => {
      set({ executing: true });
      try {
        const result = await projectService.execute(kernelId, graphController, sourceNodeId);
        set({ executing: false, nodes: result });
      } catch (err) {
        set({ executing: false })
      }
    }
  } as const;
}

export const createExecutionStore = (initProps?: Partial<ExecutionProps>) => {
  const DEFAULT_PROPS: ExecutionProps = {
    nodes: {},
    executing: false
  }

  const store = createStore<ExecutionState>();

  return store((set, get, storeApi) => ({
    ...DEFAULT_PROPS,
    ...initProps,
    ...createActions({ set, get, storeApi })
  }))
}