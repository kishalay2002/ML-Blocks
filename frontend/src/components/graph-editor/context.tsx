import { createContext, PropsWithChildren, useContext } from "react";
import { GraphController } from "./controller";

interface TGraphContext {
  controller: GraphController;
}

const GraphContext = createContext<TGraphContext>({} as TGraphContext);

interface Props extends PropsWithChildren {
  controller: GraphController;
}

function useGraph() {
  const values = useContext(GraphContext);
  if (values === undefined) {
    throw new Error("useGraph() called outside of graph context");
  }
  return values;
}

function GraphProvider({ controller, children }: Props) {
  return (
    <GraphContext.Provider value={{ controller }}>
      {children}
    </GraphContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export { GraphProvider, useGraph };
