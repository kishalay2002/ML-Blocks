import { useMemo } from "react";
import {
  getConnectedEdges,
  Handle,
  ReactFlowState,
  useNodeId,
  useStore,
} from "reactflow";

const selector = (s: ReactFlowState) => ({
  nodeInternals: s.nodeInternals,
  edges: s.edges,
});

const CustomHandle = (props: any) => {
  const { nodeInternals, edges } = useStore(selector);
  const nodeId = useNodeId();

  const isHandleConnectable = useMemo(() => {
    if (nodeId === null) return false;

    if (typeof props.isConnectable === "function") {
      const node = nodeInternals.get(nodeId);
      if (node === undefined) return false;
      const connectedEdges = getConnectedEdges([node], edges);

      return props.isConnectable({ node, connectedEdges });
    }

    if (typeof props.isConnectable === "number") {
      const node = nodeInternals.get(nodeId);
      if (node === undefined) return false;
      const connectedEdges = getConnectedEdges([node], edges).filter(
        (edge) => props.type === "target" && edge.targetHandle === props.id ||
          props.type === "source" && edge.sourceHandle === props.id
      );

      return connectedEdges.length < props.isConnectable;
    }

    return props.isConnectable;
  }, [nodeInternals, edges, nodeId, props]);

  return (
    <Handle
      {...props}
      isConnectable={isHandleConnectable}
      onConnect={(connection) => {
        console.log(connection);
      }}
    ></Handle>
  );
};

export default CustomHandle;
