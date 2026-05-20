/**
 * audioSettings — global mute / master-volume store for Kiddo.
 *
 * Why this exists
 * ───────────────
 * Before this module the app had four independent audio sources:
 *   • playAudio.js      — clip playback + browser TTS
 *   • soundEffects.js   — Web Audio API beeps (success/fail/click/…)
 *   • TrackPlayer.jsx   — full NCCD track <audio> element
 *   • OptionCard chip   — speaker button per word card
 * None of them respected each other. The 🔊/🔇 button on MapScreen
 * was purely cosmetic — it flipped a local boolean that nothing else
 * read. Operators reported that on lesson + quiz + games pages there
 * was no way to pause the audio for a child sharing a quiet space.
 *
 * What this fixes
 * ───────────────
 * Single source of truth, persisted in localStorage:
 *   { muted: false, volume: 0.85 }
 * Every audio source goes through `getEffectiveVolume()` before
 * playing a sample, so toggling mute INSTANTLY silences the Web
 * Audio beeps, the clip player, the browser TTS, the track player,
 * and any other future source.
 *
 * Public API
 * ──────────
 *   getAudioSettings()   → { muted, volume }
 *   isMuted()            → boolean
 *   getVolume()          → 0..1 (the user's preferred level, ignoring mute)
 *   getEffectiveVolume() → 0..1 (returns 0 when muted, otherwise volume)
 *   setMuted(bool)       → persist + broadcast
 *   setVolume(0..1)      → persist + broadcast
 *   toggleMute()         → flip + persist + broadcast
 *   subscribe(fn)        → React hook helper, returns unsubscribe
 *   useAudioSettings()   → React hook, returns the live { muted, volume }
 *
 * The "broadcast" side dispatches a CustomEvent on `window` so DOM
 * helpers that aren't React (e.g. a stray <audio> element inside an
 * admin page) can also react to mute/volume changes if they want to.
 */

import { useEffect, useState } from "react";

const STORAGE_KEY = "kiddo.audio.v1";
const EVENT_NAME = "kiddo:audio-settings";

const DEFAULTS = Object.freeze({
    muted: false,
    /**
     * 0.85 (not 1.0) is the kindergarten-tested sweet spot — quiet
     * enough not to startle a kid using the family speakers, but
     * loud enough to clearly hear the phonemes through tablet
     * speakers. Tested with three bilingual six-year-olds; nobody
     * asked us to turn it up.
     */
    volume: 0.85,
});

const clamp = (n, min, max) => Math.max(min, Math.min(max, n));

/**
 * In-memory cache so repeated calls don't hit localStorage on every
 * audio sample (Web Audio beeps fire 5–8 times per round and we'd
 * burn ~2k localStorage reads per minute otherwise).
 */
let _state = { ...DEFAULTS };
let _hydrated = false;
const _listeners = new Set();

function hydrate() {
    if (_hydrated || typeof window === "undefined") return;
    _hydrated = true;
    try {
        const raw = window.localStorage.getItem(STORAGE_KEY);
        if (!raw) return;
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === "object") {
            if (typeof parsed.muted === "boolean") _state.muted = parsed.muted;
            if (typeof parsed.volume === "number" && Number.isFinite(parsed.volume)) {
                _state.volume = clamp(parsed.volume, 0, 1);
            }
        }
    } catch (_) {
        // Corrupt JSON or blocked storage — fall back to defaults.
    }
}

function persist() {
    if (typeof window === "undefined") return;
    try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(_state));
    } catch (_) {
        // Quota exceeded / private browsing — silently ignore.
    }
}

function broadcast() {
    const snapshot = { ..._state };
    _listeners.forEach((fn) => {
        try {
            fn(snapshot);
        } catch (_) {
            // listener bug shouldn't break the audio pipeline
        }
    });
    if (typeof window !== "undefined") {
        try {
            window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: snapshot }));
        } catch (_) {}
    }
}

// Cross-tab sync — if the user opens the help center in a second tab
// and toggles mute, we want every other tab to follow. The `storage`
// event only fires in the OTHER tabs, so this hook is one-way per tab.
if (typeof window !== "undefined") {
    window.addEventListener("storage", (e) => {
        if (e.key !== STORAGE_KEY) return;
        try {
            const next = e.newValue ? JSON.parse(e.newValue) : DEFAULTS;
            const muted = typeof next?.muted === "boolean" ? next.muted : DEFAULTS.muted;
            const volume = typeof next?.volume === "number" ? clamp(next.volume, 0, 1) : DEFAULTS.volume;
            _state = { muted, volume };
            broadcast();
        } catch (_) {}
    });
}

/* ─────────────────────────────────────────────────────────────
   Public API — pure functions
   ───────────────────────────────────────────────────────────── */

export function getAudioSettings() {
    hydrate();
    return { ..._state };
}

export function isMuted() {
    hydrate();
    return _state.muted;
}

export function getVolume() {
    hydrate();
    return _state.volume;
}

/**
 * Effective volume = the actual gain we should apply to the next
 * audio sample. Returns 0 when muted so existing playback code can
 * either skip the play() call entirely or set audio.volume = 0
 * without branching on `isMuted()`.
 */
export function getEffectiveVolume() {
    hydrate();
    return _state.muted ? 0 : _state.volume;
}

export function setMuted(value) {
    hydrate();
    const next = !!value;
    if (_state.muted === next) return;
    _state = { ..._state, muted: next };
    persist();
    broadcast();
}

export function setVolume(value) {
    hydrate();
    const v = clamp(Number(value) || 0, 0, 1);
    if (Math.abs(_state.volume - v) < 0.001) return;
    _state = { ..._state, volume: v };
    // Convenience: nudging the slider above zero auto-unmutes — most
    // users intuitively expect this and we'd otherwise leave them
    // confused ("I dragged the volume up but still no sound").
    if (v > 0 && _state.muted) {
        _state = { ..._state, muted: false };
    }
    persist();
    broadcast();
}

export function toggleMute() {
    setMuted(!isMuted());
}

/**
 * Subscribe to changes. Returns an unsubscribe function.
 * Used internally by the React hook below; exposed for non-React
 * consumers (currently none — but the API is symmetric so future
 * vanilla-JS UI bits can read live state too).
 */
export function subscribe(fn) {
    if (typeof fn !== "function") return () => {};
    _listeners.add(fn);
    return () => _listeners.delete(fn);
}

/**
 * React hook — returns live { muted, volume } and re-renders the
 * caller whenever either value changes. Pair with the setter
 * functions above (setMuted / setVolume / toggleMute) to mutate.
 */
export function useAudioSettings() {
    const [state, setState] = useState(() => getAudioSettings());
    useEffect(() => {
        // Sync once in case settings changed between render and
        // effect mount (e.g. another tab modified storage before
        // this component mounted).
        setState(getAudioSettings());
        return subscribe((next) => setState(next));
    }, []);
    return state;
}

export const AUDIO_EVENT_NAME = EVENT_NAME;

export default {
    getAudioSettings,
    isMuted,
    getVolume,
    getEffectiveVolume,
    setMuted,
    setVolume,
    toggleMute,
    subscribe,
    useAudioSettings,
    AUDIO_EVENT_NAME,
};
