/**
 * Modern child-friendly sound effects using Web Audio API.
 * Designed to be warm, playful, and never startling.
 *
 * Public API:
 *   playSuccess()    - Bright sparkly success melody
 *   playFail()       - Gentle "oops" (never harsh)
 *   playClick()      - Soft tap feedback
 *   playReward()     - Big celebration jingle
 *   playCheer()      - Children cheering celebration
 *   playPop()        - Bubble pop for interactions
 *   playMagic()      - Magical unlock sound
 *   playWhoosh()     - Transition/navigation sound
 *   playLevelUp()    - Achievement/level up fanfare
 *   playBounce()     - Bouncy interaction sound
 *   playStarCollect() - Star collection ding
 */

let audioCtx = null;

const ctx = () => {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    audioCtx = new AC();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
};

const playTone = (freq, startOffset = 0, duration = 0.18, volume = 0.12, type = 'sine') => {
  const ac = ctx();
  if (!ac) return;
  const t0 = ac.currentTime + startOffset;
  const osc = ac.createOscillator();
  const gain = ac.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  gain.gain.setValueAtTime(0.0001, t0);
  gain.gain.exponentialRampToValueAtTime(Math.max(volume, 0.0002), t0 + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + duration);
  osc.connect(gain);
  gain.connect(ac.destination);
  osc.start(t0);
  osc.stop(t0 + duration + 0.05);
};

const playGlide = (fromFreq, toFreq, startOffset = 0, duration = 0.2, volume = 0.1, type = 'sine') => {
  const ac = ctx();
  if (!ac) return;
  const t0 = ac.currentTime + startOffset;
  const osc = ac.createOscillator();
  const gain = ac.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(fromFreq, t0);
  osc.frequency.linearRampToValueAtTime(toFreq, t0 + duration);
  gain.gain.setValueAtTime(0.0001, t0);
  gain.gain.exponentialRampToValueAtTime(Math.max(volume, 0.0002), t0 + 0.015);
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + duration);
  osc.connect(gain);
  gain.connect(ac.destination);
  osc.start(t0);
  osc.stop(t0 + duration + 0.05);
};

const playNoise = (startOffset = 0, duration = 0.05, volume = 0.03) => {
  const ac = ctx();
  if (!ac) return;
  const t0 = ac.currentTime + startOffset;
  const bufferSize = ac.sampleRate * duration;
  const buffer = ac.createBuffer(1, bufferSize, ac.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = (Math.random() * 2 - 1) * 0.5;
  }
  const source = ac.createBufferSource();
  source.buffer = buffer;
  const gain = ac.createGain();
  const filter = ac.createBiquadFilter();
  filter.type = 'highpass';
  filter.frequency.value = 4000;
  gain.gain.setValueAtTime(volume, t0);
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + duration);
  source.connect(filter);
  filter.connect(gain);
  gain.connect(ac.destination);
  source.start(t0);
  source.stop(t0 + duration + 0.01);
};

/**
 * Bright sparkly success - ascending arpeggio with shimmer
 */
export const playSuccess = () => {
  const notes = [523.25, 659.25, 783.99, 1046.5, 1318.51]; // C5 E5 G5 C6 E6
  notes.forEach((freq, i) => {
    const t = i * 0.07;
    playTone(freq, t, 0.2, 0.12, 'sine');
    playTone(freq * 1.5, t + 0.02, 0.15, 0.04, 'sine'); // shimmer harmonic
  });
  // Sparkle at the end
  playNoise(0.35, 0.06, 0.02);
  playTone(2637, 0.35, 0.08, 0.03, 'sine'); // high sparkle
  playTone(3136, 0.38, 0.06, 0.02, 'sine');
};

/**
 * Gentle fail - soft descending tone, never scary
 */
export const playFail = () => {
  playGlide(440, 330, 0, 0.2, 0.06, 'triangle');
  playTone(293.66, 0.15, 0.15, 0.04, 'triangle');
};

/**
 * Soft click/tap
 */
export const playClick = () => {
  playTone(1200, 0, 0.03, 0.06, 'sine');
  playTone(800, 0.01, 0.02, 0.04, 'sine');
};

/**
 * Big celebration jingle - used when completing a unit
 */
export const playReward = () => {
  const melody = [523.25, 587.33, 659.25, 783.99, 880, 1046.5, 1318.51, 1568];
  melody.forEach((freq, i) => {
    playTone(freq, i * 0.08, 0.25, 0.1, 'sine');
    playTone(freq * 0.5, i * 0.08, 0.2, 0.05, 'sine'); // bass doubling
  });
  // Final chord
  playTone(1046.5, 0.7, 0.5, 0.08, 'sine');
  playTone(1318.51, 0.7, 0.5, 0.06, 'sine');
  playTone(1568, 0.7, 0.5, 0.05, 'sine');
};

/**
 * Children cheering celebration - simulated with layered tones
 */
export const playCheer = () => {
  // Rising fanfare
  const fanfare = [392, 523.25, 659.25, 783.99, 1046.5, 1318.51, 1568, 2093];
  fanfare.forEach((freq, i) => {
    playTone(freq, i * 0.06, 0.3, 0.08, 'sine');
    if (i > 3) playTone(freq * 0.75, i * 0.06, 0.2, 0.04, 'sine');
  });
  // Shimmer layer
  for (let i = 0; i < 6; i++) {
    playTone(2000 + Math.random() * 2000, 0.5 + i * 0.08, 0.05, 0.02, 'sine');
  }
  // Bass boom
  playTone(130.81, 0.0, 0.4, 0.08, 'sine');
  playTone(65.41, 0.0, 0.3, 0.06, 'sine');
};

/**
 * Bubble pop
 */
export const playPop = () => {
  playGlide(300, 100, 0, 0.05, 0.12, 'sine');
  playNoise(0, 0.02, 0.04);
};

/**
 * Magical unlock - ascending glissando
 */
export const playMagic = () => {
  const glides = [
    [392, 523.25], [523.25, 659.25], [659.25, 880],
    [880, 1174.66], [1174.66, 1568]
  ];
  glides.forEach(([from, to], i) => {
    playGlide(from, to, i * 0.1, 0.12, 0.08, 'sine');
  });
  // Final shimmer
  playTone(2093, 0.55, 0.3, 0.04, 'sine');
  playTone(2637, 0.6, 0.25, 0.03, 'sine');
};

/**
 * Whoosh for transitions
 */
export const playWhoosh = () => {
  playGlide(200, 1500, 0, 0.15, 0.04, 'sine');
  playNoise(0, 0.1, 0.02);
};

/**
 * Level up fanfare
 */
export const playLevelUp = () => {
  const notes = [523.25, 659.25, 783.99, 1046.5];
  notes.forEach((freq, i) => {
    playTone(freq, i * 0.12, 0.3, 0.1, 'sine');
    playTone(freq * 2, i * 0.12 + 0.05, 0.2, 0.04, 'sine');
  });
  // Triumphant chord
  playTone(1046.5, 0.5, 0.6, 0.08, 'sine');
  playTone(1318.51, 0.5, 0.6, 0.06, 'sine');
  playTone(1568, 0.5, 0.6, 0.05, 'sine');
  playTone(2093, 0.55, 0.5, 0.04, 'sine');
};

/**
 * Bouncy interaction
 */
export const playBounce = () => {
  playGlide(200, 600, 0, 0.08, 0.08, 'sine');
  playGlide(500, 300, 0.06, 0.06, 0.05, 'sine');
};

/**
 * Star collection ding
 */
export const playStarCollect = () => {
  playTone(1318.51, 0, 0.1, 0.1, 'sine');
  playTone(1568, 0.06, 0.1, 0.08, 'sine');
  playTone(2093, 0.12, 0.15, 0.06, 'sine');
  playNoise(0.12, 0.03, 0.015);
};

export default {
  playSuccess, playFail, playClick, playReward,
  playCheer, playPop, playMagic, playWhoosh,
  playLevelUp, playBounce, playStarCollect,
};
