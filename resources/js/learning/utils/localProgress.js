/**
 * Local progress cache — best-effort browser-side mirror of the
 * server-stored UserProgress.
 *
 * Why this exists:
 *   The server is always the source of truth for stars, XP and
 *   the unlocked-units chain. But during a single lesson session
 *   the React UI wants to:
 *     1. Persist the round-by-round results across page refreshes
 *        (e.g. a parent accidentally hits F5 mid-lesson).
 *     2. Pre-fill the "Continue learning" hint on HomeScreen and
 *        MapScreen without waiting for a network roundtrip.
 *     3. Recover gracefully when the result POST fails — we keep
 *        the rounds in localStorage so the next page load can retry.
 *
 * Storage shape (under key `kiddo:progress:v1`):
 *   {
 *     pendingRounds: { [unitId-lessonId]: { rounds: [...], at: 123 } },
 *     lastUnitId:    number | null,
 *     lastLessonAt:  ISO string | null,
 *   }
 *
 * Everything is JSON-serialisable; the file gracefully no-ops in
 * environments where localStorage is unavailable (private mode,
 * SSR / vitest with jsdom that disables storage).
 */

const STORAGE_KEY = "kiddo:progress:v1";

const safeStorage = (() => {
    try {
        if (typeof window === "undefined") return null;
        const test = "__kiddo_probe__";
        window.localStorage.setItem(test, "1");
        window.localStorage.removeItem(test);
        return window.localStorage;
    } catch {
        return null;
    }
})();

function readState() {
    if (!safeStorage) return defaultState();
    try {
        const raw = safeStorage.getItem(STORAGE_KEY);
        if (!raw) return defaultState();
        const parsed = JSON.parse(raw);
        return {
            ...defaultState(),
            ...(parsed && typeof parsed === "object" ? parsed : {}),
        };
    } catch {
        return defaultState();
    }
}

function writeState(state) {
    if (!safeStorage) return;
    try {
        safeStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
        /* storage full / privacy mode — silently drop */
    }
}

function defaultState() {
    return {
        pendingRounds: {},
        lastUnitId: null,
        lastLessonAt: null,
    };
}

function pendingKey(unitId, lessonId) {
    return `${unitId}-${lessonId}`;
}

// ── Public API ─────────────────────────────────────────────

export function rememberUnit(unitId) {
    const s = readState();
    s.lastUnitId = unitId;
    s.lastLessonAt = new Date().toISOString();
    writeState(s);
}

export function readLastUnit() {
    return readState().lastUnitId;
}

export function stashPendingRounds(unitId, lessonId, rounds) {
    if (!Array.isArray(rounds) || rounds.length === 0) return;
    const s = readState();
    s.pendingRounds[pendingKey(unitId, lessonId)] = {
        rounds,
        at: Date.now(),
    };
    writeState(s);
}

export function readPendingRounds(unitId, lessonId) {
    const s = readState();
    return s.pendingRounds[pendingKey(unitId, lessonId)] ?? null;
}

export function clearPendingRounds(unitId, lessonId) {
    const s = readState();
    delete s.pendingRounds[pendingKey(unitId, lessonId)];
    writeState(s);
}

export function clearAll() {
    if (!safeStorage) return;
    try {
        safeStorage.removeItem(STORAGE_KEY);
    } catch {
        /* ignore */
    }
}

export default {
    rememberUnit,
    readLastUnit,
    stashPendingRounds,
    readPendingRounds,
    clearPendingRounds,
    clearAll,
};
