import React from "react";
import WordPicConnectMode from "@/learning/components/modes/WordPicConnectMode";

/**
 * WordPicConnectRound — arena adapter for the WordPicConnectMode
 * lesson screen.
 *
 * Why an adapter (vs a fresh component)?
 * ──────────────────────────────────────
 *   The lesson version of "connect each word to its picture" is a
 *   self-contained mini-game already — five pairs, draw lines,
 *   sparkle bursts on match. Reimplementing it for the arena would
 *   duplicate ~250 lines of identical logic and double the surface
 *   we'd need to maintain. Instead this adapter:
 *
 *     • Reads `round.pairs` (the arena round shape — same as
 *       memory-flip's pairs array — provided by the controller).
 *     • Reshapes it into the lesson's `deck` shape:
 *           [{ wordId, prompt:{text, imagePath, audioClip} }, ...]
 *     • Wraps the lesson component's `onComplete(summary)` so the
 *       arena's `handleSpecialComplete({correct})` contract still
 *       works — `correct` is true when the kid matched every pair
 *       on the first try.
 *
 * The arena uses this for the `word-pic-connect` style; the lesson
 * controller already routes the same style to WordPicConnectMode
 * directly, so there's only ONE component to keep up to date.
 */
const WordPicConnectRound = ({ round, onComplete }) => {
    const pairs = round?.pairs || [];

    // Reshape the arena's pair list into the lesson's deck format.
    // The lesson component reads { prompt.text, prompt.imagePath,
    // prompt.audioClip, wordId } so we map field-for-field.
    const deck = pairs.map((p) => ({
        wordId: p.wordId,
        prompt: {
            text: p.word,
            imagePath: p.imagePath,
            audioClip: p.audioClip,
        },
    }));

    return (
        <WordPicConnectMode
            lesson={null}
            deck={deck}
            onComplete={(summary) => {
                // Arena treats the round as "correct" only if the
                // kid matched every pair on their first attempt —
                // anything less is still a completion (we don't
                // block progression) but won't earn the round
                // point. Mirrors the strict-correctness rule used
                // by the standard handlePick path.
                const perfect =
                    summary?.correct === summary?.total && summary?.total > 0;
                onComplete?.({ correct: !!perfect });
            }}
        />
    );
};

export default WordPicConnectRound;
