/**
 * Audio helpers built around *segment playback*: a single NCCD mp3
 * (e.g. p6.mp3) is streamed from the remote URL, and each click only
 * plays a millisecond range of it.
 *
 * Accepts three shapes:
 *   1. playAudio("/path/to/file.mp3")                    (legacy)
 *   2. playAudio({ src, startMs, endMs, label })         (clip object)
 *   3. playAudio(src, { startMs, endMs })                (pair)
 *
 * Returns a Promise that resolves when the (sub-)clip finishes,
 * giving callers an easy way to chain audio with UI transitions.
 */

let currentAudio = null;
let currentResolvers = [];

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
    // Resolve any pending promises so callers unblock
    currentResolvers.forEach((r) => r());
    currentResolvers = [];
};

export const playAudioClip = (src, { startMs = null, endMs = null } = {}) => {
    if (!src) return Promise.resolve();

    stopAllAudio();

    const audio = new Audio(src);
    audio.preload = "auto";
    // Small hint: many browsers honour this for cross-origin files
    audio.crossOrigin = "anonymous";
    currentAudio = audio;

    return new Promise((resolve) => {
        currentResolvers.push(resolve);

        const startSec = startMs != null ? startMs / 1000 : 0;
        const endSec = endMs != null ? endMs / 1000 : null;
        let cleaned = false;

        const cleanup = () => {
            if (cleaned) return;
            cleaned = true;
            audio.removeEventListener("ended", onEnd);
            audio.removeEventListener("timeupdate", onTick);
            audio.removeEventListener("error", onError);
            if (currentAudio === audio) currentAudio = null;
            currentResolvers = currentResolvers.filter((r) => r !== resolve);
            resolve();
        };

        const onEnd = () => cleanup();
        const onError = () => {
            console.warn("Audio failed to load:", src);
            cleanup();
        };
        const onTick = () => {
            if (endSec != null && audio.currentTime >= endSec) {
                audio.pause();
                cleanup();
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
            audio.play().catch(() => cleanup());
        };

        if (audio.readyState >= 1 /* HAVE_METADATA */) {
            start();
        } else {
            audio.addEventListener("loadedmetadata", start, { once: true });
            // If metadata never loads within 3s, cleanup so we don't leak
            setTimeout(() => {
                if (!cleaned && audio.readyState < 1) cleanup();
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
    });
};

export default playAudio;
