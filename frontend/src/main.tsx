import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router";
import "./styles/style.css";
import "./styles/header.css";
import "./styles/inputs.css";
import "./styles/dial.css";
import "./styles/tiles.css";
import "./styles/modals.css";
import "./styles/settings.css";
import App from "./app";

createRoot(document.getElementById("root")!).render(
    <StrictMode>
        <BrowserRouter>
            <App/>
        </BrowserRouter>
    </StrictMode>
);