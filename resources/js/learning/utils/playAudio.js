/**
 * Audio helpers built around *segment playback* with a TTS fallback.
 *
 * Three input shapes are supported:
 *   1. playAudio("/path/to/file.mp3")                      (legacy)
 *   2. playAudio({ src, startMs, endMs, label, tts })       (clip object)
 *   3. playAudio(src, { startMs, endMs })                   (pair)
 *
 * Behaviour:
 *   • If `src` is set, plays the (sub-)clip from that URL. Same trick
 *     as Admin → Audio Tracks: no `crossOrigin` flag, so NCCD MP3s
 *     stream without any CORS preflight.
 *   • If `src` is null/missing OR loading fails, falls back to the
 *     browser's built-in speechSynthesis using `tts` (the spoken
 *     text). This keeps Welcome unit working even though there is no
 *     usable NCCD audio for "Hello", "Blue", "One", etc.
 *
 * Returns a Promise that resolves when playback finishes so callers
 * can chain audio with UI transitions.
 */

let currentAudio = null;
let currentResolvers = [];

const speechSupported =
    typeof window !== "undefined" &&
    typeof window.speechSynthesis !== "undefined" &&
    typeof window.SpeechSynthesisUtterance !== "undefined";

const cancelSpeech = () => {
    if (!speechSupported) return;
    try {
        window.speechSynthesis.cancel();
    } catch (_) {}
};

export const stopAllAudio = () => {
    if (currentAudio) {
        try {
            currentAudio.pause();
            currentAudio.currentTime = 0;
        } catch (_) {
            /* no-op */
        }
        currentAudio = null;
    }
    cancelSpeech();
    // Resolve any pending promises so callers unblock
    currentResolvers.forEach((r) => r());
    currentResolvers = [];
};

/**
 * Speak `text` via the browser's TTS engine. Picks a pleasant English
 * voice when one is available (Google US/UK, Samantha, Karen, etc.)
 * and falls back to whatever en-* voice the browser has otherwise.
 * Returns a Promise that resolves when speech finishes (or 4s timeout
 * for browsers that never fire `onend`).
 */
export const speakText = (text) => {
    if (!speechSupported || !text) return Promise.resolve();

    cancelSpeech();

    return new Promise((resolve) => {
        currentResolvers.push(resolve);

        const utter = new window.SpeechSynthesisUtterance(String(text));
        utter.lang = "en-US";
        utter.rate = 0.9;       // a touch slower so children catch every sound
        utter.pitch = 1.1;      // slightly brighter, more child-friendly
        utter.volume = 1.0;

        try {
            const voices = window.speechSynthesis.getVoices() || [];
            const preferred =
                voices.find((v) => /Google US English|Samantha|Karen/i.test(v.name)) ||
                voices.find((v) => v.lang && v.lang.startsWith("en"));
            if (preferred) utter.voice = preferred;
        } catch (_) {}

        let cleaned = false;
        const cleanup = () => {
            if (cleaned) return;
            cleaned = true;
            currentResolvers = currentResolvers.filter((r) => r !== resolve);
            resolve();
        };
        utter.onend = cleanup;
        utter.onerror = cleanup;

        try {
            window.speechSynthesis.speak(utter);
        } catch (_) {
            cleanup();
            return;
        }
        // Safety net: some browsers never fire onend for short utterances.
        setTimeout(cleanup, 4000);
    });
};

export const playAudioClip = (src, { startMs = null, endMs = null, tts = null } = {}) => {
    // No URL? Skip straight to the TTS fallback so the child still
    // hears the word.
    if (!src) {
        stopAllAudio();
        return tts ? speakText(tts) : Promise.resolve();
    }

    stopAllAudio();

    const audio = new Audio(src);
    audio.preload = "auto";
    // NOTE: We deliberately do NOT set `audio.crossOrigin = "anonymous"`.
    // The browser only enforces CORS on cross-origin audio when that flag
    // is set; without it, plain playback + seeking + timeupdate all work
    // even when the redirect target (qr.nccd.gov.jo) returns no CORS
    // headers. This matches the Admin → Audio Tracks page exactly.
    currentAudio = audio;

    return new Promise((resolve) => {
        currentResolvers.push(resolve);

        const startSec = startMs != null ? startMs / 1000 : 0;
        const endSec = endMs != null ? endMs / 1000 : null;
        let cleaned = false;

        const cleanup = (didError = false) => {
            if (cleaned) return;
            cleaned = true;
            audio.removeEventListener("ended", onEnd);
            audio.removeEventListener("timeupdate", onTick);
            audio.removeEventListener("error", onError);
            if (currentAudio === audio) currentAudio = null;
            currentResolvers = currentResolvers.filter((r) => r !== resolve);
            // Fallback to TTS if loading failed and we have a label
            if (didError && tts) {
                speakText(tts).finally(resolve);
                return;
            }
            resolve();
        };

        const onEnd = () => cleanup(false);
        const onError = () => {
            console.warn("Audio failed to load, falling back to TTS:", src);
            cleanup(true);
        };
        const onTick = () => {
            if (endSec != null && audio.currentTime >= endSec) {
                audio.pause();
                cleanup(false);
            }
        };

        audio.addEventListener("ended", onEnd);
        audio.addEventListener("error", onError);
        if (endSec != null) audio.addEventListener("timeupdate", onTick);

        const start = () => {
            try {
                audio.currentTime = startSec;
            } catch (_) {
                /* seeking before metadata is loaded throws in some browsers */
            }
            audio.play().catch(() => cleanup(true));
        };

        if (audio.readyState >= 1 /* HAVE_METADATA */) {
            start();
        } else {
            audio.addEventListener("loadedmetadata", start, { once: true });
            // If metadata never loads within 3s, treat as error and fall
            // through to TTS so the kid still hears the word.
            setTimeout(() => {
                if (!cleaned && audio.readyState < 1) cleanup(true);
            }, 3000);
        }
    });
};

export const playAudio = (input, maybeRange) => {
    if (!input) return Promise.resolve();
    if (typeof input === "string") return playAudioClip(input, maybeRange || {});
    return playAudioClip(input.src, {
        startMs: input.startMs,
        endMs: input.endMs,
        tts: input.tts || input.label || null,
    });
};

// Pre-warm the voice list. Some browsers (notably Chrome) load the
// voice list asynchronously; touching it here once at module-load
// makes the first speakText() call sound right instead of using the
// default robotic voice.
if (speechSupported) {
    try {
        window.speechSynthesis.getVoices();
        if (typeof window.speechSynthesis.onvoiceschanged !== "undefined") {
            window.speechSynthesis.onvoiceschanged = () => {
                window.speechSynthesis.getVoices();
            };
        }
    } catch (_) {}
}

export default playAudio;
