/* eslint-disable react-refresh/only-export-components */
import { createContext, PropsWithChildren, useContext, useRef } from "react";
import { useStore } from "zustand";
import {
  createExecutionStore,
  ExecutionState,
  ExecutionStore,
} from "../stores/execution";

export const ExecutionContext = createContext<ExecutionStore | null>(null);

interface Props extends PropsWithChildren {}

export function ExecutionContextProvider({ children }: Props) {
  const storeRef = useRef<ExecutionStore>();
  if (!storeRef.current) {
    storeRef.current = createExecutionStore({
      nodes: {},
      executing: false,
    });
  }
  return (
    <ExecutionContext.Provider value={storeRef.current}>
      {children}
    </ExecutionContext.Provider>
  );
}

export function useExecutionContext<T>(
  selector: (state: ExecutionState) => T
): T {
  const store = useContext(ExecutionContext);
  if (!store) {
    throw new Error("useFileSystemContext() called outside project context");
  }
  return useStore(store, selector);
}
