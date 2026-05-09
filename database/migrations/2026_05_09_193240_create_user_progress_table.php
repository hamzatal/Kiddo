<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('user_progress', function (Blueprint $table) {
            $table->id();

            $table->foreignId('user_id')
                ->constrained()
                ->cascadeOnDelete();

            $table->foreignId('unit_id')
                ->constrained('units')
                ->cascadeOnDelete();

            $table->enum('status', ['locked', 'active', 'done'])
                ->default('locked');

            // الدرس الحالي داخل الوحدة (mini-lesson)
            $table->unsignedInteger('current_lesson')->default(1);

            // عدد النجوم اللي أخذها في هذه الوحدة
            $table->unsignedInteger('stars_earned')->default(0);

            $table->timestamp('last_activity_at')->nullable();

            $table->timestamps();

            $table->unique(['user_id', 'unit_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('user_progress');
    }
};
