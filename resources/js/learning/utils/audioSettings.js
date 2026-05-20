/**
 * Global audio settings store — single source of truth for the
 * kid's mute toggle and volume slider. Persisted to localStorage
 * so the choice survives reloads and route changes.
 *
 * Used by:
 *   • playAudio.js / playAudioClip — shortcut-out when muted, scale
 *     audio.volume + speechSynthesis volume by `volume`.
 *   • soundEffects.js — shortcut-out when muted, scale every Web
 *     Audio gain node by `volume`.
 *   • TrackPlayer — re-applies the current volume on every play and
 *     listens for changes so a sliding the slider mid-playback is
 *     respected.
 *   • AudioControls (UI) — reads + mutates this store and subscribes
 *     to render the current state.
 *
 * Why a hand-rolled store and not Zustand/Recoil/etc.?
 *   The audio utilities are imported by 16 mode components, the
 *   AppHeader, the streak toast, the celebration overlay, every
 *   game card. Pulling in a state library just for two booleans
 *   would push another 4-8 KB onto the play page. A 30-line
 *   subscribable singleton does the job and stays tree-shakeable.
 */

const STORAGE_KEY_MUTED = "kiddo:audio:muted";
const STORAGE_KEY_VOLUME = "kiddo:audio:volume";

/** Default settings — full volume, not muted. */
const DEFAULTS = { muted: false, volume: 1.0 };

let state = { ...DEFAULTS };

// SSR / Inertia first-paint guard. localStorage is only available in
// the browser; on the server we keep the defaults.
if (typeof window !== "undefined") {
    try {
        const m = window.localStorage.getItem(STORAGE_KEY_MUTED);
        const v = window.localStorage.getItem(STORAGE_KEY_VOLUME);
        if (m === "1" || m === "true") state.muted = true;
        if (v !== null) {
            const parsed = parseFloat(v);
            if (!Number.isNaN(parsed)) state.volume = clamp(parsed, 0, 1);
        }
    } catch (_) {
        /* localStorage unavailable — stick with defaults */
    }
}

/** Subscribers notified whenever muted/volume changes. */
const subscribers = new Set();

function clamp(n, min, max) {
    return Math.max(min, Math.min(max, n));
}

function persist() {
    if (typeof window === "undefined") return;
    try {
        window.localStorage.setItem(STORAGE_KEY_MUTED, state.muted ? "1" : "0");
        window.localStorage.setItem(STORAGE_KEY_VOLUME, String(state.volume));
    } catch (_) {
        /* ignore quota / privacy errors */
    }
}

function notify() {
    for (const fn of subscribers) {
        try {
            fn(state);
        } catch (e) {
            console.warn("audioSettings subscriber threw:", e);
        }
    }
}

/** Read current state. Returns a fresh shallow copy. */
export function getAudioSettings() {
    return { ...state };
}

/** True when the kid has muted everything OR slid volume to 0. */
export function isMuted() {
    return state.muted || state.volume <= 0.001;
}

/** Effective volume after the mute toggle (0 when muted, else volume). */
export function effectiveVolume() {
    return isMuted() ? 0 : state.volume;
}

/**
 * Toggle (or explicitly set) the mute flag. Useful for keyboard
 * shortcuts ("M" key) and the AudioControls icon button.
 */
export function setMuted(next) {
    const value = typeof next === "boolean" ? next : !state.muted;
    if (state.muted === value) return;
    state = { ...state, muted: value };
    persist();
    notify();
}

/**
 * Set the master volume (0..1). Auto-unmutes when the kid drags the
 * slider above zero — otherwise the slider would feel broken.
 */
export function setVolume(next) {
    const clamped = clamp(Number(next) || 0, 0, 1);
    if (state.volume === clamped && (state.muted ? clamped === 0 : true)) return;
    state = {
        ...state,
        volume: clamped,
        muted: clamped <= 0 ? true : state.muted ? false : state.muted,
    };
    persist();
    notify();
}

/**
 * Subscribe to settings changes. Returns an unsubscribe function.
 * React hooks layer (useAudioSettings) wraps this with useSyncExternalStore.
 */
export function subscribeAudioSettings(fn) {
    subscribers.add(fn);
    return () => subscribers.delete(fn);
}

export default {
    getAudioSettings,
    isMuted,
    effectiveVolume,
    setMuted,
    setVolume,
    subscribeAudioSettings,
};
