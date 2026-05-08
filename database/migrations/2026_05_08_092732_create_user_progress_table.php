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
        Schema::create('user_progress', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('unit_id')->constrained()->cascadeOnDelete();

            // حالة الوحدة: locked (مقفلة), active (متاحة للعب), done (مكتملة)
            $table->enum('status', ['locked', 'active', 'done'])->default('locked');

            // النجوم اللي حققها الطفل بهاي الوحدة تحديداً
            $table->integer('stars_earned')->default(0);

            $table->timestamps();

            // منع تكرار نفس الوحدة لنفس الطفل
            $table->unique(['user_id', 'unit_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('user_progress');
    }
};
