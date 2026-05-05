import "./bootstrap";
import "../css/app.css";

import React from "react";
import { createRoot } from "react-dom/client";
import KiddoApp from "./kiddo/kiddo";

const container = document.getElementById("app");

if (container) {
    const root = createRoot(container);
    root.render(
        <React.StrictMode>
            <KiddoApp />
        </React.StrictMode>,
    );
}
