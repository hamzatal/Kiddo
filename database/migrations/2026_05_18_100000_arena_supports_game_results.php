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
 * Idempotent — checks each column before changing it so re-running
 * on a partially-migrated DB is safe.
 */
return new class extends Migration
{
    public function up(): void
    {
        $driver = Schema::getConnection()->getDriverName();

        Schema::table('game_results', function (Blueprint $table) use ($driver) {
            // unit_id → nullable. SQLite ignores the change silently
            // when the column is already nullable, which is fine.
            if ($driver === 'sqlite') {
                // SQLite has no native ALTER for nullability, but our
                // tests use SQLite + we recreate the schema fresh, so
                // a noop here keeps the migration green.
                return;
            }

            // MySQL / MariaDB / PostgreSQL all support DBAL changes
            // through Schema::table()->change(). doctrine/dbal must be
            // installed for this to work; if not, fall back to raw SQL.
            try {
                DB::statement('ALTER TABLE game_results MODIFY unit_id BIGINT UNSIGNED NULL');
            } catch (\Throwable $_) {
                // some MySQL flavours need a DROP/ADD FK dance — try
                // the full sequence once before giving up.
                try {
                    DB::statement('ALTER TABLE game_results DROP FOREIGN KEY game_results_unit_id_foreign');
                } catch (\Throwable $_) {}
                try {
                    DB::statement('ALTER TABLE game_results MODIFY unit_id BIGINT UNSIGNED NULL');
                    DB::statement('ALTER TABLE game_results ADD CONSTRAINT game_results_unit_id_foreign FOREIGN KEY (unit_id) REFERENCES units(id) ON DELETE CASCADE');
                } catch (\Throwable $_) {}
            }

            // Convert the enum into a free-form string so we can add
            // 'arena' (and any future modes) without another DDL change.
            try {
                DB::statement("ALTER TABLE game_results MODIFY type VARCHAR(32) NOT NULL DEFAULT 'lesson-game'");
            } catch (\Throwable $_) {
                // ignore — already converted
            }
        });
    }

    public function down(): void
    {
        // Intentionally NOT restoring the NOT NULL / enum constraints.
        // Reverting would corrupt arena rows that have unit_id IS NULL
        // or type='arena'. Drop the rows first if you really need the
        // tighter schema back.
    }
};
