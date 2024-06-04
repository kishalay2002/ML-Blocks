/* eslint-disable react-refresh/only-export-components */
import { createContext, PropsWithChildren, useContext, useRef } from "react";
import { useStore } from "zustand";
import {
  createFilesystemStore,
  FileSystemState,
  FileSystemStore,
} from "../stores/file-system";

export const FileSystemContext = createContext<FileSystemStore | null>(null);

interface Props extends PropsWithChildren {}

export function FileSystemProvider({ children }: Props) {
  const storeRef = useRef<FileSystemStore>();
  if (!storeRef.current) {
    storeRef.current = createFilesystemStore({
      files: [],
    });
  }
  return (
    <FileSystemContext.Provider value={storeRef.current}>
      {children}
    </FileSystemContext.Provider>
  );
}

export function useFileSystemContext<T>(
  selector: (state: FileSystemState) => T
): T {
  const store = useContext(FileSystemContext);
  if (!store) {
    throw new Error("useFileSystemContext() called outside project context");
  }
  return useStore(store, selector);
}
