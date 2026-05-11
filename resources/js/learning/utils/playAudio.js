/**
 * Audio helpers built around *segment playback*: a single NCCD mp3
 * (e.g. p6.mp3) is streamed from the remote URL, and each click only
 * plays a millisecond range of it. That way we never have to download
 * the full curriculum — the browser asks the server for just the
 * needed bytes via HTTP Range requests.
 *
 * There are three shapes we accept:
 *
 *   1. Legacy:   playAudio("/assets/audio/words/family/boy.mp3")
 *   2. Clip obj: playAudio({ src, startMs, endMs, ... })
 *   3. Pair:     playAudio(srcUrl, { startMs, endMs })
 *
 * The function returns a controller { stop, promise } so callers that
 * want to cancel playback (e.g. when a user taps another card) can.
 */

let currentAudio = null;

/**
 * Stop whatever is playing right now, if anything.
 */
export const stopAllAudio = () => {
    if (currentAudio) {
        try {
            currentAudio.pause();
            currentAudio.currentTime = 0;
        } catch (_) {
            // no-op
        }
        currentAudio = null;
    }
};

/**
 * Core playback: takes a URL + optional millisecond range and returns
 * a Promise that resolves when the segment (or the whole file) ends.
 */
export const playAudioClip = (src, { startMs = null, endMs = null } = {}) => {
    if (!src) return Promise.resolve();

    stopAllAudio();

    const audio = new Audio(src);
    audio.preload = "auto";
    currentAudio = audio;

    return new Promise((resolve) => {
        const startSec = startMs != null ? startMs / 1000 : 0;
        const endSec = endMs != null ? endMs / 1000 : null;

        const cleanup = () => {
            audio.removeEventListener("ended", onEnd);
            audio.removeEventListener("timeupdate", onTick);
            audio.removeEventListener("error", onError);
            if (currentAudio === audio) currentAudio = null;
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
        if (endSec != null) {
            audio.addEventListener("timeupdate", onTick);
        }

        const start = () => {
            try {
                audio.currentTime = startSec;
            } catch (_) {
                // Seeking before loadedmetadata can throw in some browsers;
                // the loadedmetadata branch below handles that case.
            }
            audio.play().catch(() => cleanup());
        };

        if (audio.readyState >= 1 /* HAVE_METADATA */) {
            start();
        } else {
            audio.addEventListener("loadedmetadata", start, { once: true });
        }
    });
};

/**
 * Friendly entry point accepting any of the three input shapes.
 */
export const playAudio = (input, maybeRange) => {
    if (!input) return Promise.resolve();

    if (typeof input === "string") {
        return playAudioClip(input, maybeRange || {});
    }

    const { src, startMs, endMs } = input;
    return playAudioClip(src, { startMs, endMs });
};

export default playAudio;
