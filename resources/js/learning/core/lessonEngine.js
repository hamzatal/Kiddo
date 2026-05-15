/**
 * Small pure helpers used by the LessonScreen v2 engine.
 * These are deliberately framework-agnostic so we can unit-test them.
 */

/**
 * Map a lesson.type / lesson.config.mode string to the canonical
 * mode the React engine will render. Falls back to 'vocab-game'
 * so a misconfigured lesson is still playable.
 */
export const resolveMode = (lesson) => {
    const m = lesson?.config?.mode || lesson?.type;
    const known = [
        "intro",
        "vocab-game",
        "phonics-game",
        "review",
        "story",
        "song",
        "project",
        "picture-dict",
        "draw-circle",
        "match-connect",
        "memory-game",
        "listening-game",
        "drag-drop",
        "picture-match",
        "word-pic-connect",
    ];
    return known.includes(m) ? m : "vocab-game";
};

/**
 * Given a list of round results ({ correct, timeMs }), compute
 * accuracy and stars. First-grader-friendly: no zero-star ending.
 */
export const computeRoundStars = (results, lessonType = "vocab-game") => {
    if (!results?.length) return 1;
    const correct = results.filter((r) => r?.correct).length;
    const pct = (correct / results.length) * 100;

    if (lessonType === "intro" || lessonType === "picture-dict" || lessonType === "project") {
        return 1; // completion badge for non-scored modes
    }

    if (pct >= 90) return 3;
    if (pct >= 70) return 2;
    return 1;
};

/**
 * Child-facing mode descriptor used by the header / progress pills.
 * Kept short and iconic so it reads well at 10px.
 */
export const modeMeta = (mode) => {
    const map = {
        "intro":          { label: "Learn",   icon: "📖", color: "#7C3AED" },
        "vocab-game":     { label: "Play",    icon: "🎮", color: "#10B981" },
        "phonics-game":   { label: "Phonics", icon: "🔤", color: "#F59E0B" },
        "review":         { label: "Review",  icon: "🔁", color: "#0EA5E9" },
        "story":          { label: "Story",   icon: "📚", color: "#EC4899" },
        "song":           { label: "Sing",    icon: "🎵", color: "#8B5CF6" },
        "project":        { label: "Project", icon: "✂️", color: "#F97316" },
        "picture-dict":   { label: "Trace",   icon: "✏️", color: "#14B8A6" },
        "draw-circle":    { label: "Circle",  icon: "⭕", color: "#EF4444" },
        "match-connect":  { label: "Match",   icon: "🔗", color: "#0EA5E9" },
        "memory-game":    { label: "Memory",  icon: "🧠", color: "#F59E0B" },
        "listening-game": { label: "Listen",  icon: "👂", color: "#06B6D4" },
        "drag-drop":      { label: "Sort",    icon: "🎯", color: "#8B5CF6" },
        "picture-match":  { label: "Pairs",   icon: "🎴", color: "#EC4899" },
        "word-pic-connect": { label: "Connect", icon: "🔗", color: "#06B6D4" },
    };
    return map[mode] || map["vocab-game"];
};

/**
 * Tiny 3-stage wrapper used by intro-like modes so the Learn→Play→
 * Reward narrative still holds for the kid even when the middle
 * "Play" is a story or a picture dictionary.
 */
export const LESSON_STAGES = {
    LEARN:  "learn",
    PLAY:   "play",
    REWARD: "reward",
};

export default {
    resolveMode,
    computeRoundStars,
    modeMeta,
    LESSON_STAGES,
};
