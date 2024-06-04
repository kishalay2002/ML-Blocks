/* eslint-disable react-refresh/only-export-components */
import { createContext, PropsWithChildren, useContext, useRef } from "react";
import {
  createProjectStore,
  KernelStatus,
  ProjectState,
  ProjectStore,
} from "../stores/project";
import { TProject } from "../types";
import { useStore } from "zustand";

export const ProjectContext = createContext<ProjectStore | null>(null);

interface Props extends PropsWithChildren {
  project: TProject;
}

export function ProjectProvider({ project, children }: Props) {
  const storeRef = useRef<ProjectStore>();
  if (!storeRef.current) {
    storeRef.current = createProjectStore({
      project: project,
      kernelStatus: project.kernel_status as KernelStatus,
      kernelId: project.kernel_id ?? "",
    });
  }
  return (
    <ProjectContext.Provider value={storeRef.current}>
      {children}
    </ProjectContext.Provider>
  );
}

export function useProjectContext<T>(selector: (state: ProjectState) => T): T {
  const store = useContext(ProjectContext);
  if (!store) {
    throw new Error("useProjectContext() called outside project context");
  }
  return useStore(store, selector);
}
