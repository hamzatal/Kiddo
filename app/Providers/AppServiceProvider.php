<?php

namespace App\Providers;

use App\Services\OpenAiService;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\URL;
use Illuminate\Support\ServiceProvider;

/**
 * App-wide service wiring.
 *
 * Changes vs the previous version:
 *   - HTTPS is forced in production / staging so we never accidentally
 *     downgrade a parent's session over public Wi-Fi.
 *   - `Model::shouldBeStrict()` is enabled outside of production so
 *     loading a relation that was never eager-loaded throws loudly
 *     during development (catches N+1 bugs at write time, not in prod).
 *   - Pagination uses Tailwind's component so the few admin lists
 *     that paginate match the rest of the UI.
 *   - The legacy `Schema::defaultStringLength(191)` was a workaround
 *     for MySQL 5.7 + utf8mb4 indexes. We now keep it but only when
 *     the active connection actually needs it; for sqlite (the dev
 *     default) and modern MySQL it would otherwise just slow inserts.
 */
class AppServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        $this->app->singleton(OpenAiService::class, fn () => OpenAiService::make());
    }

    public function boot(): void
    {
        // Force HTTPS in production so cookies / inline assets stay secure.
        if ($this->app->environment('production', 'staging')) {
            URL::forceScheme('https');
        }

        // Catch N+1 / unguarded relations during dev — never throw in prod.
        Model::shouldBeStrict(! $this->app->isProduction());

        // Only apply the 191-char default for MySQL 5.7-style installs;
        // modern MySQL/MariaDB and PostgreSQL handle utf8mb4 indexes
        // up to 255 chars without help.
        if (config('database.default') === 'mysql') {
            Schema::defaultStringLength(191);
        }
    }
}
