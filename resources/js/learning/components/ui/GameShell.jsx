import React from "react";
import { cn } from "@/lib/cn";
import AudioClipButton from "@/learning/components/ui/AudioClipButton";
import SmartImage from "@/learning/components/ui/SmartImage";
import { playAudio } from "@/learning/utils/playAudio";

/**
 * GameShell — the ONE consistent layout used by every Kiddo game.
 *
 * v1.1 (May 2026)
 *
 * Why this exists
 * ───────────────
 * Before v1.1, every mode (Vocab, Bubble Pop, Speed Tap, Listening,
 * Drag-Drop, Memory, Match-Connect, Word-Rain, Colour-Tap, Odd-One-
 * Out, etc.) hand-rolled its own header with subtle drift:
 *   • Different progress-bar paddings (px-3 vs px-4 vs px-5)
 *   • Different gradients (amber-to-orange, blue-to-cyan, …)
 *   • Different rounded radii (rounded-2xl vs rounded-full)
 *   • Different typography (text-[9px] vs text-[10px])
 *   • Different ways to show hearts / score / round counters
 *
 * That drift was the operator's main "كل لعبة شكلها مختلف"
 * complaint. GameShell solves it by giving every mode the same
 * card: progress bar, prompt, audio button, hearts, hint pill,
 * counter chip — all in a fixed visual rhythm.
 *
 * It is intentionally OPT-IN: modes can keep their own custom
 * inner UI (the bubble-drifting playfield, the colour-tile grid,
 * the connect-the-dots SVG canvas, etc.). They just wrap that
 * playfield in <GameShell /> so the *header* and *outer
 * container* match every other mode.
 *
 * Theme palette
 * ─────────────
 * One of: purple | blue | green | pink | amber | cyan | teal |
 * sky | rose | indigo. Each maps to:
 *   • A progress-bar gradient
 *   • A prompt-pill background tint
 *   • The mode-icon background
 *   • The progress chip colour
 * The defaults match the modeMeta() table in lessonEngine so the
 * AppHeader's mode pill, the StageBreadcrumb pill, and the
 * GameShell header all read as one consistent colour story.
 */

const THEMES = {
    purple: {
        bar:   "from-purple-500 to-fuchsia-500",
        chip:  "bg-purple-100 text-purple-700",
        accent:"text-purple-600",
        ring:  "border-purple-100",
        prompt:"bg-purple-50/60",
        promptText: "text-purple-500",
    },
    blue: {
        bar:   "from-blue-500 to-cyan-500",
        chip:  "bg-blue-100 text-blue-700",
        accent:"text-blue-600",
        ring:  "border-blue-100",
        prompt:"bg-blue-50/60",
        promptText: "text-blue-500",
    },
    green: {
        bar:   "from-emerald-500 to-green-500",
        chip:  "bg-emerald-100 text-emerald-700",
        accent:"text-emerald-600",
        ring:  "border-emerald-100",
        prompt:"bg-emerald-50/60",
        promptText: "text-emerald-500",
    },
    pink: {
        bar:   "from-rose-500 to-pink-500",
        chip:  "bg-rose-100 text-rose-700",
        accent:"text-rose-600",
        ring:  "border-rose-100",
        prompt:"bg-rose-50/60",
        promptText: "text-rose-500",
    },
    amber: {
        bar:   "from-amber-500 to-orange-500",
        chip:  "bg-amber-100 text-amber-700",
        accent:"text-amber-600",
        ring:  "border-amber-100",
        prompt:"bg-amber-50/60",
        promptText: "text-amber-500",
    },
    cyan: {
        bar:   "from-cyan-500 to-teal-500",
        chip:  "bg-cyan-100 text-cyan-700",
        accent:"text-cyan-600",
        ring:  "border-cyan-100",
        prompt:"bg-cyan-50/60",
        promptText: "text-cyan-500",
    },
    teal: {
        bar:   "from-teal-500 to-cyan-500",
        chip:  "bg-teal-100 text-teal-700",
        accent:"text-teal-600",
        ring:  "border-teal-100",
        prompt:"bg-teal-50/60",
        promptText: "text-teal-500",
    },
    sky: {
        bar:   "from-sky-500 to-blue-500",
        chip:  "bg-sky-100 text-sky-700",
        accent:"text-sky-600",
        ring:  "border-sky-100",
        prompt:"bg-sky-50/60",
        promptText: "text-sky-500",
    },
    rose: {
        bar:   "from-rose-500 to-fuchsia-500",
        chip:  "bg-rose-100 text-rose-700",
        accent:"text-rose-600",
        ring:  "border-rose-100",
        prompt:"bg-rose-50/60",
        promptText: "text-rose-500",
    },
    indigo: {
        bar:   "from-indigo-500 to-violet-500",
        chip:  "bg-indigo-100 text-indigo-700",
        accent:"text-indigo-600",
        ring:  "border-indigo-100",
        prompt:"bg-indigo-50/60",
        promptText: "text-indigo-500",
    },
};

/**
 * GameShell — wraps every game mode's outer layout.
 *
 * Props (all optional except `children`):
 *   children      — the game body (cards, board, bubbles, …).
 *   theme         — palette name (default: "purple").
 *   icon          — emoji shown on the prompt pill (default: "🎮").
 *   instruction   — short "what to do" line (e.g. "Find the matching picture!").
 *   progress      — { current, total } shown as a bar + chip.
 *   targetWord    — the word being prompted (rendered big on the pill).
 *   targetImage   — picture-prompt path (rendered as a thumbnail).
 *   audioClip     — clip played when the speaker button is tapped.
 *   wordId        — DB id of the prompt word (TTS fallback hook).
 *   hearts        — { current, total = 3 }; renders a row of ❤️.
 *   score         — { value, label = "Score" }; renders a chip on the right.
 *   hint          — { text, revealed, onToggle }; renders a hint pill.
 *   helperText    — small line under the pill ("Tap a picture below!").
 *   showArrow     — bool; renders the bouncing 👇 arrow under the header.
 *   counter       — { current, total, label }; rounds-style chip on the right.
 *   onPlayAudio   — fired when the speaker button is tapped (overrides default).
 *   className     — extra classes for the OUTER wrapper.
 *
 * Layout invariant: the header is always one card, capped at
 * `max-w-md` so it reads tidy on phones. The body below uses the
 * remaining play surface — game modes pick their own grid widths.
 */
const GameShell = ({
    children,
    theme = "purple",
    icon = "🎮",
    instruction,
    progress,
    targetWord,
    targetImage,
    audioClip,
    wordId,
    hearts,
    score,
    hint,
    helperText,
    showArrow = false,
    counter,
    onPlayAudio,
    className = "",
}) => {
    const t = THEMES[theme] || THEMES.purple;

    const hasPrompt = targetWord || targetImage || audioClip || onPlayAudio;
    const progressPct =
        progress && progress.total > 0
            ? Math.min(
                  100,
                  Math.max(0, ((progress.current - 1) / progress.total) * 100),
              )
            : 0;

    const handlePlay = () => {
        if (onPlayAudio) return onPlayAudio();
        if (audioClip) playAudio(audioClip);
    };

    return (
        <div
            className={cn(
                "w-full max-w-4xl flex flex-col items-center gap-3 sm:gap-4 lg:gap-5",
                "animate-kiddoSlide px-2",
                className,
            )}
        >
            {/* ═══════════════ HEADER CARD ═══════════════ */}
            <div
                className={cn(
                    "w-full max-w-md rounded-2xl shadow-lg border-2 px-4 py-3",
                    "bg-white/95 backdrop-blur flex flex-col gap-2",
                    t.ring,
                )}
            >
                {/* Progress bar row — only when `progress` provided. */}
                {progress && progress.total > 0 ? (
                    <div className="flex items-center gap-2">
                        <span className={cn("text-base leading-none", t.accent)}>
                            {icon}
                        </span>
                        <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                            <div
                                className={cn(
                                    "h-full rounded-full transition-all duration-500 bg-gradient-to-r",
                                    t.bar,
                                )}
                                style={{ width: `${progressPct}%` }}
                            />
                        </div>
                        <span
                            className={cn(
                                "text-[10px] font-black tabular-nums",
                                t.accent,
                            )}
                        >
                            {progress.current}/{progress.total}
                        </span>
                    </div>
                ) : null}

                {/* Instruction line (small caps label, theme tinted). */}
                {instruction ? (
                    <p
                        className={cn(
                            "text-[10px] sm:text-[11px] font-black uppercase tracking-widest text-center",
                            t.promptText,
                        )}
                    >
                        {instruction}
                    </p>
                ) : null}

                {/* Prompt body — speaker + word, or speaker + thumb,
                    or just a centered speaker. Skipped entirely when
                    no prompt props are passed. */}
                {hasPrompt ? (
                    <div className={cn(
                        "flex items-center justify-center gap-2 sm:gap-3 rounded-xl px-2 py-1.5",
                        t.prompt,
                    )}>
                        {audioClip ? (
                            <AudioClipButton
                                clip={audioClip}
                                wordId={wordId}
                                label={targetWord}
                                size="md"
                                onClick={handlePlay}
                            />
                        ) : (
                            <button
                                type="button"
                                onClick={handlePlay}
                                className={cn(
                                    "w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center",
                                    "text-white text-xl sm:text-2xl shadow-lg",
                                    "bg-gradient-to-br hover:scale-105 active:scale-95 transition-transform",
                                    t.bar,
                                )}
                                aria-label="Hear the prompt again"
                            >
                                🔊
                            </button>
                        )}

                        {targetImage ? (
                            <SmartImage
                                src={targetImage}
                                label={targetWord || ""}
                                className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl"
                                imgClassName="w-full h-full object-contain"
                            />
                        ) : null}

                        {targetWord ? (
                            <h2 className="text-lg sm:text-2xl lg:text-3xl font-black text-gray-800 tracking-tight uppercase truncate">
                                {targetWord}
                            </h2>
                        ) : null}
                    </div>
                ) : null}

                {/* Hint + counter + score + hearts row — only renders
                    when at least one is present. Each chip uses the
                    same shape so they line up cleanly. */}
                {(hint || counter || score || hearts) && (
                    <div className="flex items-center justify-center flex-wrap gap-1.5">
                        {hint?.text ? (
                            <button
                                type="button"
                                onClick={hint.onToggle}
                                className={cn(
                                    "px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider",
                                    "transition-colors border",
                                    hint.revealed
                                        ? "bg-amber-100 text-amber-700 border-amber-300"
                                        : "bg-gray-50 text-gray-500 hover:text-amber-600 hover:bg-amber-50 border-gray-200",
                                )}
                                aria-pressed={!!hint.revealed}
                                aria-label={hint.revealed ? "Hide hint" : "Show hint"}
                            >
                                {hint.revealed
                                    ? `🔠 ${String(hint.text).toUpperCase()}`
                                    : "💡 Hint"}
                            </button>
                        ) : null}

                        {counter ? (
                            <span
                                className={cn(
                                    "px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider",
                                    t.chip,
                                )}
                            >
                                {counter.label || "Round"} {counter.current}/{counter.total}
                            </span>
                        ) : null}

                        {score ? (
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-700">
                                {score.label || "Score"}: {score.value}
                            </span>
                        ) : null}

                        {hearts ? (
                            <span
                                className="inline-flex items-center gap-0.5 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-rose-50 text-rose-600 border border-rose-100"
                                aria-label={`${hearts.current} of ${hearts.total ?? 3} hearts left`}
                            >
                                {Array.from({ length: hearts.total ?? 3 }).map((_, i) => (
                                    <span
                                        key={i}
                                        className={cn(
                                            "text-sm leading-none",
                                            i < hearts.current ? "" : "grayscale opacity-30",
                                        )}
                                        aria-hidden="true"
                                    >
                                        ❤️
                                    </span>
                                ))}
                            </span>
                        ) : null}
                    </div>
                )}
            </div>

            {/* Helper line + bouncing arrow (optional). */}
            {(helperText || showArrow) ? (
                <div className="flex flex-col items-center gap-0.5 -mb-1">
                    {showArrow ? (
                        <span
                            aria-hidden="true"
                            className="text-2xl leading-none animate-bounceArrow"
                        >
                            👇
                        </span>
                    ) : null}
                    {helperText ? (
                        <p
                            className={cn(
                                "text-[11px] sm:text-xs font-black uppercase tracking-widest text-center",
                                t.promptText,
                            )}
                        >
                            {helperText}
                        </p>
                    ) : null}
                </div>
            ) : null}

            {/* ═══════════════ BODY ═══════════════ */}
            {children}
        </div>
    );
};

export default GameShell;
