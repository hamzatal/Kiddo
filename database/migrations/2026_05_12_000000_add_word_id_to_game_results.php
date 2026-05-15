<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * FIX 8 — Error analytics for Parent Dashboard.
 *
 * Adds a nullable `word_id` column to game_results so we can join
 * round outcomes back to a specific word. The existing `meta` JSON
 * column already accepts a `word_errors` array; this column gives
 * us a fast indexed path for the weakWords aggregation queries.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('game_results', function (Blueprint $table) {
            // foreignId so cascades stay clean when a word is removed; the
            // dashboard counts use word_errors[] in meta as the canonical
            // source — this column is just a convenience index.
            $table->foreignId('word_id')
                ->nullable()
                ->after('lesson_id')
                ->constrained('words')
                ->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('game_results', function (Blueprint $table) {
            if (Schema::hasColumn('game_results', 'word_id')) {
                // Drop FK then column. Wrapped in a try in case the FK
                // name doesn't exist (sqlite testing path).
                try {
                    $table->dropForeign(['word_id']);
                } catch (\Throwable $e) {
                    // ignore — sqlite doesn't enforce named FKs
                }
                $table->dropColumn('word_id');
            }
        });
    }
};
