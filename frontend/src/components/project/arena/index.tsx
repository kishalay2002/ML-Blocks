import {
  Box,
  Button,
  Flex,
  Tooltip,
  Text,
  Group,
  Stack,
  Tabs,
  Table,
  Image,
} from "@mantine/core";
import {
  IconBox,
  IconCsv,
  IconFile,
  IconJson,
  IconUpload,
} from "@tabler/icons-react";
import { useEffect, useState } from "react";
import { useProjectContext } from "../../../context/projectContext";
import { KernelStatus } from "../../../stores/project";
import { Editor, NodeList } from "../../graph-editor";
import { openFileInputModal } from "../../modals/file-input-modal";
import { useFileSystemContext } from "../../../context/filesystemContext";
import { TFile } from "../../../types";
import { modals } from "@mantine/modals";
import dayjs from "dayjs";

function FileExplorer() {
  const kernelStatus = useProjectContext((state) => state.kernelStatus);
  const kernelId = useProjectContext((state) => state.kernelId);
  const files = useFileSystemContext((state) => state.files);
  const loadFiles = useFileSystemContext((state) => state.load);

  useEffect(() => {
    const abortController = new AbortController();
    if (kernelStatus === KernelStatus.CONNECTED && kernelId != "") {
      loadFiles(kernelId, abortController);
    }
    return () => abortController.abort("FileExplorer component demounted");
  }, [kernelStatus, kernelId, loadFiles]);

  const handleFileDetail = (file: TFile) => {
    modals.open({
      title: file.name,
      centered: true,
      size: "xl",
      withCloseButton: true,
      children: <FileDetail file={file} />,
    });
  };

  return (
    <Flex
      p="sm"
      h="100%"
      direction="column">
      {kernelStatus !== KernelStatus.CONNECTED ? (
        <Flex
          flex={1}
          align="center"
          justify="center">
          <Text
            ta="center"
            size="md"
            c="dimmed">
            You are not connected to python kernel
          </Text>
        </Flex>
      ) : (
        <Stack gap="sm">
          <Group>
            <Button
              leftSection={<IconUpload size={16} />}
              variant="subtle"
              size="xs"
              onClick={() =>
                openFileInputModal((file) => {
                  file;
                }, false)
              }>
              Upload
            </Button>
          </Group>
          <Stack gap="5px">
            {files.map((file) => (
              <Button
                key={file.name}
                variant="subtle"
                justify="flex-start"
                fw="normal"
                color="gray"
                leftSection={
                  file.name.split(".").pop() === "csv" ? (
                    <IconCsv size={24} />
                  ) : (
                    <IconJson size={24} />
                  )
                }
                onClick={() => handleFileDetail(file)}>
                {file.name}
              </Button>
            ))}
          </Stack>
        </Stack>
      )}
    </Flex>
  );
}

function FileDetail({ file }: { file: TFile }) {
  return (
    <Box>
      <Tabs defaultValue="detail">
        <Tabs.List>
          <Tabs.Tab value="detail">Detail</Tabs.Tab>
          <Tabs.Tab value="schema">Schema</Tabs.Tab>
          <Tabs.Tab value="viz">Visualization</Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel
          value="detail"
          pt="lg">
          <Table>
            <Table.Tbody>
              <Table.Tr>
                <Table.Th>Name</Table.Th>
                <Table.Td>{file.name}</Table.Td>
              </Table.Tr>
              <Table.Tr>
                <Table.Th>Size</Table.Th>
                <Table.Td>{file.size} bytes</Table.Td>
              </Table.Tr>
              <Table.Tr>
                <Table.Th>Last Accessed</Table.Th>
                <Table.Td>
                  {dayjs(file.last_accessed / 1000000).format(
                    "HH:mm:ss MMM-DD-YYYY"
                  )}
                </Table.Td>
              </Table.Tr>
              <Table.Tr>
                <Table.Th>Last Modified</Table.Th>
                <Table.Td>
                  {dayjs(file.last_modified / 1000000).format(
                    "HH:mm:ss MMM-DD-YYYY"
                  )}
                </Table.Td>
              </Table.Tr>

              <Table.Tr>
                <Table.Th>Kind</Table.Th>
                <Table.Td>{file.kind}</Table.Td>
              </Table.Tr>

              <Table.Tr>
                <Table.Th>Mode</Table.Th>
                <Table.Td>{file.mode}</Table.Td>
              </Table.Tr>
            </Table.Tbody>
          </Table>
        </Tabs.Panel>

        <Tabs.Panel
          value="schema"
          pt="lg">
          <Table>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Name</Table.Th>
                <Table.Th>Type</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {file.schema.map((col) => (
                <Table.Tr>
                  <Table.Td>{col.name}</Table.Td>
                  <Table.Td>{col.type}</Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </Tabs.Panel>

        <Tabs.Panel
          value="viz"
          pt="lg">
          {file.viz.length === 0 ? (
            <Flex
              align="center"
              justify="center"
              h="320px">
              <Text>No visualization available</Text>
            </Flex>
          ) : (
            file.viz.map((b64, index) => (
              <Stack key={index}>
                <Image
                  src={`data:image/png;base64, ${b64}`}
                  style={{
                    borderRadius: "5px",
                    width: "100%",
                    marginBlock: "10px",
                  }}
                />
              </Stack>
            ))
          )}
        </Tabs.Panel>
      </Tabs>
    </Box>
  );
}

interface SidebarProps {
  size?: number;
}

const sidebarItems = [
  {
    icon: <IconFile size={18} />,
    name: "files",
  },
  {
    icon: <IconBox size={18} />,
    name: "blocks",
  },
];

function Sidebar({ size = 48 }: SidebarProps) {
  const [selected, setSelected] = useState<string>(sidebarItems[0].name);
  const handleButtonClick = (
    _: React.MouseEvent<HTMLButtonElement>,
    id: string
  ) => {
    if (id === selected) {
      setSelected("");
    } else {
      setSelected(id);
    }
  };
  return (
    <Flex
      mt={10}
      ml={10}
      h="calc(100% - 20px)"
      bg="dark.9"
      style={(theme) => ({
        borderRadius: "12px",
        overflow: "hidden",
        boxShadow: theme.shadows.lg,
      })}>
      <Flex
        w={size}
        direction="column">
        {sidebarItems.map(({ icon, name }) => (
          <Tooltip
            label={name}
            position="right"
            openDelay={1000}
            key={name}>
            <Button
              w={size}
              h={size}
              radius="0"
              bg={selected === name ? "blue" : ""}
              color={selected === name ? "white" : ""}
              variant="subtle"
              onClick={(event) => handleButtonClick(event, name)}
              p="0">
              {icon}
            </Button>
          </Tooltip>
        ))}
      </Flex>
      <Box
        style={{
          transition: "all 100ms ease-in-out",
          width: selected === "" ? 0 : "230px",
        }}>
        {selected === "files" && <FileExplorer />}
        {selected === "blocks" && (
          <Box>
            <NodeList />
          </Box>
        )}
      </Box>
    </Flex>
  );
}

function Arena() {
  return (
    <Flex h="100%">
      <Sidebar />
      <Box
        style={{ flex: 1 }}
        p={10}>
        <Editor />
      </Box>
    </Flex>
  );
}

export { Arena };
