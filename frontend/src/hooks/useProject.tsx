import { useEffect, useState } from "react";
import { client } from "../api";
import { TProject } from "../types.ts";

interface ProjectError {
  status: number;
  reason: string;
}

export function useProject(id: string) {
  const [project, setProject] = useState<TProject>({} as TProject);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<ProjectError | null>(null);

  useEffect(() => {
    const abortController = new AbortController();

    client
      .get(`/projects/${id}`, { signal: abortController.signal })
      .then(({ data, status, statusText }) => {
        if (status !== 200) {
          setError({
            status,
            reason: statusText,
          });
        } else {
          setProject(data);
        }
      })
      .finally(() => {
        setLoading(false);
      });

    return () => {
      abortController.abort("Component demounted");
    };
  }, [id]);

  return { project, loading, error };
}
