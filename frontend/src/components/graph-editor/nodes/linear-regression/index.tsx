import { Handle, NodeProps, Position } from "reactflow";
import "./style.css";
import {
  Box,
  Button,
  Group,
  Image,
  MultiSelect,
  Select,
  Slider,
  Stack,
  Table,
  Text,
  TextInput,
  Tooltip,
} from "@mantine/core";
import { useGraph } from "../../context";
import { TDataSourceSchema } from "../../../../types";
import { useEffect, useRef, useState } from "react";
import { GraphController, GraphNode } from "../../controller";
import { modals } from "@mantine/modals";
import RunButton from "../../run-button";
import { useProjectContext } from "../../../../context/projectContext";
import { useExecutionContext } from "../../../../context/executionContext";
import { IconActivity, IconFileDatabase } from "@tabler/icons-react";
import { client } from "../../../../api";

export default function LinearRegressionNode({
  isConnectable,
  selected,
  id,
}: NodeProps) {
  const { controller } = useGraph();
  const source = useRef<any>(undefined);
  const [schema, setSchema] = useState<TDataSourceSchema>();
  const [incomingNode, setIncomingNode] = useState<GraphNode>();
  const kernelId = useProjectContext((state) => state.kernelId);
  const result = useExecutionContext((state) => state.nodes)[id];
  const executing = useExecutionContext((state) => state.executing);
  const execute = useExecutionContext((state) => state.execute);

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
    console.log(result, executing);
  }, [result, executing]);

  const handleSelectFeature = () => {
    modals.open({
      title: "Select Features",
      centered: true,
      size: "md",
      children: (
        <FeatureSelectionModal
          schema={schema ?? []}
          id={id}
          controller={controller}
        />
      ),
    });
  };

  const handleHyperparameterButton = () => {
    modals.open({
      title: "Tune hyperparameters",
      centered: true,
      size: "md",
      children: (
        <HyperparameterModal
          controller={controller}
          id={id}
        />
      ),
    });
  };

  const handleExecute = () => {
    execute(kernelId, controller, id);
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

  const showInferenceDialog = () => {
    modals.open({
      title: "Inference",
      centered: true,
      size: "lg",
      withCloseButton: true,
      children: (
        <InferenceModal
          result={result}
          kernelId={kernelId}
          modelNodeId={id}
          controller={controller}
          schema={schema}
        />
      ),
    });
  };

  return (
    <div
      className={`node linear-regression-node ${selected ? "selected" : ""}`}>
      {kernelId && schema && (
        <RunButton
          onClick={handleExecute}
          disabled={executing}
        />
      )}

      <Group
        justify="space-between"
        align="center">
        <label>Linear Regression</label>
        <Group gap="5px">
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
          {result && result.stream_text && (
            <Tooltip
              label="infer"
              position="left">
              <Button
                variant="light"
                size="xs"
                className="nodrag"
                onClick={showInferenceDialog}
                h="28"
                w="28"
                p="0">
                <IconActivity size={12} />
              </Button>
            </Tooltip>
          )}
        </Group>
      </Group>

      <Stack
        mt="sm"
        gap="xs">
        <Button
          size="xs"
          w="100%"
          disabled={!schema}
          onClick={handleSelectFeature}>
          Select Features
        </Button>
        <Button
          size="xs"
          w="100%"
          disabled={!schema}
          onClick={handleHyperparameterButton}>
          Hyperparameters
        </Button>
      </Stack>

      <Handle
        type="target"
        position={Position.Left}
        id="a"
        isConnectable={isConnectable}
        title="dataset"
      />
    </div>
  );
}

function FeatureSelectionModal({
  schema,
  id,
  controller,
}: {
  schema: TDataSourceSchema;
  id: string;
  controller: GraphController;
}) {
  const [x, setX] = useState<string[]>(
    controller.getNode(id).getData("x") ?? []
  );
  const [y, setY] = useState<string>(controller.getNode(id).getData("y") ?? "");

  return (
    <Box>
      <Stack>
        <Group>
          <Text>X: </Text>
          <MultiSelect
            value={x}
            data={schema.map(({ name }) => name)}
            placeholder="Select x features"
            onChange={(values) => {
              setX(values);
              controller.getNode(id).setData("x", values);
            }}
            flex={1}
            clearable
          />
        </Group>

        <Group>
          <Text>Y: </Text>
          <Select
            value={y}
            data={schema.map(({ name }) => name)}
            placeholder="Select y feature"
            onChange={(value) => {
              value = value ?? "";
              setY(value);
              controller.getNode(id).setData("y", value);
            }}
            flex={1}
          />
        </Group>
      </Stack>
      <Group
        justify="flex-end"
        mt="lg">
        <Button
          size="sm"
          onClick={() => modals.closeAll()}>
          Done
        </Button>
      </Group>
    </Box>
  );
}

function HyperparameterModal({
  controller,
  id,
}: {
  controller: GraphController;
  id: string;
}) {
  return (
    <Box>
      <Stack mb="25px">
        <Group pt="25px">
          <Text>Test size: </Text>
          <Slider
            flex={1}
            max={100}
            defaultValue={50}
            color="blue"
            step={1}
            label={(value) => value.toFixed(1) + "%"}
            onChange={(value) =>
              controller.getNode(id).setData("hyp/testSize", value)
            }
          />
        </Group>
      </Stack>
      <Group justify="flex-end">
        <Button
          size="sm"
          onClick={() => modals.closeAll()}>
          Done
        </Button>
      </Group>
    </Box>
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
    const { model_prediction, score } = JSON.parse(
      result.stream_text.trim().replaceAll("'", '"')
    );
    return (
      <Stack>
        <Image
          src={`data:image/jpeg;base64, ${model_prediction}`}
          style={{ borderRadius: "5px" }}
        />
        <Table>
          <Table.Tbody>
            <Table.Tr>
              <Table.Th>Accuracy</Table.Th>
              <Table.Td>{(score * 100).toFixed(2)}%</Table.Td>
            </Table.Tr>
          </Table.Tbody>
        </Table>
      </Stack>
    );
  }
}

function InferenceModal({
  kernelId,
  modelNodeId,
  controller,
  schema,
}: {
  kernelId: string;
  result: any;
  modelNodeId: string;
  controller: GraphController;
  schema?: TDataSourceSchema;
}) {
  const [inputs, setInputs] = useState<any[]>([]);
  const [x, setX] = useState<string[]>([]);
  const [y, setY] = useState<string[]>([]);
  const [inference, setInference] = useState<any[] | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const abortController = useRef<AbortController>();

  useEffect(() => {
    setX(controller.getNode(modelNodeId).getData("x"));
    setY([controller.getNode(modelNodeId).getData("y")]);
  }, [controller, modelNodeId]);

  useEffect(() => {
    return () => {
      abortController.current?.abort("InferenceModal demounted");
    };
  }, []);

  const handleInferButton = () => {
    // convert inputs to proper type
    const convertedInputs = inputs.map((input, index) => {
      const type = schema?.find(({ name }) => x[index] === name)?.type;
      switch (type) {
        case "float64":
          input = Number.parseFloat(input);
          break;
        case "int32":
        case "int64":
          input = Number.parseInt(input);
          break;
      }
      return input;
    });

    setLoading(true);

    abortController.current?.abort("new_inference");
    abortController.current = new AbortController();

    client
      .post(
        `/tunnel/${kernelId}/execute/${modelNodeId}/infer`,
        {
          graph: controller.export(),
          inputs: convertedInputs,
        },
        {
          signal: abortController.current.signal,
        }
      )
      .then(({ data, status }) => {
        if (status !== 200) {
          throw new Error(`Server returned with status code ${status}`);
        }

        const output = JSON.parse(data[modelNodeId].stream_text.trim());
        setInference(output);
      })
      .catch((err) => {
        console.error(err);
      })
      .finally(() => {
        setLoading(false);
      });
  };

  if (!schema) {
    modals.closeAll();
  }

  return (
    <Box>
      <Table>
        <Table.Tbody>
          {x.map((name: string, index) => (
            <Table.Tr key={name}>
              <Table.Td>{name}</Table.Td>
              <Table.Td>
                <TextInput
                  value={inputs[index] ?? ""}
                  onChange={(ev) => {
                    const value = ev.currentTarget.value;
                    setInputs((prev) => {
                      const arr = [...prev];
                      arr[index] = value;
                      return arr;
                    });
                  }}
                  placeholder={
                    schema?.find(({ name: _name }) => name === _name)?.type ??
                    ""
                  }
                />
              </Table.Td>
            </Table.Tr>
          ))}
        </Table.Tbody>
      </Table>

      {inference && (
        <Box mt="lg">
          <Text
            size="lg"
            fw="bold">
            Prediction
          </Text>
          <Table>
            <Table.Tbody>
              {inference.map((result, index) => (
                <Table.Tr key={index}>
                  <Table.Th>{y[index]}</Table.Th>
                  <Table.Td>{result}</Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </Box>
      )}

      <Group
        justify="flex-end"
        mt="lg">
        <Button
          size="xs"
          onClick={handleInferButton}
          loading={loading}>
          Infer
        </Button>
      </Group>
    </Box>
  );
}
