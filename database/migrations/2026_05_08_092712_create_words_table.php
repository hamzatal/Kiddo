<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('words', function (Blueprint $table) {
            $table->id();
            $table->foreignId('unit_id')->constrained()->cascadeOnDelete(); // مربوط بالوحدة

            $table->string('word'); // الكلمة (مثلاً: Pencil)
            $table->string('image_path'); // صورة الكلمة
            $table->string('audio_path')->nullable(); // ملف الصوت (عشان الطفل يسمع اللفظ الصحيح)

            // مصفوفة الخيارات الخاطئة (عشان ألعاب السحب والإفلات تعتمد عليها كتمويه)
            $table->json('wrong_options')->nullable();

            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('words');
    }
};
