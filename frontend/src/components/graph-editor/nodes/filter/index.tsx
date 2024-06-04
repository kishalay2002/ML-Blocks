import { NodeProps, Position } from "reactflow";
import CustomHandle from "../CustomHandle";
import "./style.css";
import { useEffect, useState } from "react";
import { GraphNode } from "../../controller";
import { useGraph } from "../../context";
import { TDataSourceSchema } from "../../../../types";
import { Select, TextInput } from "@mantine/core";
// import RunButton from "../../RunButton";

export default function FilterNode({ selected, id, isConnectable }: NodeProps) {
  const { controller } = useGraph();
  const [incomingNode, setIncomingNode] = useState<GraphNode>();
  const [keys, setKeys] = useState<TDataSourceSchema>([]);

  useEffect(() => {
    return controller.subscribe(id, (node) => {
      const nodes: GraphNode[] = [];
      node.getIncomingNodes().forEach((nodeId) => {
        nodes.push(controller.getNode(nodeId));
      });
      if (nodes.length > 0) setIncomingNode(nodes[0]);
    });
  }, [id, controller]);

  useEffect(() => {
    if (!incomingNode) {
      return;
    }

    const source = incomingNode.getData("dataSource");
    if (source) {
      setKeys(source.schema);
      controller.getNode(id).setData("dataSource", source);
    }

    const callback = ({ detail }: any) => {
      setKeys(detail.schema);
      controller.getNode(id).setData("dataSource", detail);
    };

    incomingNode.addEventListener("dataSource", callback);

    return () => {
      incomingNode.removeEventListener("dataSource", callback);
    };
  }, [incomingNode, id, controller]);

  return (
    <div className={`node filter-node ${selected ? "selected" : ""}`}>
      <div>
        <label>Filter</label>
        <div>
          <Select
            className="nodrag"
            onChange={(value) => {
              controller.getNode(id).setData("key", value);
            }}
            data={keys.map((key) => key.name)}
          />

          <Select
            className="nodrag"
            onChange={(value) =>
              controller.getNode(id).setData("operation", value)
            }
            data={[
              {
                label: "EQUALS",
                value: "equals",
              },
              {
                label: "LESS_THAN",
                value: "less_than",
              },
              {
                label: "GREATER_THAN",
                value: "greater_than",
              },
            ]}
          />

          <TextInput
            placeholder="Value"
            onChange={(ev) =>
              controller.getNode(id).setData("value", ev.currentTarget.value)
            }
          />
        </div>
      </div>
      <CustomHandle
        type="target"
        position={Position.Left}
        id="dataSourceInput"
        isConnectable={1}
        title="input"
      />
      <CustomHandle
        type="source"
        position={Position.Right}
        id="a"
        isConnectable={isConnectable}
        title="output"
      />
    </div>
  );
}
