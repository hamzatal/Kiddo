<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Wires individual Word rows to a shared AudioTrack plus a millisecond
 * segment, so we can play "boy", "brother", "cat", "dad" from the same
 * MoE mp3 file (e.g. p6.mp3) with the browser streaming only the needed
 * range. No local download necessary.
 *
 *   words.audio_track_id       -> audio_tracks.id (FK, nullable)
 *   words.segment_start_ms     -> 0       (inclusive)
 *   words.segment_end_ms       -> 1800    (exclusive)
 *
 * If both segment fields are null we play the whole track.
 * If audio_track_id is null we fall back to the legacy audio_path field.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('words', function (Blueprint $table) {
            $table->foreignId('audio_track_id')
                ->nullable()
                ->after('audio_path')
                ->constrained('audio_tracks')
                ->nullOnDelete();

            $table->unsignedInteger('segment_start_ms')->nullable()->after('audio_track_id');
            $table->unsignedInteger('segment_end_ms')->nullable()->after('segment_start_ms');
        });
    }

    public function down(): void
    {
        Schema::table('words', function (Blueprint $table) {
            $table->dropConstrainedForeignId('audio_track_id');
            $table->dropColumn(['segment_start_ms', 'segment_end_ms']);
        });
    }
};
