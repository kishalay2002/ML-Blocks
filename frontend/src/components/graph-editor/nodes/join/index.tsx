import { Handle, NodeProps, Position } from "reactflow";
import "./style.css";
import { useEffect, useRef, useState } from "react";
import { GraphNode } from "../../controller";
import { useGraph } from "../../context";
import { Select } from "@mantine/core";
import { TDataSourceSchema } from "../../../../types";

function findUniqueKeysFromSchemas(schemas: TDataSourceSchema[]) {
  if (schemas.length === 0) return [];

  let keys: TDataSourceSchema = schemas[0];

  for (let i = 1; i < schemas.length; i++)
    keys = keys.filter((k) => schemas[i].find(({ name }) => name === k.name));

  return keys;
}

function combineSchemas(schemas: TDataSourceSchema[]): any {
  const unique = new Set<string>();
  const nameType: any = {};
  for (const schema of schemas) {
    for (const item of schema) {
      nameType[item.name] = item.type;
      unique.add(item.name);
    }
  }
  return Array.from(unique.values()).map((name) => ({
    name,
    type: nameType[name],
  }));
}

export default function JoinNode({ id, isConnectable, selected }: NodeProps) {
  const { controller } = useGraph();
  const sources = useRef<{ [key: string]: { schema: TDataSourceSchema } }>({});
  const [incomingNodes, setIncomingNodes] = useState<GraphNode[]>([]);
  const [keys, setKeys] = useState<TDataSourceSchema>([]);
  const [key, setKey] = useState<string | undefined>(undefined);

  useEffect(() => {
    return controller.subscribe(id, (node) => {
      const nodes: GraphNode[] = [];
      node.getIncomingNodes().forEach((id) => {
        nodes.push(controller.getNode(id));
      });
      setIncomingNodes(nodes);
    });
  }, [id, controller]);

  useEffect(() => {
    if (incomingNodes.length === 0) {
      setKeys([]);
    }

    sources.current = {};

    const callback = ({ detail }: any) => {
      sources.current[detail.nodeId] = detail;
      setKeys(
        findUniqueKeysFromSchemas(
          Object.values(sources.current).map((val) => val.schema)
        )
      );
    };

    // fetch initial data
    incomingNodes.forEach((node) => {
      const source = node.getData("dataSource");
      if (!source) return;
      sources.current[node.id] = source;
    });

    if (Object.keys(sources.current).length > 0) {
      setKeys(
        findUniqueKeysFromSchemas(
          Object.values(sources.current).map((val) => val.schema)
        )
      );
    }

    // listen for changes in incoming nodes
    incomingNodes.forEach((node) =>
      node.addEventListener("dataSource", callback)
    );

    // stop listening for changes on unmount
    return () => {
      incomingNodes.forEach((node) => {
        node.removeEventListener("dataSource", callback);
      });
    };
  }, [incomingNodes]);

  useEffect(() => {
    if (key === undefined || !sources.current) return;
    const schema = combineSchemas(
      Object.values(sources.current).map((v) => v.schema)
    );
    controller.getNode(id).setData("dataSource", { schema });
    controller.getNode(id).setData("key", key);
  }, [key, keys, id, controller]);

  return (
    <div className={`node join-node ${selected ? "selected" : ""}`}>
      <label>Join Data Source</label>
      <Select
        className="nodrag"
        value={key}
        onChange={(value) => setKey(value ?? "")}
        placeholder="Field"
        data={keys.map((key) => key.name)}
      />
      <Handle
        type="source"
        position={Position.Right}
        id="output"
        isConnectable={isConnectable}
        title="merged content"
      />
      <Handle
        type="target"
        position={Position.Left}
        id="input"
        title="sources"
      />
    </div>
  );
}
