import { useParams } from "react-router-dom";
import { Project } from "../components/project";

function ProjectPage() {
  const { id } = useParams();

  if (id === undefined) {
    throw new Error("id shouldn't been undefiend.");
  }

  return <Project id={id} />;
}

export { ProjectPage };
