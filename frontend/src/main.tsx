import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./styles/style.css";
import "./styles/header.css";
import "./styles/inputs.css";
import "./styles/dial.css";
import "./styles/tiles.css";
import "./styles/modals.css";
import "./styles/settings.css";
import "./styles/view_transitions.css";
import App from "./app";

export const initAppLoad = new Date().getTime();

createRoot(document.getElementById("root")!).render(
    <StrictMode>
        <App/>
    </StrictMode>
);