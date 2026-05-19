<?php

namespace App\Http\Middleware;

use App\Services\DailyQuestService;
use App\Services\OpenAiService;
use App\Services\StreakService;
use Illuminate\Http\Request;
use Inertia\Middleware;

/**
 * Inertia middleware — defines the props that ship with every
 * Inertia response.
 *
 * What's new in this rewrite:
 *   - Explicit CSRF token + locale + app_name + app_version exposed
 *     under `props.app` so the React layer doesn't have to scrape
 *     the DOM for them.
 *   - Auth payload now includes `avatar` and `sound_enabled` so
 *     the navbar/lesson screens can render personalised UI without
 *     a separate roundtrip.
 *   - `flash.error` / `flash.success` shared so toast notifications
 *     appear automatically after redirects.
 *   - `streak` + `dailyQuest` props (Streaks + Daily Quest feature)
 *     are shared lazily — only computed for signed-in users, and
 *     memoised by their respective services with a short cache.
 *   - `errors` already shared by parent::share — kept verbatim.
 */
class HandleInertiaRequests extends Middleware
{
    protected $rootView = 'app';

    public function version(Request $request): ?string
    {
        // Tie the asset version to the build manifest hash so cached
        // pages auto-refresh when a new deploy ships.
        $manifestPath = public_path('build/manifest.json');
        if (is_file($manifestPath)) {
            return md5_file($manifestPath) ?: parent::version($request);
        }
        return parent::version($request);
    }

    public function share(Request $request): array
    {
        /** @var OpenAiService $ai */
        $ai = app(OpenAiService::class);
        /** @var StreakService $streak */
        $streak = app(StreakService::class);
        /** @var DailyQuestService $dailyQuest */
        $dailyQuest = app(DailyQuestService::class);

        $user = $request->user();

        return array_merge(parent::share($request), [
            'app' => [
                'name'      => config('app.name', 'Kiddo'),
                'env'       => config('app.env'),
                'locale'    => app()->getLocale(),
                'csrfToken' => $request->session()?->token() ?? csrf_token(),
            ],

            'auth' => [
                'user' => $user
                    ? [
                        'id'            => $user->id,
                        'name'          => $user->name,
                        'level'         => $user->level,
                        'total_stars'   => $user->total_stars,
                        'xp'            => $user->xp,
                        'role'          => $user->role,
                        'avatar'        => $user->avatar,
                        'sound_enabled' => $user->sound_enabled ?? true,
                        'isAdmin'       => method_exists($user, 'isAdmin') ? $user->isAdmin() : false,
                    ]
                    : null,
            ],

            // Lets the UI conditionally show the Fox/AI widgets.
            // If no OPENAI_API_KEY is set, the endpoints still work
            // with safe canned replies, but we mark this as "offline"
            // so the UI can show a subtle "Offline helper" label.
            'ai' => [
                'enabled' => $ai->isConfigured(),
            ],

            // ─── Streaks + Daily Quest ──────────────────────────
            //
            // Both are *closures* so unauthenticated visitors don't
            // pay for the lookup, and signed-in visitors only pay
            // for it on the (rare) full-page load — Inertia partial
            // reloads can opt out via `only` exclusions.
            //
            // Both services memoise internally with a short TTL so
            // even back-to-back navigations stay cheap.
            'streak' => fn () => $user
                ? $streak->summary($user)
                : null,

            'dailyQuest' => fn () => $user
                ? $dailyQuest->today($user)
                : null,

            'flash' => [
                'lessonResult' => fn () => $request->session()->get('lessonResult'),
                'quizResult'   => fn () => $request->session()->get('quizResult'),
                'success'      => fn () => $request->session()->get('success'),
                'error'        => fn () => $request->session()->get('error'),
                'info'         => fn () => $request->session()->get('info'),
            ],
        ]);
    }
}
