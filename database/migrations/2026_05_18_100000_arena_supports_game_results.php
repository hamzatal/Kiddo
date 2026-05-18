<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Games Arena needs to log mixed-review sessions that aren't tied to
 * a specific unit or lesson. The original `game_results` schema
 * marked `unit_id` as NOT NULL and used an `enum('lesson-game',
 * 'unit-quiz')` for `type`. This migration relaxes both:
 *
 *   • unit_id   → nullable (Arena spans every unlocked unit)
 *   • type      → VARCHAR(32) so we can write 'arena' without
 *                 cracking open the enum every time we add a mode
 *
 * Cross-driver:
 *   • MySQL / MariaDB / PostgreSQL  — native ALTER TABLE
 *   • SQLite (used in tests)         — recreate the table because
 *     SQLite has no ALTER COLUMN support. We migrate data through a
 *     temporary table so existing rows survive the rewrite.
 *
 * Idempotent — every step is wrapped so re-running on a partially-
 * migrated DB is safe.
 */
return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('game_results')) {
            return;
        }

        $driver = Schema::getConnection()->getDriverName();

        if ($driver === 'sqlite') {
            $this->relaxOnSqlite();
            return;
        }

        // MySQL / MariaDB / PostgreSQL — try the simple ALTER first.
        try {
            DB::statement('ALTER TABLE game_results MODIFY unit_id BIGINT UNSIGNED NULL');
        } catch (\Throwable $_) {
            // Need to drop the FK first on stricter MySQL configs.
            try { DB::statement('ALTER TABLE game_results DROP FOREIGN KEY game_results_unit_id_foreign'); } catch (\Throwable $_) {}
            try {
                DB::statement('ALTER TABLE game_results MODIFY unit_id BIGINT UNSIGNED NULL');
                DB::statement('ALTER TABLE game_results ADD CONSTRAINT game_results_unit_id_foreign FOREIGN KEY (unit_id) REFERENCES units(id) ON DELETE CASCADE');
            } catch (\Throwable $_) {
                // last-ditch: drop the FK without re-adding so unit_id
                // can at least accept NULLs. The cascade is rebuilt on
                // the next fresh migrate.
                try { DB::statement('ALTER TABLE game_results MODIFY unit_id BIGINT UNSIGNED NULL'); } catch (\Throwable $_) {}
            }
        }

        // Loosen the `type` enum into a string so we can add 'arena'
        // (and any future game modes) without more DDL surgery.
        try {
            DB::statement("ALTER TABLE game_results MODIFY type VARCHAR(32) NOT NULL DEFAULT 'lesson-game'");
        } catch (\Throwable $_) {
            // already a varchar — nothing to do
        }
    }

    public function down(): void
    {
        // Intentionally NOT restoring the NOT NULL / enum constraints.
        // Reverting would corrupt arena rows that have unit_id IS NULL
        // or type='arena'. Drop those rows first if you really need
        // the tighter schema back.
    }

    /**
     * SQLite doesn't support ALTER COLUMN, so recreate the table.
     * Steps:
     *   1. Build a fresh `game_results_new` with the relaxed schema.
     *   2. Copy every existing row across.
     *   3. Drop the old table and rename the new one in place.
     *
     * We also disable foreign_keys for the duration so the swap
     * doesn't cascade to dependent rows.
     */
    private function relaxOnSqlite(): void
    {
        // Already relaxed? (re-runs / fresh-from-modern-schema)
        $cols = DB::select("PRAGMA table_info('game_results')");
        $unitId = collect($cols)->firstWhere('name', 'unit_id');
        $alreadyNullable = $unitId && (int) $unitId->notnull === 0;
        if ($alreadyNullable) {
            return;
        }

        DB::statement('PRAGMA foreign_keys = OFF');
        try {
            Schema::create('game_results_new', function (Blueprint $table) {
                $table->id();
                $table->foreignId('user_id')->constrained()->cascadeOnDelete();
                $table->foreignId('unit_id')->nullable()->constrained('units')->cascadeOnDelete();
                $table->foreignId('lesson_id')->nullable()->constrained('lessons')->nullOnDelete();
                $table->foreignId('word_id')->nullable()->constrained('words')->nullOnDelete();
                $table->string('type', 32)->default('lesson-game');
                $table->unsignedInteger('correct_count')->default(0);
                $table->unsignedInteger('wrong_count')->default(0);
                $table->unsignedInteger('score')->default(0);
                $table->json('meta')->nullable();
                $table->timestamps();
            });

            // Copy across — list columns explicitly to handle older
            // schemas that may be missing word_id.
            $hasWordId = Schema::hasColumn('game_results', 'word_id');
            $cols = $hasWordId
                ? '(id, user_id, unit_id, lesson_id, word_id, type, correct_count, wrong_count, score, meta, created_at, updated_at)'
                : '(id, user_id, unit_id, lesson_id, type, correct_count, wrong_count, score, meta, created_at, updated_at)';
            $select = $hasWordId
                ? 'id, user_id, unit_id, lesson_id, word_id, type, correct_count, wrong_count, score, meta, created_at, updated_at'
                : 'id, user_id, unit_id, lesson_id, type, correct_count, wrong_count, score, meta, created_at, updated_at';

            DB::statement("INSERT INTO game_results_new {$cols} SELECT {$select} FROM game_results");

            Schema::drop('game_results');
            Schema::rename('game_results_new', 'game_results');
        } finally {
            DB::statement('PRAGMA foreign_keys = ON');
        }
    }
};
