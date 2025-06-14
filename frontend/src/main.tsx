import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./styles/style.css";
import "./styles/dial.css";
import "./styles/tiles.css";
import "./styles/loading.css";
import "./styles/modals.css";
import App from "./app";

createRoot(document.getElementById("root")!).render(
    <StrictMode>
        <App/>
    </StrictMode>
);