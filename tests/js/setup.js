/**
 * Vitest global setup.
 *
 * Configures jest-dom matchers (e.g. `toBeInTheDocument`) and stubs
 * the Web APIs that React component code touches but jsdom doesn't
 * implement (matchMedia, IntersectionObserver, AudioContext).
 */

import "@testing-library/jest-dom/vitest";
import { afterEach, vi } from "vitest";
import { cleanup } from "@testing-library/react";

// Auto-unmount + cleanup between tests so DOM state never leaks.
afterEach(() => {
    cleanup();
});

// matchMedia: jsdom doesn't ship it. Some Tailwind + framer-motion
// internals call it; without this stub they throw at mount time.
if (!window.matchMedia) {
    window.matchMedia = (query) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: () => {},
        removeListener: () => {},
        addEventListener: () => {},
        removeEventListener: () => {},
        dispatchEvent: () => false,
    });
}

// IntersectionObserver: used by lazy images / scroll triggers.
if (!window.IntersectionObserver) {
    window.IntersectionObserver = class {
        observe() {}
        unobserve() {}
        disconnect() {}
        takeRecords() {
            return [];
        }
    };
}

// ResizeObserver: used by some lib internals.
if (!window.ResizeObserver) {
    window.ResizeObserver = class {
        observe() {}
        unobserve() {}
        disconnect() {}
    };
}

// AudioContext: soundEffects.js calls into the Web Audio API.
// We stub it so unit tests for components that play sounds don't
// crash on construction.
if (!window.AudioContext) {
    class FakeAudioContext {
        currentTime = 0;
        sampleRate = 44100;
        state = "running";
        destination = {};
        createOscillator() {
            return {
                type: "sine",
                frequency: { value: 0, setValueAtTime: () => {}, linearRampToValueAtTime: () => {} },
                connect: () => {},
                start: () => {},
                stop: () => {},
            };
        }
        createGain() {
            return {
                gain: {
                    value: 0,
                    setValueAtTime: () => {},
                    exponentialRampToValueAtTime: () => {},
                },
                connect: () => {},
            };
        }
        createBiquadFilter() {
            return { type: "lowpass", frequency: { value: 0 }, connect: () => {} };
        }
        createBuffer() {
            return { getChannelData: () => new Float32Array(0) };
        }
        createBufferSource() {
            return { buffer: null, connect: () => {}, start: () => {}, stop: () => {} };
        }
        resume() {
            return Promise.resolve();
        }
        close() {
            return Promise.resolve();
        }
    }
    window.AudioContext = FakeAudioContext;
    window.webkitAudioContext = FakeAudioContext;
}

// speechSynthesis: playAudio.js uses it as TTS fallback.
if (!window.speechSynthesis) {
    window.speechSynthesis = {
        speak: () => {},
        cancel: () => {},
        getVoices: () => [],
        onvoiceschanged: null,
    };
    window.SpeechSynthesisUtterance = class {
        constructor(text) {
            this.text = text;
        }
    };
}

// Silence noisy console warnings that Inertia/React Router emit
// when a route helper is missing in tests.
const origWarn = console.warn;
console.warn = (...args) => {
    if (
        typeof args[0] === "string" &&
        /not implemented: window.scrollTo/i.test(args[0])
    ) {
        return;
    }
    origWarn(...args);
};

// Mock the Inertia router so components can call router.visit() in
// tests without a real network request.
vi.mock("@inertiajs/react", async () => {
    const actual = await vi.importActual("@inertiajs/react");
    return {
        ...actual,
        router: {
            visit: vi.fn(),
            get: vi.fn(),
            post: vi.fn(),
            put: vi.fn(),
            patch: vi.fn(),
            delete: vi.fn(),
            reload: vi.fn(),
        },
        usePage: () => ({
            props: {
                auth: { user: null },
                ai: { enabled: false },
                flash: {},
                app: { name: "Kiddo", csrfToken: "test-csrf" },
            },
            url: "/",
        }),
    };
});
