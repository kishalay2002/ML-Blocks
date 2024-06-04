import { Button, Stack } from "@mantine/core";
import { nodeTypeList } from "./node-types";

function NodeList() {
  return (
    <Stack
      gap="5px"
      p="md">
      {nodeTypeList.map(({ id: type, name }) => (
        <Button
          key={type}
          draggable
          onDragStart={(ev) => {
            ev.dataTransfer.setData("text/plain", type);
          }}
          variant="subtle">
          {name}
        </Button>
      ))}
    </Stack>
  );
}

export { NodeList };
