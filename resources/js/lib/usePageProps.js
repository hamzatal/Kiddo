/**
 * Tiny convenience hooks around `usePage()` so the rest of the
 * codebase doesn't have to thread the same `usePage().props.auth.user`
 * pattern through every component.
 *
 * Why two separate hooks instead of one big context object:
 *   - Re-renders only fire for the slice of props you actually read.
 *   - The shared payload from HandleInertiaRequests::share() is
 *     fully typed in one place; if a key gets renamed we only fix
 *     it here.
 */

import { usePage } from "@inertiajs/react";

export function useAuthUser() {
    const { auth } = usePage().props;
    return auth?.user ?? null;
}

export function useAppMeta() {
    const { app } = usePage().props;
    return (
        app ?? {
            name: "Kiddo",
            env: "production",
            locale: "en",
            csrfToken: "",
        }
    );
}

export function useAiEnabled() {
    const { ai } = usePage().props;
    return Boolean(ai?.enabled);
}

export function useFlashMessages() {
    const { flash } = usePage().props;
    return flash ?? {};
}

/**
 * Streak summary shared by `App\Services\StreakService::summary()`.
 * Returns `null` when the user is signed out.
 *
 * Shape:
 *   {
 *     current: number,
 *     longest: number,
 *     active_today: boolean,
 *     last_activity: string|null,
 *     status: 'fresh' | 'in-grace' | 'broken',
 *     freezes_available: number,
 *   }
 */
export function useStreak() {
    const { streak } = usePage().props;
    return streak ?? null;
}

/**
 * Today's daily-quest payload shared by `DailyQuestService::today()`.
 * Returns `null` when the user is signed out.
 *
 * Shape:
 *   {
 *     date: string,
 *     completed_count: number,
 *     total: number,
 *     all_complete: boolean,
 *     quests: Array<{
 *       id: string, icon: string, title: string, description: string,
 *       goal: number, progress: number, percent: number, completed: boolean
 *     }>
 *   }
 */
export function useDailyQuest() {
    const { dailyQuest } = usePage().props;
    return dailyQuest ?? null;
}
