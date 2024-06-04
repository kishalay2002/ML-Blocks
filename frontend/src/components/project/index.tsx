import { useEffect, useState } from "react";
import { Box, Flex, Loader } from "@mantine/core";
import { Navbar } from "./navbar";
import { client } from "../../api";
import { TProject } from "../../types";
import { ProjectProvider } from "../../context/projectContext";
import { Arena } from "./arena";
import { ModalsProvider } from "@mantine/modals";
import { FileSystemProvider } from "../../context/filesystemContext";

interface Props {
  id: string;
}

interface ProjectError {
  reason: string;
  status: number;
}

function Project({ id }: Props) {
  const [project, setProject] = useState<TProject>({} as TProject);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<ProjectError | null>(null);

  useEffect(() => {
    const abortController = new AbortController();

    client
      .get(`/projects/${id}`, { signal: abortController.signal })
      .then(({ data, status, statusText }) => {
        if (status === 200) {
          setProject(data);
        } else {
          setError({ reason: statusText, status });
        }
      })
      .catch((err) => {
        console.log(err);
        setError({ reason: err, status: err?.response?.status ?? 500 });
      })
      .finally(() => {
        setLoading(false);
      });

    return () => {
      abortController.abort("Component demounted");
    };
  }, [id]);

  if (loading) {
    return (
      <Flex
        h="100vh"
        w="100%"
        align="center"
        justify="center">
        <Loader />
      </Flex>
    );
  }

  if (error) {
    if (error.status === 404) {
      return "Not Found";
    } else {
      return "Internal server error" + error.status;
    }
  }

  return (
    <ProjectProvider project={project}>
      <FileSystemProvider>
        <ModalsProvider>
          <Flex
            direction="column"
            h="100vh">
            <Navbar />
            <Box
              flex={1}
              w="100%">
              <Arena />
            </Box>
          </Flex>
        </ModalsProvider>
      </FileSystemProvider>
    </ProjectProvider>
  );
}

export { Project };
