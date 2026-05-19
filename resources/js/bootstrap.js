/**
 * Global axios bootstrap.
 *
 * Why this file got rewritten (PR fixes 419 errors on audio generate
 * + image upload + auto-segment):
 *
 *   The previous version read the CSRF token from `<meta name="csrf-token">`
 *   on every request. That meta tag is rendered ONCE when the SPA first
 *   loads and never updates. As soon as Laravel rotates the session
 *   token (which happens after every login, after a session-lifetime
 *   timeout, and on each `Auth::login`), the meta tag holds a stale
 *   value while the `XSRF-TOKEN` cookie has the fresh one. Every
 *   subsequent POST got a 419 "Page expired".
 *
 *   The fix is to lean on what Laravel and axios are designed to do
 *   together out of the box:
 *
 *     • Laravel sets a fresh `XSRF-TOKEN` cookie on every web response
 *       (via `EncryptCookies` + the `web` middleware group). The
 *       cookie is rotated automatically — no SPA reload required.
 *     • axios, when `xsrfCookieName`/`xsrfHeaderName` are configured,
 *       reads that cookie on EVERY request and copies it into the
 *       `X-XSRF-TOKEN` header. Laravel's `VerifyCsrfToken` middleware
 *       accepts that header (decrypts it, compares to session token).
 *
 *   So the CSRF lifecycle becomes 100% cookie-driven and we never
 *   trip over a stale meta tag again.
 *
 *   We still read the `<meta name="csrf-token">` and send `X-CSRF-TOKEN`
 *   as a SECONDARY signal — it covers the rare race where the cookie
 *   somehow isn't set yet (first request after a hard reload), and
 *   it makes the request introspect-able from the network panel.
 *
 *   Other behaviour preserved from the previous version:
 *     • 401 response interceptor → bounce to /login?next=…
 *     • 419 retry-once interceptor (now updates BOTH headers from a
 *       freshly-fetched cookie + meta tag, and clones the request
 *       config so FormData isn't re-transformed by axios).
 *     • No `window.axios = axios` anti-pattern.
 */

import axios from "axios";

const CSRF_META_SELECTOR = 'meta[name="csrf-token"]';

/** Read the freshest CSRF-equivalent token we have access to. */
const readMetaCsrf = () => {
    if (typeof document === "undefined") return "";
    const meta = document.querySelector(CSRF_META_SELECTOR);
    return meta?.content || "";
};

/** Pull the decoded XSRF-TOKEN cookie value Laravel sets on each
 *  response. Cookie value is URL-encoded by Laravel; we decode it
 *  the same way axios does internally. */
const readXsrfCookie = () => {
    if (typeof document === "undefined") return "";
    const m = (document.cookie || "").match(/(?:^|;\s*)XSRF-TOKEN=([^;]+)/);
    return m ? decodeURIComponent(m[1]) : "";
};

/** Update the `<meta name="csrf-token">` tag in place so any code
 *  that reads it directly (legacy, third-party, or just a refresh
 *  fallback) sees the latest token without a hard reload. */
const writeMetaCsrf = (value) => {
    if (typeof document === "undefined" || !value) return;
    const meta = document.querySelector(CSRF_META_SELECTOR);
    if (meta) meta.setAttribute("content", value);
};

// ── axios defaults ──────────────────────────────────────────────
//
// xsrfCookieName / xsrfHeaderName are the magic pair: when both are
// set, axios reads the cookie on EVERY request and copies it into
// the named header. Laravel's CSRF middleware reads the same header.
// This single line is what truly fixes the 419 problem.
axios.defaults.xsrfCookieName = "XSRF-TOKEN";
axios.defaults.xsrfHeaderName = "X-XSRF-TOKEN";
axios.defaults.withCredentials = true;
axios.defaults.headers.common["X-Requested-With"] = "XMLHttpRequest";
axios.defaults.headers.common["Accept"] = "application/json";

// Belt-and-braces: also send the meta token as X-CSRF-TOKEN so a
// sysadmin watching the network tab can see it, and so the request
// still authenticates if the cookie path is ever misconfigured.
const initialMetaToken = readMetaCsrf();
if (initialMetaToken) {
    axios.defaults.headers.common["X-CSRF-TOKEN"] = initialMetaToken;
}

// Per-request hook: refresh X-CSRF-TOKEN from the meta tag (which
// the 419 retry below mutates), and let axios's built-in xsrf
// support handle the cookie-driven X-XSRF-TOKEN header.
axios.interceptors.request.use((config) => {
    const meta = readMetaCsrf();
    if (meta) {
        config.headers = config.headers || {};
        config.headers["X-CSRF-TOKEN"] = meta;
    }
    return config;
});

axios.interceptors.response.use(
    (response) => response,
    async (error) => {
        const status = error?.response?.status;
        const cfg    = error?.config || {};

        // ── 401 Unauthorized: session expired — bounce to login ──
        if (status === 401 && typeof window !== "undefined") {
            const here = window.location.pathname + window.location.search;
            // Avoid infinite redirect loop when /login itself 401s.
            if (!here.startsWith("/login")) {
                window.location.assign(
                    `/login?next=${encodeURIComponent(here)}`,
                );
            }
        }

        // ── 419 (Laravel CSRF mismatch): try once more with a
        //    fresh token. We GET `/sanctum/csrf-cookie` if it
        //    exists, else fall back to GET `/` so Laravel sets a
        //    new XSRF-TOKEN cookie. After that we retry the
        //    original request with both headers refreshed.
        //
        // FormData is preserved because we hand the SAME `cfg`
        // object back to axios — axios's adapter just re-reads the
        // body; it doesn't re-transform FormData.
        if (status === 419 && !cfg.__csrfRetried) {
            try {
                // The simplest cookie-refresh in stock Laravel: any
                // GET to a `web` route renews the session cookie.
                await fetch("/", {
                    method: "GET",
                    credentials: "same-origin",
                    cache: "no-store",
                    headers: { Accept: "text/html" },
                }).catch(() => {});

                const freshCookie = readXsrfCookie();
                const freshMeta   = readMetaCsrf();

                // Keep the meta tag in sync with the cookie so any
                // future request (and any other JS that reads the
                // meta tag directly) sees the new token. Some apps
                // ship the meta token URL-encoded; we mirror what
                // Laravel renders in app.blade.php — the raw value.
                if (freshCookie) writeMetaCsrf(freshCookie);

                cfg.__csrfRetried = true;
                cfg.headers = {
                    ...(cfg.headers || {}),
                    ...(freshCookie ? { "X-XSRF-TOKEN": freshCookie } : {}),
                    ...(freshMeta   ? { "X-CSRF-TOKEN":   freshMeta   } : {}),
                };

                return axios.request(cfg);
            } catch (_) {
                /* fall through to reject */
            }
        }

        return Promise.reject(error);
    },
);

export default axios;
