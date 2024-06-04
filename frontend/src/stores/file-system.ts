import { createStore, StoreApi } from "zustand";
import { TFile } from "../types";
import { fileSystemService } from "../service/file-system";

interface FileSystemProps {
  files: TFile[]
}

export interface FileSystemState extends FileSystemProps {
  load: (kernelId: string, abortController?: AbortController) => void;
  uploadFile: (kernelId: string, file: File, abortController?: AbortController) => Promise<TFile>,
  uploadFromUrl: (kernelId: string, url: string, abortController?: AbortController) => Promise<TFile>,
}

export type FileSystemStore = ReturnType<typeof createFilesystemStore>

interface CreateActionsProps {
  set: (partial: FileSystemState | Partial<FileSystemState> | ((state: FileSystemState) => FileSystemState | Partial<FileSystemState>), replace?: boolean | undefined) => void;
  get: () => FileSystemState;
  storeApi: StoreApi<FileSystemState>
}

const createActions = ({ set }: CreateActionsProps) => {
  return {
    load: async (kernelId: string, abortController?: AbortController) => {
      const files = await fileSystemService.load(kernelId, abortController);
      set({ files })
    },
    uploadFile: async (kernelId: string, file: File, abortController?: AbortController) => {
      const uploadedFile = await fileSystemService.uploadFile(kernelId, file, abortController);
      set((state) => ({ files: [...state.files, uploadedFile] }));
      return uploadedFile;
    },
    uploadFromUrl: async (kernelId: string, url: string, abortController?: AbortController) => {
      const uploadedFile = await fileSystemService.uploadFromUrl(kernelId, url, abortController);
      set((state) => ({ files: [...state.files, uploadedFile] }));
      return uploadedFile;
    }
  } as const;
}

export const createFilesystemStore = (initProps?: Partial<FileSystemProps>) => {
  const DEFAULT_PROPS: FileSystemProps = {
    files: []
  }

  const store = createStore<FileSystemState>();

  return store((set, get, storeApi) => ({
    ...DEFAULT_PROPS,
    ...initProps,
    ...createActions({ set, get, storeApi })
  }))
}