import {createBrowserRouter, RouterProvider} from "react-router-dom";
import {LandingPage} from "../pages/LandingPage.tsx";
import {ProjectPage} from "../pages/ProjectPage.tsx";

const router = createBrowserRouter([
    {
        path: "/",
        element: <LandingPage />,
    },
    {
        path: "/project/:id",
        element: <ProjectPage />
    }
]);

function Router() {
    return <RouterProvider router={router} />;
}

export { Router };