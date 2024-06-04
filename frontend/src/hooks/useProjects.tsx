import { useState } from "react";
import { TProject } from "../types";
import { client } from "../api";

export function useProjects(projectStoreKey = "projects") {
  const [projects, setProjects] = useState<TProject[]>(() => {
    const res = localStorage.getItem(projectStoreKey);
    if (res == null) {
      return [];
    }
    return JSON.parse(res);
  });

  const createNewProject = async () => {
    const { data, status } = await client.post("/projects");

    if (status !== 200) {
      throw new Error("Server returned status " + status);
    }

    setProjects((prev) => {
      const arr = [...prev, data];
      localStorage.setItem(projectStoreKey, JSON.stringify(arr));
      return arr;
    });
  };

  return { projects, createNewProject };
}
