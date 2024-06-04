/* eslint-disable react-refresh/only-export-components */
import {
  Alert,
  Box,
  Button,
  Flex,
  Group,
  rem,
  ScrollArea,
  Stack,
  Tabs,
  Text,
  TextInput,
} from "@mantine/core";
import { Dropzone } from "@mantine/dropzone";
import { modals } from "@mantine/modals";
import {
  IconDatabase,
  IconFile,
  IconInfoCircle,
  IconLink,
  IconNetworkOff,
  IconUpload,
  IconX,
} from "@tabler/icons-react";
import { useRef, useState } from "react";
import { useProjectContext } from "../../../context/projectContext";
import { useFileSystemContext } from "../../../context/filesystemContext";
import { TFile } from "../../../types";
import { KernelStatus } from "../../../stores/project";

interface Props {
  onSelect?: (fileId: TFile) => void;
  enableBrowse?: boolean;
}

const FILE_INPUT_MODAL_ID = "file_input_modal";

function FileInputModal({ onSelect, enableBrowse = true }: Props) {
  const kernelId = useProjectContext((state) => state.kernelId);
  const kernelStatus = useProjectContext((state) => state.kernelStatus);
  const [file, setFile] = useState<File | null>(null);
  const [url, setUrl] = useState<string>("");
  const [uploading, setUploading] = useState<boolean>(false);
  const abortController = useRef<AbortController>(new AbortController());
  const files = useFileSystemContext((state) => state.files);
  const uploadFile = useFileSystemContext((state) => state.uploadFile);
  const uploadFromUrl = useFileSystemContext((state) => state.uploadFromUrl);

  const handleUploadFile = async (file: File) => {
    abortController.current.abort("START_UPLOAD");
    abortController.current = new AbortController();
    const uploadedFile = await uploadFile(
      kernelId,
      file,
      abortController.current
    );

    if (onSelect) {
      onSelect(uploadedFile);
      modals.closeAll();
    }
  };

  const handleUploadFromUrl = async (url: string) => {
    abortController.current.abort("START_UPLOAD");
    abortController.current = new AbortController();
    const uploadedFile = await uploadFromUrl(
      kernelId,
      url,
      abortController.current
    );

    if (onSelect) {
      onSelect(uploadedFile);
      modals.closeAll();
    }
  };

  const handleUpload = async () => {
    setUploading(true);

    let result: Promise<void> | null = null;
    if (file !== null) {
      result = handleUploadFile(file);
    } else if (url !== null) {
      result = handleUploadFromUrl(url);
    } else {
      console.error(
        "Reached an undesirable state, file and url are both not set when upload button was clicked"
      );
    }

    try {
      if (result) await result;
    } finally {
      setUploading(false);
    }
  };

  if (kernelStatus !== KernelStatus.CONNECTED) {
    return (
      <Flex
        h="360px"
        align="center"
        justify="center"
        direction="column"
        gap="lg">
        <IconNetworkOff size={32} />
        <Text>Kernel Disconnected</Text>
      </Flex>
    );
  }

  return (
    <Box>
      <Tabs defaultValue="upload">
        <Tabs.List>
          <Tabs.Tab
            value="upload"
            leftSection={<IconUpload />}>
            Upload
          </Tabs.Tab>
          {enableBrowse && (
            <Tabs.Tab
              value="browse"
              leftSection={<IconFile />}>
              Browse
            </Tabs.Tab>
          )}
        </Tabs.List>

        <Tabs.Panel value="upload">
          <Stack>
            <Dropzone
              onDrop={(files) => setFile(files[0])}
              accept={["application/json", "text/csv"]}
              maxFiles={1}
              maxSize={300 * 1024 * 1024}
              style={{ cursor: "pointer" }}
              disabled={uploading}>
              <Group
                justify="center"
                gap="xl"
                mih={220}
                style={{ pointerEvents: "none" }}>
                <Dropzone.Accept>
                  <IconUpload
                    style={{
                      width: rem(52),
                      height: rem(52),
                      color: "var(--mantine-color-blue-6)",
                    }}
                    stroke={1.5}
                  />
                </Dropzone.Accept>
                <Dropzone.Reject>
                  <IconX
                    style={{
                      width: rem(52),
                      height: rem(52),
                      color: "var(--mantine-color-red-6)",
                    }}
                    stroke={1.5}
                  />
                </Dropzone.Reject>
                <Dropzone.Idle>
                  <IconDatabase
                    style={{
                      width: rem(52),
                      height: rem(52),
                      color: "var(--mantine-color-dimmed)",
                    }}
                    stroke={1.5}
                  />
                </Dropzone.Idle>

                <div>
                  <Text
                    size="xl"
                    inline>
                    Drag dataset here or click to select file
                  </Text>
                  <Text
                    size="sm"
                    c="dimmed"
                    inline
                    mt={7}>
                    Upload your dataset, it should not exceed 300mb
                  </Text>
                </div>
              </Group>
            </Dropzone>
            <Text ta="center">OR</Text>

            <TextInput
              placeholder="Link to your dataset (faster)"
              leftSection={<IconLink />}
              value={url}
              onChange={(ev) => setUrl(ev.currentTarget.value)}
              disabled={uploading}
            />

            <Alert
              color="yellow"
              icon={<IconInfoCircle />}>
              Your files will be lost when the kernel is disconnected, make sure
              you have it stored somewhere safe.
            </Alert>

            <Group justify="right">
              <Button
                leftSection={<IconUpload size={16} />}
                disabled={file === null && url === ""}
                loading={uploading}
                onClick={handleUpload}>
                Upload
              </Button>
            </Group>
          </Stack>
        </Tabs.Panel>

        {enableBrowse && (
          <Tabs.Panel value="browse">
            {files.length === 0 ? (
              <Flex
                align="center"
                justify="center"
                mih="320px">
                You don't have any file
              </Flex>
            ) : (
              <ScrollArea
                h="360px"
                mih="360px"
                mah="360px"
                py="lg">
                <Stack gap="5px">
                  {files.map((file) => (
                    <Button
                      key={file.name}
                      variant="subtle"
                      justify="flex-start"
                      onClick={() => {
                        if (onSelect) onSelect(file);
                        modals.closeAll();
                      }}>
                      {file.name}
                    </Button>
                  ))}
                </Stack>
              </ScrollArea>
            )}
          </Tabs.Panel>
        )}
      </Tabs>
    </Box>
  );
}

function openFileInputModal(
  onSelect?: (file: TFile) => void,
  enableBrowse: boolean = true
) {
  modals.open({
    title: "File Manager",
    centered: true,
    size: "lg",
    id: FILE_INPUT_MODAL_ID,
    children: (
      <FileInputModal
        onSelect={onSelect}
        enableBrowse={enableBrowse}
      />
    ),
  });
}

export { openFileInputModal };
