import { useEffect, useState } from "react";
import { Handle, NodeProps, Position } from "reactflow";
import "./style.css";
import { useGraph } from "../../context";
import { Box, Button, Group, Text, Tooltip } from "@mantine/core";
import { openFileInputModal } from "../../../modals/file-input-modal";
import { TFile } from "../../../../types";
import { useExecutionContext } from "../../../../context/executionContext";
import { IconFileDatabase } from "@tabler/icons-react";
import { modals } from "@mantine/modals";
import { useFileSystemContext } from "../../../../context/filesystemContext";

export default function DataSourceNode({
  id,
  isConnectable,
  selected,
}: NodeProps) {
  const { controller } = useGraph();
  const [file, setFile] = useState<TFile>();
  const result = useExecutionContext((state) => state.nodes)[id];
  const files = useFileSystemContext((state) => state.files);

  useEffect(() => {
    if (file) return;
    const filename = controller.getNode(id).getData("file");
    if (filename) {
      const file = files.find(({ name }) => name === filename);
      if (!file) return;
      setFile(file);
      controller.getNode(id).setData("dataSource", {
        nodeId: id,
        filename: file.name,
        schema: file.schema,
      });
    }
  }, [controller, id, files, file]);

  const onFileSelect = (file: TFile) => {
    setFile(file);
    controller.getNode(id).setData("dataSource", {
      nodeId: id,
      filename: file.name,
      schema: file.schema,
    });

    controller.getNode(id).setData("file", file.name);
  };

  const showOutput = () => {
    modals.open({
      title: "Output",
      centered: true,
      size: "lg",
      withCloseButton: true,
      children: <OutputModal result={result} />,
    });
  };

  return (
    <div className={`node datasource-node ${selected ? "selected" : ""}`}>
      <div>
        <Group
          align="center"
          justify="space-between">
          <label>Data Source</label>
          <Box>
            {result && (
              <Tooltip
                label="output"
                position="left">
                <Button
                  variant="light"
                  size="xs"
                  className="nodrag"
                  onClick={showOutput}
                  h="28"
                  w="28"
                  p="0">
                  <IconFileDatabase size={12} />
                </Button>
              </Tooltip>
            )}
          </Box>
        </Group>
        {file && (
          <Box style={(theme) => ({ borderRadius: theme.radius.sm })}>
            <Text c="dimmed">{file.name}</Text>
          </Box>
        )}
        <Button
          size="xs"
          variant="light"
          className="nodrag"
          onClick={() => openFileInputModal(onFileSelect)}>
          Select
        </Button>
      </div>
      <Handle
        type="source"
        position={Position.Right}
        id="output"
        isConnectable={isConnectable}
        title="json content"
      />
    </div>
  );
}

function OutputModal({ result }: { result: any }) {
  if (result === null) {
    modals.closeAll();
    return null;
  }

  if (result.error) {
    return <pre>{result.error}</pre>;
  }

  if (result.stream_text) {
    return <pre>{result.stream_text}</pre>;
  }
}
