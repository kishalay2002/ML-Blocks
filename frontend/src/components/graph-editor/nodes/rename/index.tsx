import { Handle, NodeProps, Position } from "reactflow";
import "./style.css";
import CustomHandle from "../CustomHandle";
import { useEffect, useRef, useState } from "react";
import { GraphNode } from "../../controller";
import { useGraph } from "../../context";
import { TDataSourceSchema } from "../../../../types";
import { Box, Flex, Select, TextInput } from "@mantine/core";
import { IconArrowsLeftRight } from "@tabler/icons-react";
// import RunButton from "../../RunButton";

export default function RenameNode({ id, isConnectable, selected }: NodeProps) {
  const { controller } = useGraph();
  const source = useRef<any>(undefined);
  const [schema, setSchema] = useState<TDataSourceSchema>();
  const [incomingNode, setIncomingNode] = useState<GraphNode>();
  const [selectedKey, setSelectedKey] = useState<string | undefined>();
  const [updatedKeyValue, setUpdatedKeyValue] = useState<string>("");
  const [error, setError] = useState<string>();

  useEffect(() => {
    return controller.subscribe(id, (node) => {
      const nodes: GraphNode[] = [];
      node.getIncomingNodes().forEach((id) => {
        nodes.push(controller.getNode(id));
      });
      setIncomingNode(nodes.length > 0 ? nodes[0] : undefined);
    });
  }, [id, controller]);

  useEffect(() => {
    if (incomingNode === undefined) {
      setSchema(undefined);
      setSelectedKey("");
      setUpdatedKeyValue("");
      return;
    }

    // fetch initial data
    source.current = incomingNode.getData("dataSource");

    if (source.current) {
      setSchema(source.current.schema);
    }

    const callback = ({ detail }: any) => {
      source.current = detail;
      setSchema(detail.schema);
    };

    incomingNode.addEventListener("dataSource", callback);

    return () => {
      if (incomingNode)
        incomingNode.removeEventListener("dataSource", callback);
    };
  }, [incomingNode]);

  useEffect(() => {
    if (!schema) return;

    const newKey = updatedKeyValue?.trim();
    if (!newKey || !selectedKey) return;

    setError("");

    if (schema.find(({ name }) => name === newKey)) {
      setError("key already exists in the schema");
      return;
    }

    const newSchema = structuredClone(schema);
    const idx = schema.findIndex(({ name }) => selectedKey === name);
    newSchema[idx].name = newKey;

    controller.getNode(id).setData("dataSource", {
      ...source.current,
      nodeId: id,
      schema: newSchema,
    });

    controller.getNode(id).setData("from", selectedKey);
    controller.getNode(id).setData("to", updatedKeyValue);
  }, [updatedKeyValue, selectedKey, schema, id, controller]);

  return (
    <div className={`node rename-node ${selected ? "selected" : ""}`}>
      {/* {schema && <RunButton />} */}

      <div className="header">
        <label>Rename Column</label>
      </div>
      <div className="input">
        <Select
          data={
            schema
              ? schema.map(({ name }) => ({ value: name, label: name }))
              : []
          }
          placeholder="From"
          disabled={schema === undefined}
          onChange={(value) => setSelectedKey(value ?? "")}
          className="nodrag"
        />
        <Flex
          c="dimmed"
          align={"center"}>
          <IconArrowsLeftRight size={16} />
        </Flex>
        <TextInput
          placeholder="to"
          disabled={schema === undefined}
          className="nodrag"
          value={updatedKeyValue}
          onChange={(ev) => setUpdatedKeyValue(ev.currentTarget.value)}
        />
      </div>
      {error && (
        <Flex
          align="center"
          gap="1ch">
          <Box
            h={8}
            w={8}
            display="inline-block"
            style={(theme) => ({
              borderRadius: "50%",
              background: theme.colors.red[5],
            })}
          />{" "}
          {error}
        </Flex>
      )}
      <Handle
        type="source"
        position={Position.Right}
        id="output"
        isConnectable={isConnectable}
        title="content"
      />

      <CustomHandle
        type="target"
        position={Position.Left}
        id="input"
        isConnectable={1}
        title="input"
      />
    </div>
  );
}
