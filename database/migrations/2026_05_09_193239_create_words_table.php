<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('words', function (Blueprint $table) {
            $table->id();
            $table->foreignId('unit_id')
                ->constrained('units')
                ->cascadeOnDelete();

            $table->string('word');
            $table->enum('type', ['vocab', 'phonics', 'cvc', 'sentence'])
                ->default('vocab');

            // يمكن أن يكون المسار داخلي أو URL خارجي (QR audio)
            $table->string('audio_path')->nullable();
            $table->string('image_path')->nullable();

            // خيارات خاطئة للاستخدام في الألعاب/الكويز
            // مثال: [{ "word": "Blue", "image_path": "..." }, ...]
            $table->json('wrong_options')->nullable();

            // ملاحظات إضافية (مثلاً: belongs_to "Colours and numbers")
            $table->string('category')->nullable();

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('words');
    }
};
