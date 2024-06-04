import { Box, Button, Flex, Text } from "@mantine/core";
import { useProjectContext } from "../../../context/projectContext";

function getStatusColor(status: string) {
  switch (status) {
    case "connected":
      return "green";
    case "disconnecting":
    case "connecting":
      return "yellow";
    default:
      return "red";
  }
}

function KernelControl() {
  const status = useProjectContext((state) => state.kernelStatus);
  const connectKernel = useProjectContext((state) => state.connect);
  const disconnectKernel = useProjectContext((state) => state.disconnect);

  return (
    <Flex
      gap="sm"
      align="center">
      <Box
        h="8px"
        w="8px"
        bg={getStatusColor(status)}
        style={{ borderRadius: "100%" }}
      />
      <Text>{status}</Text>
      {!status.startsWith("connect") ? (
        <Button
          onClick={connectKernel}
          disabled={status === "disconnecting"}>
          connect
        </Button>
      ) : (
        <Button
          disabled={status !== "connected"}
          onClick={disconnectKernel}>
          disconnect
        </Button>
      )}
    </Flex>
  );
}

export { KernelControl };
