<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('lessons', function (Blueprint $table) {
            $table->id();

            $table->foreignId('unit_id')
                ->constrained('units')
                ->cascadeOnDelete();

            $table->unsignedInteger('lesson_number'); // 1,2,3...
            $table->string('title'); // e.g. Colours and numbers

            // Flexible lesson type. Kept as a string (not enum) so that new
            // lesson types (e.g. song, picture-dict) don't require a schema migration.
            // See config JSON for per-type settings.
            $table->string('type', 32)->default('vocab-game');

            // JSON flexible config:
            $table->json('config')->nullable();

            $table->timestamps();

            $table->unique(['unit_id', 'lesson_number']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('lessons');
    }
};
