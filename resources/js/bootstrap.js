/**
 * Global axios bootstrap.
 *
 * Fixes vs the previous version:
 *  - Reads the CSRF token from the <meta name="csrf-token"> tag we
 *    now emit in app.blade.php and signs every request. Without
 *    this every POST eventually returns 419 (Page expired) once
 *    the user's session token rotates.
 *  - Drops the `window.axios = axios` assignment. Sticking
 *    third-party libs on `window` is an anti-pattern that makes
 *    them impossible to tree-shake and bypasses module isolation.
 *    Code that needs axios should `import axios from 'axios'`.
 *  - Adds a 401 response interceptor so any background API call
 *    that hits an expired session redirects the user to /login
 *    instead of swallowing the error silently.
 *  - Adds a 419 response interceptor that retries ONCE with a
 *    freshly-fetched CSRF cookie, so single-page sessions that
 *    have been idle for a while don't surprise users with errors.
 */

import axios from "axios";

const CSRF_META_SELECTOR = 'meta[name="csrf-token"]';

const readCsrf = () => {
    if (typeof document === "undefined") return "";
    const meta = document.querySelector(CSRF_META_SELECTOR);
    if (meta?.content) return meta.content;
    const cookieMatch = (document.cookie || "").match(/XSRF-TOKEN=([^;]+)/);
    return cookieMatch ? decodeURIComponent(cookieMatch[1]) : "";
};

axios.defaults.headers.common["X-Requested-With"] = "XMLHttpRequest";
axios.defaults.headers.common["Accept"] = "application/json";
axios.defaults.withCredentials = true;

const initialToken = readCsrf();
if (initialToken) {
    axios.defaults.headers.common["X-CSRF-TOKEN"] = initialToken;
}

// Re-read the CSRF token on every request so a token rotation in
// the background (e.g. after `Auth::login`) is picked up
// automatically by the *next* request without a full page reload.
axios.interceptors.request.use((config) => {
    const token = readCsrf();
    if (token) {
        config.headers = config.headers || {};
        config.headers["X-CSRF-TOKEN"] = token;
    }
    return config;
});

axios.interceptors.response.use(
    (response) => response,
    async (error) => {
        const status = error?.response?.status;

        // 401 Unauthorized: session expired — bounce to login page.
        if (status === 401 && typeof window !== "undefined") {
            const here = window.location.pathname + window.location.search;
            // Avoid infinite redirect loop when /login itself 401s.
            if (!here.startsWith("/login")) {
                window.location.assign(
                    `/login?next=${encodeURIComponent(here)}`,
                );
            }
        }

        // 419 (Laravel CSRF mismatch): the session token has rotated.
        // Fetch a fresh page (via fetch HEAD on /) so Laravel sets a
        // new XSRF-TOKEN cookie, then retry the original request once.
        // This keeps long-idle parents from getting an opaque error.
        if (status === 419 && !error.config?.__csrfRetried) {
            try {
                await fetch("/", {
                    method: "GET",
                    credentials: "same-origin",
                    headers: { Accept: "text/html" },
                }).catch(() => {});
                error.config.__csrfRetried = true;
                error.config.headers = {
                    ...(error.config.headers || {}),
                    "X-CSRF-TOKEN": readCsrf(),
                };
                return axios.request(error.config);
            } catch (_) {
                /* fall through to reject */
            }
        }

        return Promise.reject(error);
    },
);

export default axios;
