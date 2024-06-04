import { useCallback, useEffect, useRef } from "react";
import ReactFlow, {
  Background,
  BackgroundVariant,
  Connection,
  Controls,
  Edge,
  Node,
  ReactFlowProvider,
  addEdge,
  getConnectedEdges,
  updateEdge,
  useEdgesState,
  useNodesState,
  useReactFlow,
} from "reactflow";
import { v4 as uuidv4 } from "uuid";
import { GraphController } from "./controller";
import { GraphProvider, useGraph } from "./context";
import { useMantineTheme } from "@mantine/core";
import { nodeTypes } from "./node-types";
import { connections as validConnections } from "./valid-connections.json";
import "reactflow/dist/style.css";
import { ExecutionContextProvider } from "../../context/executionContext";
import { useProjectContext } from "../../context/projectContext";
import { client } from "../../api";

interface Props {
  initialNodes: Node[];
  initialEdges: Edge[];
}

function GraphEditor({ initialNodes, initialEdges }: Props) {
  const { controller } = useGraph();
  const edgeUpdateSuccessful = useRef(true);
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const reactflow = useReactFlow();
  const reactflowRef = useRef<HTMLDivElement>(null);
  const theme = useMantineTheme();
  const kernelId = useProjectContext((state) => state.kernelId);
  const project = useProjectContext((state) => state.project);

  useEffect(() => {
    controller.setPositionRetreiver((id: string) => {
      return reactflow.getNode(id)?.position ?? { x: 0, y: 0 };
    });
  }, [reactflow, controller]);

  useEffect(() => {
    const abortController = new AbortController();
    let intervalId: number | undefined = undefined;
    if (kernelId) {
      intervalId = setInterval(() => {
        client
          .post(`/projects/${project.id}/checkpoint`, controller.export(), {
            signal: abortController.signal,
          })
          .catch((err) => {
            console.log("Failed to save graph checkpoint");
            console.error(err);
          });
      }, 5000);
    }

    return () => {
      abortController.abort();
      clearInterval(intervalId);
    };
  }, [kernelId, controller, project.id]);

  const onConnect = useCallback(
    (params: Connection) => {
      controller.addEdge(params.source!, params.target!);
      setEdges((e) => addEdge({ ...params, updatable: true }, e));
    },
    [setEdges, controller]
  );

  const onEdgeUpdateStart = useCallback(() => {
    edgeUpdateSuccessful.current = false;
  }, []);

  const onEdgeUpdate = useCallback(
    (oldEdge: Edge, newConnection: Connection) => {
      edgeUpdateSuccessful.current = true;
      setEdges((els) => updateEdge(oldEdge, newConnection, els));
    },
    [setEdges]
  );

  const onEdgeUpdateEnd = useCallback(
    (_: unknown, edge: Edge) => {
      if (!edgeUpdateSuccessful.current) {
        controller.removeEdge(edge.source!, edge.target!);
        setEdges((eds) => eds.filter((e) => e.id !== edge.id));
      }
      edgeUpdateSuccessful.current = true;
    },
    [setEdges, controller]
  );

  const onNodesDelete = useCallback(
    (deleted: Node[]) => {
      setEdges(
        deleted.reduce((acc, node) => {
          controller.removeNode(node.id);
          const connectedEdges = getConnectedEdges([node], edges);

          const remainingEdges = acc.filter(
            (edge) => !connectedEdges.includes(edge)
          );

          return remainingEdges;
        }, edges)
      );
    },
    [edges, setEdges, controller]
  );

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      onConnect={onConnect}
      onEdgeUpdate={onEdgeUpdate}
      onEdgeUpdateStart={onEdgeUpdateStart}
      onEdgeUpdateEnd={onEdgeUpdateEnd}
      onNodesDelete={onNodesDelete}
      deleteKeyCode={"Delete"}
      nodeTypes={nodeTypes}
      elementsSelectable={true}
      ref={reactflowRef}
      isValidConnection={(connection) => {
        if (!connection.source || !connection.target) return true;

        const sourceNode = reactflow.getNode(connection.source);
        const targetNode = reactflow.getNode(connection.target);
        if (!sourceNode?.type || !targetNode?.type) return true;

        if (Object.keys(validConnections).includes(sourceNode.type)) {
          // @ts-expect-error valid connection is type any
          return (validConnections[sourceNode.type] as string[]).includes(
            targetNode.type
          );
        }

        return false;
      }}
      proOptions={{
        hideAttribution: true,
      }}
      onDragOver={(ev) => ev.preventDefault()}
      onDrop={(event) => {
        const id = uuidv4();
        const type = event.dataTransfer.getData("text");
        controller.addNode(id, type);
        setNodes((nds) =>
          nds.concat([
            {
              type,
              id,
              position: reactflow.screenToFlowPosition({
                x: event.clientX,
                y: event.clientY,
              }),
              data: {
                value: 123,
              },
            },
          ])
        );
      }}>
      <Controls
        style={{
          borderRadius: "5px",
          overflow: "hidden",
        }}
      />
      <Background
        variant={BackgroundVariant.Dots}
        color={theme.colors.dark[4]}
        style={{ background: theme.colors.dark[9], borderRadius: "12px" }}
        gap={12}
        size={1}
      />
    </ReactFlow>
  );
}

function Editor() {
  const project = useProjectContext((state) => state.project);
  const graphController = useRef<GraphController>(new GraphController());
  const initialNodes = useRef<Node[]>([]);
  const initialEdges = useRef<Edge[]>([]);
  const initialized = useRef<boolean>(false);

  if (!initialized.current && project) {
    initialNodes.current = (project.graph?.nodes ?? []) as Node[];
    initialEdges.current = (project.graph?.edges ?? []) as Edge[];
    try {
      initialNodes.current.forEach(({ id, type, data }) =>
        graphController.current.addNode(id, type!, data)
      );
      initialEdges.current.forEach(({ target, source }) =>
        graphController.current.addEdge(source, target)
      );
    } catch (err) {
      console.log("DEV_RELOAD");
    }
    initialized.current = true;
  }

  return (
    <ReactFlowProvider>
      <GraphProvider controller={graphController.current}>
        <ExecutionContextProvider>
          <GraphEditor
            initialEdges={initialEdges.current}
            initialNodes={initialNodes.current}
          />
        </ExecutionContextProvider>
      </GraphProvider>
    </ReactFlowProvider>
  );
}

export { Editor };
