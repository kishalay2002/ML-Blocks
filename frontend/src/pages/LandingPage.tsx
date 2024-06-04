import {
  Anchor,
  Box,
  Button,
  Container,
  Flex,
  Group,
  Image,
  Text,
  useMantineTheme,
} from "@mantine/core";
import classes from "./LandingPage.module.css";
import { Icon3dCubeSphere, IconNewSection } from "@tabler/icons-react";
import dayjs from "dayjs";
import { Link } from "react-router-dom";
import { useProjects } from "../hooks/useProjects.tsx";
import logo from "../assets/logo.png";

function LandingPage() {
  const theme = useMantineTheme();
  const { projects, createNewProject } = useProjects();

  const handleOnNewProject = async () => {
    await createNewProject();
  };

  return (
    <Flex
      align="center"
      justify="center"
      mih="100vh">
      <Container
        className={classes.container}
        style={{ position: "relative" }}>
        <Image
          src={logo}
          alt="Logo"
          w="72px"
          style={{
            position: "absolute",
            top: "-36px",
            left: "50%",
            transform: "translateX(-50%)",
          }}
        />
        <Text fw="bold">Browse Projects</Text>
        {projects.length === 0 ? (
          <Flex
            h="240px"
            align="center"
            justify={"center"}
            rowGap={"1rem"}
            direction={"column"}>
            <Icon3dCubeSphere
              size={"4rem"}
              color={theme.colors.dark[2]}
            />
            <Text c="dimmed">
              Get started by creating a{" "}
              <Text
                span
                fw="bold">
                new project
              </Text>
            </Text>
          </Flex>
        ) : (
          <Flex
            h="320px"
            direction="column"
            gap="lg"
            my="12px"
            style={{ overflowY: "auto" }}>
            {projects.map((project) => (
              <Flex
                key={project.id}
                className={classes.projectItem}
                align="center"
                gap="12px">
                <Box>
                  <Box
                    w="8px"
                    h="8px"
                    style={{ borderRadius: "100%" }}
                    bg={project.kernel_url === null ? "red" : "green"}
                    mx="auto"
                    title={
                      project.kernel_url ? "Kernel active" : "Kernel inactive"
                    }
                  />
                </Box>
                <Box flex={1}>
                  <Anchor
                    component={Link}
                    to={`/project/${project.id}`}>
                    {project.name}
                  </Anchor>
                  <Text
                    size="xs"
                    c="dimmed"
                    mt="5px">
                    Last updated:{" "}
                    {dayjs(project.updated_at).format("DD-MMM-YYYY HH:mm:ss")}
                  </Text>
                </Box>
              </Flex>
            ))}
          </Flex>
        )}
        <Group
          gap={"xs"}
          justify={"end"}>
          <Button
            leftSection={<IconNewSection />}
            onClick={handleOnNewProject}>
            New Project
          </Button>
        </Group>
      </Container>
    </Flex>
  );
}

export { LandingPage };
