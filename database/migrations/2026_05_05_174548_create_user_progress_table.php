<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('user_progress', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->integer('unit_id'); // رقم الوحدة (1 للترحيب، 2 للعائلة، إلخ)
            $table->integer('lesson_id'); // الدرس الفرعي داخل الوحدة
            $table->string('status')->default('locked'); // 'locked', 'active', 'done'
            $table->integer('stars_earned')->default(0); // عدد النجوم في هذا الدرس (0 لـ 3)
            $table->timestamps();
        });
    }

    public function down()
    {
        Schema::dropIfExists('user_progress');
    }
};
