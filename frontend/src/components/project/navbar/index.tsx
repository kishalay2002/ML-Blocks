import { Anchor, Box, Flex, Image, TextInput } from "@mantine/core";
import icon from "../../../assets/logo.png";
import classes from "./navbar.module.css";
import { KernelControl } from "./KernelControl";
import { useProjectContext } from "../../../context/projectContext";

function Navbar() {
  const project = useProjectContext((state) => state.project);

  return (
    <Flex
      py="sm"
      px="lg"
      align="center"
      gap="20px"
      bg="dark.9">
      <Anchor href="/">
        <Image
          src={icon}
          alt="MLBlocks"
          w="64px"
        />
      </Anchor>
      <Flex
        align="center"
        justify="space-between"
        flex={1}>
        <TextInput
          size="lg"
          defaultValue={project.name}
          styles={{
            input: {
              backgroundColor: "transparent",
              width: "320px",
            },
          }}
          className={classes.projectName}
        />
        <Box>
          <KernelControl />
        </Box>
      </Flex>
    </Flex>
  );
}

export { Navbar };
