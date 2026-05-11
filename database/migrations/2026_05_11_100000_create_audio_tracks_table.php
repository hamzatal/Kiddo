<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Stores every official NCCD audio track for the Team Together 1 curriculum.
 *
 * Each row maps a file on qr.nccd.gov.jo (e.g. p4.2.mp3) to the page
 * and activity it supports in the book, plus the optional locally
 * cached copy under public/assets/audio/nccd/.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('audio_tracks', function (Blueprint $table) {
            $table->id();

            // Stable public code used by seeders and lesson config JSON
            // Format: {BOOK}{PAGE}[_{TRACK}]  e.g. AB4, AB4_2, AB12V (V = video)
            $table->string('code', 32)->unique();

            // Which book + which subfolder on NCCD server
            $table->enum('source', ['ab', 'pb', 'part2', 'new_g1'])
                ->default('ab');
            $table->enum('book_type', ['ab', 'pb'])->default('ab');
            $table->unsignedTinyInteger('semester')->default(1);

            // Page + track ordering inside the page
            $table->unsignedSmallInteger('page');
            $table->unsignedTinyInteger('track_no')->default(1);

            // Human-friendly label + activity hint
            $table->string('label')->nullable();
            $table->enum('kind', [
                'listen_and_point',
                'listen_point_say',
                'listen_and_count',
                'listen_and_read',
                'listen_and_trace',
                'listen_and_circle',
                'listen_and_colour',
                'listen_write_colour',
                'listen_and_match',
                'phonics',
                'story',
                'song',
                'dialogue',
                'revision',
                'other',
            ])->default('other');

            // Remote (always present) and locally cached copy (after download)
            $table->string('url', 512);
            $table->string('local_path', 512)->nullable();
            $table->enum('format', ['mp3', 'mp4'])->default('mp3');

            // Optional metadata populated by the download command
            $table->unsignedInteger('file_size')->nullable();
            $table->unsignedSmallInteger('duration_sec')->nullable();
            $table->timestamp('downloaded_at')->nullable();

            $table->timestamps();

            $table->index(['source', 'page']);
            $table->index(['book_type', 'page', 'track_no']);
        });

        // Link lessons to their primary audio track
        Schema::table('lessons', function (Blueprint $table) {
            $table->foreignId('audio_track_id')
                ->nullable()
                ->after('config')
                ->constrained('audio_tracks')
                ->nullOnDelete();

            // Page number in the book for quick lookups / display
            $table->unsignedSmallInteger('page_number')->nullable()
                ->after('lesson_number');
        });
    }

    public function down(): void
    {
        Schema::table('lessons', function (Blueprint $table) {
            $table->dropConstrainedForeignId('audio_track_id');
            $table->dropColumn('page_number');
        });

        Schema::dropIfExists('audio_tracks');
    }
};
