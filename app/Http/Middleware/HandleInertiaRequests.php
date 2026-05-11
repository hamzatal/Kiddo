<?php

namespace App\Http\Middleware;

use App\Services\OpenAiService;
use Illuminate\Http\Request;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    protected $rootView = 'app';

    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    public function share(Request $request): array
    {
        /** @var OpenAiService $ai */
        $ai = app(OpenAiService::class);

        return array_merge(parent::share($request), [
            'auth' => [
                'user' => $request->user()
                    ? $request->user()->only('id', 'name', 'level', 'total_stars', 'xp')
                    : null,
            ],

            // Lets the UI conditionally show the Fox/AI widgets.
            // If no OPENAI_API_KEY is set, the endpoints still work with
            // safe canned replies, but we mark this as "offline" so the
            // UI can show a subtle "Offline helper" label.
            'ai' => [
                'enabled' => $ai->isConfigured(),
            ],

            'flash' => [
                'lessonResult' => fn () => $request->session()->get('lessonResult'),
                'quizResult'   => fn () => $request->session()->get('quizResult'),
            ],
        ]);
    }
}
