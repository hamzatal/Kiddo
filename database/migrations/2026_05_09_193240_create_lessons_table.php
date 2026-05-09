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
            $table->enum('type', [
                'intro',        // عرض تعريفي / أغنية
                'vocab-game',   // لعبة مفردات
                'phonics-game', // لعبة أصوات
                'story',        // نشاط قصة
                'project',      // نشاط يدوي (craft)
                'review',       // مراجعة
                'quiz'          // ممكن لامتحانات صغيرة داخل الوحدة
            ])->default('vocab-game');

            // JSON flexible config:
            // - الكلمات المستخدمة (ids)
            // - اسم الكومبوننت في الفرونت
            // - audio track code + segments
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
