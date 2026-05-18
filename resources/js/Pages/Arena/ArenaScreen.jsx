import React, { useEffect, useMemo, useRef, useState } from "react";
import { router, usePage } from "@inertiajs/react";
import AppHeader from "@/learning/components/ui/AppHeader";
import { stopAllAudio } from "@/learning/utils/playAudio";
import { playClick, playCheer, playStarCollect, playMagic } from "@/learning/utils/soundEffects";
import { launchConfetti } from "@/learning/utils/confetti";

// Reuse the SAME mode components that power lessons. Zero
// duplication: every game in the Arena is just the lesson mode
// fed a deck built from cross-unit vocabulary.
import VocabGameMode      from "@/learning/components/modes/VocabGameMode";
import ListeningGameMode  from "@/learning/components/modes/ListeningGameMode";
import MemoryGameMode     from "@/learning/components/modes/MemoryGameMode";
import PictureMatchMode   from "@/learning/components/modes/PictureMatchMode";
import MatchConnectMode   from "@/learning/components/modes/MatchConnectMode";
import WordPicConnectMode from "@/learning/components/modes/WordPicConnectMode";
import BubblePopMode      from "@/learning/components/modes/BubblePopMode";
import SpeedTapMode       from "@/learning/components/modes/SpeedTapMode";
import DragDropMode       from "@/learning/components/modes/DragDropMode";

/**
 * ArenaScreen v4 — Real Games Arena.
 *
 * Two screens in one page (the server decides which by setting
 * `arena.mode`):
 *
 *   1. PICKER — a grid of mini-game cards. The kid sees what's
 *      available, taps one, and Inertia visits /arena/play/{key}.
 *
 *   2. PLAY   — renders the lesson's existing mode component for
 *      the chosen game (MemoryGame, BubblePop, etc.) using a deck
 *      built server-side from every unlocked unit's vocabulary.
 *      When the round finishes we POST to /arena/submit and bounce
 *      back to the picker with a celebration overlay.
 *
 * No more "4 generic styles in one screen". No more game-mode
 * code duplicated between Lesson and Arena. Adding a new game is
 * a single line in `GamesArenaController::availableGames()`.
 */

const MODE_COMPONENT = {
    "vocab-game":       VocabGameMode,
    "listening-game":   ListeningGameMode,
    "memory-game":      MemoryGameMode,
    "picture-match":    PictureMatchMode,
    "match-connect":    MatchConnectMode,
    "word-pic-connect": WordPicConnectMode,
    "bubble-pop":       BubblePopMode,
    "speed-tap":        SpeedTapMode,
    "drag-drop":        DragDropMode,
};

const ArenaScreen = ({ arena }) => {
    const { auth, flash } = usePage().props || {};
    const arenaResult     = flash?.arenaResult;

    const games          = arena?.games || [];
    const wordsAvailable = arena?.wordsAvailable || 0;
    const unlockedUnits  = arena?.unlockedUnits || 0;
    const totalUnits     = arena?.totalUnits || 0;
    const vocabPlayed    = arena?.vocabPlayed || 0;
    const mode           = arena?.mode || null;
    const gameKey        = arena?.gameKey || null;
    const gameMeta       = arena?.gameMeta || null;
    const deck           = arena?.deck || [];

    // Showing the picker, not playing yet
    const isPicker = !mode;

    // Stop any audio when the page unmounts so we don't leak it
    // between picker → game → picker transitions.
    useEffect(() => () => stopAllAudio(), []);

    // ───────────────────────────────────────────────
    // Result celebration (after a /arena/submit redirect)
    // ───────────────────────────────────────────────
    const [showResult, setShowResult] = useState(false);
    useEffect(() => {
        if (arenaResult) {
            setShowResult(true);
            playCheer();
            launchConfetti(2500);
            setTimeout(() => playStarCollect(), 600);
            setTimeout(() => playStarCollect(), 1000);
            setTimeout(() => playStarCollect(), 1400);
        }
    }, [arenaResult]);

    return (
        <div className="h-[100dvh] w-screen font-sans flex flex-col overflow-hidden relative bg-gradient-to-br from-purple-50 via-white to-amber-50">
            {/* Soft background blobs (purely decorative) */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
                <div className="absolute top-[-5%] left-[-5%] w-72 h-72 bg-purple-200/40 rounded-full blur-3xl" />
                <div className="absolute bottom-[-5%] right-[-5%] w-64 h-64 bg-amber-200/40 rounded-full blur-3xl" />
                <div className="absolute top-[40%] left-[60%] w-56 h-56 bg-cyan-200/40 rounded-full blur-2xl" />
            </div>

            <AppHeader
                unitTitle="Games Arena"
                lessonTitle={isPicker ? "Choose a game" : (gameMeta?.label || "Mixed practice")}
                modeLabel={isPicker ? "Hub" : gameMeta?.label}
                modeIcon={isPicker ? "🎮" : (gameMeta?.emoji || "🎮")}
                modeColor={isPicker ? "#9333EA" : (gameMeta?.color || "#9333EA")}
                current={0}
                total={0}
                totalStars={auth?.user?.total_stars}
                xp={auth?.user?.xp}
                onBack={() => isPicker ? router.visit("/map") : router.visit("/arena")}
            />

            <main className="flex-1 min-h-0 relative z-10 overflow-y-auto">
                <div className="min-h-full w-full flex items-start sm:items-center justify-center p-3 sm:p-4 lg:p-6">
                    {isPicker ? (
                        <Picker
                            games={games}
                            unlockedUnits={unlockedUnits}
                            totalUnits={totalUnits}
                            wordsAvailable={wordsAvailable}
                            vocabPlayed={vocabPlayed}
                        />
                    ) : (
                        <Play
                            mode={mode}
                            gameKey={gameKey}
                            gameMeta={gameMeta}
                            deck={deck}
                        />
                    )}
                </div>
            </main>

            {/* Result celebration overlay (after /arena/submit) */}
            {showResult && arenaResult ? (
                <ResultOverlay
                    result={arenaResult}
                    games={games}
                    onClose={() => setShowResult(false)}
                />
            ) : null}
        </div>
    );
};

/* ═══════════════════════════════════════════════════════════
   PICKER — grid of mini-game cards
   ═══════════════════════════════════════════════════════════ */
function Picker({ games, unlockedUnits, totalUnits, wordsAvailable, vocabPlayed }) {
    const empty = wordsAvailable < 4;

    if (empty) {
        return (
            <div className="text-center max-w-sm w-full bg-white/95 backdrop-blur-xl rounded-3xl p-6 sm:p-8 shadow-xl border border-white/60">
                <span className="text-6xl block mb-3">🎮</span>
                <h2 className="text-2xl font-black text-gray-800 mb-2">Almost there!</h2>
                <p className="text-sm text-gray-500 font-bold mb-5">
                    Finish at least one lesson to unlock the Games Arena.
                </p>
                <button
                    onClick={() => { playClick(); router.visit("/map"); }}
                    className="w-full px-6 py-3 bg-gradient-to-r from-purple-500 to-indigo-600 text-white rounded-2xl font-black shadow-md"
                >
                    ← Back to Map
                </button>
            </div>
        );
    }

    return (
        <div className="w-full max-w-5xl flex flex-col items-center gap-4 sm:gap-5 animate-fade-in">
            {/* Hero strip — quick stats so the kid feels the
                 progress, no internal scroll needed. */}
            <div className="w-full max-w-3xl bg-white/95 backdrop-blur-xl rounded-2xl shadow-md border border-white/60 px-4 sm:px-6 py-3 sm:py-4 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                    <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-br from-fuchsia-500 to-pink-500 flex items-center justify-center text-2xl sm:text-3xl shadow-md shrink-0">
                        🎮
                    </div>
                    <div className="min-w-0">
                        <p className="text-[10px] font-black text-fuchsia-500 uppercase tracking-widest">Mixed practice</p>
                        <h1 className="text-lg sm:text-2xl font-black text-[#1E293B] truncate">Pick a game!</h1>
                    </div>
                </div>
                <div className="flex flex-wrap gap-2">
                    <Stat icon="📚" value={`${unlockedUnits}/${totalUnits}`} label="Units" tone="indigo" />
                    <Stat icon="🔤" value={wordsAvailable} label="Words" tone="emerald" />
                    <Stat icon="⚡" value={vocabPlayed} label="Played" tone="amber" />
                </div>
            </div>

            {/* The actual game grid. mx-auto + justify-items-center
                 keeps the cards centred even with an odd row count. */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 w-full max-w-4xl mx-auto justify-items-center">
                {games.map((g) => (
                    <GameCard key={g.key} game={g} />
                ))}
            </div>

            <p className="text-[11px] sm:text-xs text-gray-500 font-bold text-center">
                Each game pulls vocabulary from every unit you've unlocked.
            </p>

            <style>{`
                @keyframes arena-fade-in {
                    from { opacity: 0; transform: translateY(8px); }
                    to   { opacity: 1; transform: translateY(0); }
                }
                .animate-fade-in { animation: arena-fade-in 280ms ease-out forwards; }
            `}</style>
        </div>
    );
}

function Stat({ icon, value, label, tone }) {
    const tones = {
        indigo:  "bg-indigo-50 border-indigo-200 text-indigo-700",
        emerald: "bg-emerald-50 border-emerald-200 text-emerald-700",
        amber:   "bg-amber-50 border-amber-200 text-amber-700",
    };
    return (
        <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border ${tones[tone] || tones.indigo}`}>
            <span className="text-sm leading-none">{icon}</span>
            <span className="text-xs font-black">{value}</span>
            <span className="text-[9px] font-black uppercase tracking-widest opacity-80 hidden sm:inline">{label}</span>
        </div>
    );
}

function GameCard({ game }) {
    return (
        <button
            type="button"
            onClick={() => {
                playClick();
                playMagic();
                router.visit(`/arena/play/${game.key}`);
            }}
            className="group relative w-full aspect-[5/6] sm:aspect-[4/5] rounded-2xl sm:rounded-3xl overflow-hidden bg-white border-2 border-white shadow-lg hover:shadow-2xl hover:-translate-y-1 active:translate-y-0 transition-all duration-300"
            style={{
                // Hold the gradient on the button so we can layer
                // it over the background image without runtime CSS.
                backgroundImage: `linear-gradient(135deg, ${game.color}1A 0%, ${game.color}33 100%)`,
            }}
        >
            {/* Big emoji badge */}
            <div
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-[55%] w-20 h-20 sm:w-24 sm:h-24 rounded-3xl flex items-center justify-center text-4xl sm:text-5xl shadow-xl border-4 border-white group-hover:scale-110 transition-transform duration-300"
                style={{ backgroundColor: game.color }}
            >
                {game.emoji}
            </div>

            {/* Bottom info ribbon */}
            <div className="absolute inset-x-0 bottom-0 px-3 py-2.5 sm:py-3 bg-white/95 backdrop-blur border-t-2 border-white">
                <p className="text-sm sm:text-base font-black text-[#1E293B] text-center truncate">{game.label}</p>
                <p className="text-[10px] sm:text-[11px] font-bold text-gray-500 text-center leading-tight mt-0.5 line-clamp-2">
                    {game.desc}
                </p>
            </div>

            {/* Sparkle accent */}
            <span className="absolute top-2 right-2 text-base opacity-70 group-hover:opacity-100 group-hover:rotate-12 transition-all">✨</span>
        </button>
    );
}

/* ═══════════════════════════════════════════════════════════
   PLAY — render the chosen mode with the server-built deck
   ═══════════════════════════════════════════════════════════ */
function Play({ mode, gameKey, gameMeta, deck }) {
    const startedAtRef = useRef(Date.now());

    // The lesson mode components expect a `lesson` prop with a
    // config block. Build a minimal synthetic one so prompts /
    // labels read naturally inside the Arena context.
    const syntheticLesson = useMemo(
        () => ({
            id:     null,
            number: 1,
            title:  gameMeta?.label || "Arena",
            type:   mode,
            config: {
                mode,
                prompt:    gameMeta?.desc || "Have fun!",
                rounds:    gameMeta?.rounds || 6,
            },
        }),
        [mode, gameMeta?.label, gameMeta?.desc, gameMeta?.rounds]
    );

    const Component = MODE_COMPONENT[mode];

    if (!Component) {
        // Unknown mode — gracefully send the kid back to the picker.
        return (
            <div className="text-center max-w-sm w-full bg-white/95 backdrop-blur-xl rounded-3xl p-6 sm:p-8 shadow-xl border border-white/60">
                <span className="text-5xl block mb-3">🤔</span>
                <h2 className="text-xl font-black text-gray-800 mb-2">Game not found</h2>
                <p className="text-sm text-gray-500 font-bold mb-4">
                    That game isn't ready yet. Try another!
                </p>
                <button
                    onClick={() => router.visit("/arena")}
                    className="w-full px-6 py-3 bg-gradient-to-r from-purple-500 to-indigo-600 text-white rounded-2xl font-black shadow-md"
                >
                    ← Pick another game
                </button>
            </div>
        );
    }

    if (!deck.length) {
        return (
            <div className="text-center max-w-sm w-full bg-white/95 backdrop-blur-xl rounded-3xl p-6 sm:p-8 shadow-xl border border-white/60">
                <span className="text-5xl block mb-3">📚</span>
                <h2 className="text-xl font-black text-gray-800 mb-2">No words yet!</h2>
                <p className="text-sm text-gray-500 font-bold mb-4">
                    Finish a lesson first so we have something to play with.
                </p>
                <button
                    onClick={() => router.visit("/arena")}
                    className="w-full px-6 py-3 bg-gradient-to-r from-purple-500 to-indigo-600 text-white rounded-2xl font-black shadow-md"
                >
                    ← Back to games
                </button>
            </div>
        );
    }

    /**
     * The mode components call this when the kid finishes a session.
     * We POST the per-round results so the controller can persist
     * them + award XP. The redirect back to /arena triggers the
     * celebration overlay via the flash bag.
     */
    const handleComplete = (summary) => {
        const rounds = Array.isArray(summary?.rounds) ? summary.rounds : [];
        router.post("/arena/submit", {
            game:       gameKey,
            rounds,
            durationMs: Date.now() - startedAtRef.current,
        }, {
            preserveScroll: true,
        });
    };

    return (
        <div className="w-full flex flex-col items-center gap-3 sm:gap-4 animate-fade-in">
            <Component
                lesson={syntheticLesson}
                deck={deck}
                onComplete={handleComplete}
                promptText={gameMeta?.desc}
                audioTrack={null}
                intro={null}
            />
            <button
                onClick={() => { playClick(); router.visit("/arena"); }}
                className="text-[11px] sm:text-xs font-black text-gray-500 hover:text-purple-600 underline underline-offset-2"
            >
                ← Back to games
            </button>
            <style>{`
                @keyframes arena-fade-in {
                    from { opacity: 0; transform: translateY(8px); }
                    to   { opacity: 1; transform: translateY(0); }
                }
                .animate-fade-in { animation: arena-fade-in 240ms ease-out forwards; }
            `}</style>
        </div>
    );
}

/* ═══════════════════════════════════════════════════════════
   ResultOverlay — celebration card after /arena/submit
   ═══════════════════════════════════════════════════════════ */
function ResultOverlay({ result, games, onClose }) {
    const correct = result.correct ?? 0;
    const total   = result.total   ?? 1;
    const percent = result.percent ?? 0;
    const stars   = percent >= 90 ? 3 : percent >= 70 ? 2 : 1;
    const xpBonus = Math.min(50, correct * 5);
    const game    = result.game ? games.find((g) => g.key === result.game) : null;

    return (
        <div
            className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
            onClick={onClose}
        >
            <div
                onClick={(e) => e.stopPropagation()}
                className="w-full max-w-sm bg-white/95 backdrop-blur-xl rounded-3xl p-5 sm:p-7 flex flex-col items-center text-center shadow-2xl border border-white/60 animate-arena-pop"
            >
                <div
                    className="w-20 h-20 sm:w-24 sm:h-24 rounded-full flex items-center justify-center shadow-inner border-4 border-white -mt-12 mb-3"
                    style={{
                        backgroundImage: `linear-gradient(135deg, ${(game?.color || "#9333EA")}33 0%, #FFFFFF 100%)`,
                    }}
                >
                    <span className="text-4xl sm:text-5xl">{game?.emoji || "🏆"}</span>
                </div>

                <h1 className="text-xl sm:text-3xl font-black text-gray-800 mb-1">
                    {percent >= 90 ? "Brilliant!" : percent >= 70 ? "Nice job!" : "Good try!"}
                </h1>
                {game ? (
                    <p className="text-[10px] font-black uppercase tracking-widest text-fuchsia-500 mb-1">
                        {game.label}
                    </p>
                ) : null}
                <p className="text-xs sm:text-sm text-gray-500 font-bold mb-3">
                    You got <span className="text-emerald-500 font-black">{correct}</span> / <span className="font-black">{total}</span> right.
                </p>

                <div className="flex items-center gap-2 sm:gap-3 mb-4">
                    {[1, 2, 3].map((s) => (
                        <span
                            key={s}
                            className={`text-3xl sm:text-4xl transition-all duration-500 ${
                                s <= stars ? "opacity-100 scale-110" : "opacity-20 grayscale scale-75"
                            }`}
                        >⭐</span>
                    ))}
                </div>

                <div className="grid grid-cols-2 gap-2 w-full mb-4">
                    <div className="bg-emerald-50 border border-emerald-100 p-2.5 rounded-2xl text-center">
                        <p className="text-[9px] font-black text-emerald-600 uppercase tracking-wider mb-0.5">Score</p>
                        <p className="text-base sm:text-xl font-black text-emerald-600">{percent}%</p>
                    </div>
                    <div className="bg-purple-50 border border-purple-100 p-2.5 rounded-2xl text-center">
                        <p className="text-[9px] font-black text-purple-600 uppercase tracking-wider mb-0.5">Bonus XP</p>
                        <p className="text-base sm:text-xl font-black text-purple-600">+{xpBonus}</p>
                    </div>
                </div>

                <div className="flex flex-col gap-2 w-full">
                    {game ? (
                        <button
                            onClick={() => { playClick(); router.visit(`/arena/play/${game.key}`); }}
                            className="w-full bg-gradient-to-r from-fuchsia-500 to-pink-500 text-white py-2.5 rounded-2xl font-black text-sm shadow-md"
                        >
                            Play again
                        </button>
                    ) : null}
                    <button
                        onClick={() => { playClick(); router.visit("/arena"); }}
                        className="w-full bg-gradient-to-r from-emerald-500 to-green-600 text-white py-2.5 rounded-2xl font-black text-sm shadow-md"
                    >
                        Pick another game →
                    </button>
                    <button
                        onClick={() => { playClick(); router.visit("/map"); }}
                        className="w-full bg-white border border-gray-200 text-gray-700 py-2 rounded-2xl font-black text-xs"
                    >
                        Back to map
                    </button>
                </div>

                <style>{`
                    @keyframes arena-pop {
                        0%   { opacity: 0; transform: scale(.85) translateY(15px); }
                        60%  { transform: scale(1.04) translateY(-4px); }
                        100% { opacity: 1; transform: scale(1) translateY(0); }
                    }
                    .animate-arena-pop { animation: arena-pop .55s cubic-bezier(.34,1.56,.64,1) forwards; }
                `}</style>
            </div>
        </div>
    );
}

export default ArenaScreen;
