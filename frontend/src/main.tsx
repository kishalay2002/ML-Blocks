import ReactDOM from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { createTheme, MantineProvider } from "@mantine/core";

const theme = createTheme({});

ReactDOM.createRoot(document.getElementById("root")!).render(
  // <React.StrictMode>
  <MantineProvider
    theme={theme}
    withCssVariables
    defaultColorScheme="dark">
    <App />
  </MantineProvider>
  // </React.StrictMode>,
);
