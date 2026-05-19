<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Cache + cache_locks tables.
 *
 * Why this migration exists at all:
 *   The project's config/cache.php defaults to the `database` store
 *   (env CACHE_STORE=database) and StreakService::today() / DailyQuestService::for()
 *   call Cache::remember(), which under the database driver writes
 *   to a `cache` table.
 *
 *   Laravel 11 ships these migrations by default in fresh installs,
 *   but this project was scaffolded without them — so any user-facing
 *   page that touched the streak/daily-quest cache crashed with
 *
 *       SQLSTATE[42S02]: Base table or view not found: 1146
 *       Table 'kiddo.cache' doesn't exist
 *
 *   This migration replays the canonical Laravel 11 schema so the
 *   database driver works out of the box.
 */
return new class extends Migration {
    public function up(): void
    {
        Schema::create('cache', function (Blueprint $table) {
            // Cache keys can include a long prefix (e.g. "kiddo:streak:v1:1");
            // 255 chars is Laravel's default and matches the index limit
            // for utf8mb4 on MySQL ≤ 5.7. Adjust upward only if you raise
            // innodb_large_prefix.
            $table->string('key')->primary();
            $table->mediumText('value');
            $table->integer('expiration');
        });

        Schema::create('cache_locks', function (Blueprint $table) {
            $table->string('key')->primary();
            $table->string('owner');
            $table->integer('expiration');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('cache');
        Schema::dropIfExists('cache_locks');
    }
};
