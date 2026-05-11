/**
 * Child-friendly sound effects generated on the fly with the Web Audio
 * API. We synthesize them instead of shipping mp3 files so the repo
 * stays tiny and the sounds are guaranteed to work offline. Every tone
 * is deliberately soft and short — no scary noises for a first-grader.
 *
 * Public API (stable):
 *   playSuccess()  — bright 5-note ascending arpeggio with a shimmery
 *                    chime harmonic and a brief high "sparkle".
 *   playFail()     — gentle falling triangle tone (never harsh).
 *   playClick()    — tiny UI tick for taps.
 *   playReward()   — 5-note celebratory jingle (kept from earlier).
 *
 * New helpers (FIX 9):
 *   playCheer()    — 8-note playful C-major "hooray" tune.
 *   playPop()      — quick 80 Hz pop for drag / drop feedback.
 *   playMagic()    — 4 quick glissando notes for unit-unlock moments.
 */

let audioCtx = null;

const ctx = () => {
    if (typeof window === "undefined") return null;
    if (!audioCtx) {
        const AC = window.AudioContext || window.webkitAudioContext;
        if (!AC) return null;
        audioCtx = new AC();
    }
    if (audioCtx.state === "suspended") {
        audioCtx.resume().catch(() => {});
    }
    return audioCtx;
};

/**
 * Play a single tone with an exponential release envelope. Defaults
 * tuned for child-friendly playback (soft attack, quick decay).
 */
const playTone = (
    freq,
    startOffset = 0,
    duration = 0.18,
    volume = 0.15,
    type = "sine",
) => {
    const ac = ctx();
    if (!ac) return;

    const t0 = ac.currentTime + startOffset;
    const osc = ac.createOscillator();
    const gain = ac.createGain();

    osc.type = type;
    osc.frequency.value = freq;

    gain.gain.setValueAtTime(0.0001, t0);
    gain.gain.exponentialRampToValueAtTime(Math.max(volume, 0.0002), t0 + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + duration);

    osc.connect(gain);
    gain.connect(ac.destination);

    osc.start(t0);
    osc.stop(t0 + duration + 0.05);
};

/**
 * Play a tone that smoothly glides from one frequency to another.
 * Used by playMagic and playFail for a gentle pitch sweep.
 */
const playGlide = (
    fromFreq,
    toFreq,
    startOffset = 0,
    duration = 0.2,
    volume = 0.12,
    type = "sine",
) => {
    const ac = ctx();
    if (!ac) return;

    const t0 = ac.currentTime + startOffset;
    const osc = ac.createOscillator();
    const gain = ac.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(fromFreq, t0);
    osc.frequency.linearRampToValueAtTime(toFreq, t0 + duration);

    gain.gain.setValueAtTime(0.0001, t0);
    gain.gain.exponentialRampToValueAtTime(Math.max(volume, 0.0002), t0 + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + duration);

    osc.connect(gain);
    gain.connect(ac.destination);

    osc.start(t0);
    osc.stop(t0 + duration + 0.05);
};

/**
 * Bright, sparkly success cue.
 *   - 5-note ascending arpeggio (C5 E5 G5 C6 E6)
 *   - every note doubled with a ×1.5 sine "chime" harmonic at 50% gain
 *   - two tiny sparkle pops at 2 kHz and 3 kHz (50 ms each)
 */
export const playSuccess = () => {
    const notes = [523.25, 659.25, 783.99, 1046.5, 1318.51]; // C5 E5 G5 C6 E6
    notes.forEach((freq, i) => {
        const t = i * 0.09;
        // Core note
        playTone(freq, t, 0.22, 0.14, "sine");
        // Chime harmonic at 1.5× with 50% of the core gain
        playTone(freq * 1.5, t, 0.22, 0.07, "sine");
    });

    // Sparkle layer — two very high harmonics to imply a magic twinkle.
    playTone(2000, 0.28, 0.05, 0.045, "sine");
    playTone(3000, 0.33, 0.05, 0.035, "sine");
};

/**
 * Soft, non-harsh "oops" — a single 250 ms triangle tone falling
 * from G4 (~392 Hz) to D4 (~293.66 Hz), capped at 0.08 volume so it
 * never startles a first-grader.
 */
export const playFail = () => {
    playGlide(392.0, 293.66, 0.0, 0.25, 0.08, "triangle");
};

export const playClick = () => {
    playTone(880, 0, 0.04, 0.07, "square");
};

/**
 * Longer celebratory jingle kept for backward compatibility.
 */
export const playReward = () => {
    [523.25, 659.25, 783.99, 1046.5, 1318.51].forEach((f, i) => {
        playTone(f, i * 0.09, 0.2, 0.14);
    });
};

/**
 * Playful 8-note cheer tune over a C-major arpeggio (C-E-G-C5-E5-G5-C6).
 * Slightly longer than playReward so it clearly reads as a bigger win.
 */
export const playCheer = () => {
    const notes = [
        261.63, // C4
        329.63, // E4
        392.0, // G4
        523.25, // C5
        659.25, // E5
        783.99, // G5
        1046.5, // C6
        1318.51, // E6 — optional flourish to land on a bright note
    ];
    notes.forEach((freq, i) => {
        playTone(freq, i * 0.1, 0.22, 0.12, "sine");
    });
};

/**
 * Tiny "pop" for drag/drop or picking up an item. 80 Hz sine, 40 ms,
 * fast decay so it never competes with UI music.
 */
export const playPop = () => {
    playTone(80, 0, 0.04, 0.18, "sine");
};

/**
 * Four quick glissando notes for when a child unlocks a new unit.
 */
export const playMagic = () => {
    playGlide(392.0, 523.25, 0.0, 0.08, 0.1, "sine"); // G4 -> C5
    playGlide(523.25, 659.25, 0.09, 0.08, 0.1, "sine"); // C5 -> E5
    playGlide(659.25, 880.0, 0.18, 0.1, 0.1, "sine"); // E5 -> A5
    playGlide(880.0, 1318.51, 0.3, 0.16, 0.12, "sine"); // A5 -> E6
};

export default {
    playSuccess,
    playFail,
    playClick,
    playReward,
    playCheer,
    playPop,
    playMagic,
};
