/**
 * Child-friendly success / fail sound effects generated on the fly
 * with the Web Audio API. We synthesize them instead of shipping mp3
 * files so the repo stays tiny and the sounds are guaranteed to work
 * offline. The tones are deliberately soft and short — no scary
 * noises for a first-grader.
 *
 * Exports:
 *   playSuccess()  — a bright 3-note arpeggio, "ding-ding-ding"
 *   playFail()     — a gentle falling 2-note "boop", not a buzzer
 *   playClick()    — tiny UI tick for taps
 *   playReward()   — longer 5-note celebratory jingle
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
 * Play a single sine tone with an exponential release.
 */
const playTone = (freq, startOffset = 0, duration = 0.18, volume = 0.15, type = "sine") => {
    const ac = ctx();
    if (!ac) return;

    const t0 = ac.currentTime + startOffset;
    const osc = ac.createOscillator();
    const gain = ac.createGain();

    osc.type = type;
    osc.frequency.value = freq;

    gain.gain.setValueAtTime(0.0001, t0);
    gain.gain.exponentialRampToValueAtTime(volume, t0 + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + duration);

    osc.connect(gain);
    gain.connect(ac.destination);

    osc.start(t0);
    osc.stop(t0 + duration + 0.05);
};

export const playSuccess = () => {
    // C5 -> E5 -> G5, bright major triad
    playTone(523.25, 0.00, 0.18, 0.14);
    playTone(659.25, 0.12, 0.18, 0.14);
    playTone(783.99, 0.24, 0.22, 0.14);
};

export const playFail = () => {
    // Soft B4 -> G4, gentle "oops" (not a harsh buzz)
    playTone(493.88, 0.00, 0.18, 0.10, "triangle");
    playTone(392.00, 0.14, 0.24, 0.10, "triangle");
};

export const playClick = () => {
    playTone(880, 0, 0.04, 0.07, "square");
};

export const playReward = () => {
    // Cheerful 5-note "ta-da" flourish
    [523.25, 659.25, 783.99, 1046.5, 1318.51].forEach((f, i) => {
        playTone(f, i * 0.09, 0.2, 0.14);
    });
};

export default { playSuccess, playFail, playClick, playReward };
