import { client } from "../api";
import { TFile } from "../types";

/**
 * Load datasets that have been uploaded to the execution container
 * 
 * @param kernelId kernel id
 * @returns {TFile[]} list of uploaded datasets
 */
async function load(kernelId: string, abortController?: AbortController) {
  const { data, status } = await client.get(`/tunnel/${kernelId}/fs`, { signal: abortController?.signal });
  if (status !== 200) {
    throw new Error(`Server returned with status ${status}`)
  }
  return data.content as TFile[];
}

async function uploadFile(kernelId: string, file: File, abortController?: AbortController) {
  const formData = new FormData();
  formData.append("file", file);
  const { data, status } = await client.post(`/tunnel/${kernelId}/fs`, formData, { signal: abortController?.signal });
  if (status !== 200) {
    throw new Error(`Server returned with status code ${status}`);
  }
  return data.file as TFile
}

async function uploadFromUrl(kernelId: string, url: string, abortController?: AbortController) {
  const { data, status } = await client.post(`/tunnel/${kernelId}/fs/url`, { url }, { signal: abortController?.signal });
  if (status !== 200) {
    throw new Error(`Server returned with status code ${status}`);
  }
  return data.file as TFile
}

const fileSystemService = {
  load,
  uploadFile,
  uploadFromUrl
} as const;

export { fileSystemService }