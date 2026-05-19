import React, { useState } from "react";
import { speakWord, stopAllAudio } from "@/learning/utils/playAudio";

/**
 * A small reusable speaker button that plays one word's audio.
 *
 * Uses the smart speakWord() helper, which tries (in order):
 *   1. The pre-built audioClip (NCCD segment, per-word file, etc.)
 *   2. Server-side OpenAI TTS (cached after first call) — defaults
 *      to the configured voice (currently `alloy` for its crystal-
 *      clear articulation), with per-word voice overrides
 *      available from the admin AudioPanel.
 *   3. Browser SpeechSynthesis as a final fallback.
 *
 * That means EVERY card in the curriculum has audio, even when the
 * NCCD recording is missing or the word's segment hasn't been
 * stamped yet. The kid never hits a silent button.
 *
 * Inputs (any one is enough — extra info just skips earlier
 * fallback steps):
 *   • clip  — { src, startMs, endMs, label, tts, wordId? }
 *   • wordId — DB id, lets the server cache the synthesised file
 *   • label — visible word, used as the speech text & TTS cache key
 */
const AudioClipButton = ({
    clip,
    wordId,
    label,
    size = "md",
    className = "",
    onStart,
    onEnd,
}) => {
    const [playing, setPlaying] = useState(false);

    const sizes = {
        sm: "w-9 h-9 text-base",
        md: "w-12 h-12 text-xl",
        lg: "w-16 h-16 text-2xl",
    };

    const resolvedLabel = label || clip?.label || clip?.tts || "";
    const resolvedWordId = wordId || clip?.wordId || null;

    // We can play SOMETHING as long as we have any one of: a real
    // audio src, a TTS-able label, or a wordId. The chain handles
    // the rest. The button is only disabled when we genuinely have
    // nothing to say.
    const canSpeak = Boolean(clip?.src || resolvedLabel || resolvedWordId);

    const handleClick = async (e) => {
        e.stopPropagation();
        if (!canSpeak) return;

        if (playing) {
            stopAllAudio();
            setPlaying(false);
            return;
        }

        setPlaying(true);
        onStart?.();
        try {
            await speakWord({
                wordId: resolvedWordId,
                label: resolvedLabel,
                audioClip: clip,
            });
        } catch (_) {
            /* silent — speakWord already handles its own errors */
        }
        setPlaying(false);
        onEnd?.();
    };

    return (
        <button
            type="button"
            onClick={handleClick}
            disabled={!canSpeak}
            aria-label={resolvedLabel ? `Play "${resolvedLabel}"` : "Play audio"}
            className={`rounded-full flex items-center justify-center text-white shadow-md transition-all
                ${sizes[size] || sizes.md}
                ${playing
                    ? "bg-[#F59E0B] shadow-[0_4px_0_#B45309]"
                    : "bg-[#10B981] shadow-[0_4px_0_#059669] hover:translate-y-[1px] active:translate-y-[4px] disabled:opacity-40 disabled:cursor-not-allowed"}
                ${className}`}
        >
            {playing ? "⏸" : "🔊"}
        </button>
    );
};

export default AudioClipButton;
