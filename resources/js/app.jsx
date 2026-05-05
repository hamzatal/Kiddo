import "./bootstrap";
import "../css/app.css";

import React from "react";
import { createRoot } from "react-dom/client";
import { createInertiaApp } from "@inertiajs/react";
import { resolvePageComponent } from "laravel-vite-plugin/inertia-helpers";

createInertiaApp({
    // تأكد إن المسار هون بطابق مكان مجلد الشاشات عندك
    resolve: (name) =>
        resolvePageComponent(
            `./kiddo/screens/${name}.jsx`,
            import.meta.glob("./kiddo/screens/**/*.jsx"),
        ),
    setup({ el, App, props }) {
        const root = createRoot(el);
        root.render(<App {...props} />);
    },
});
