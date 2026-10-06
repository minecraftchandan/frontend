import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { RouterProvider } from "@tanstack/react-router";
import { getRouter } from "../src/router";

import "../src/styles.css";
import "../inspector-portal/src/styles/global.css";

const rootElement = document.getElementById("root");
if (!rootElement) throw new Error("Android app root element is missing.");

const router = getRouter();

createRoot(rootElement).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
);
