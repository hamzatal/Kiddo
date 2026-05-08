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
        Schema::create('units', function (Blueprint $table) {
            $table->id();
            $table->integer('unit_number')->unique(); // رقم الوحدة (1 إلى 5)
            $table->string('title'); // اسم الوحدة (مثل: My School Bag)
            $table->string('image_path'); // مسار أيقونة الوحدة
            $table->string('color_key'); // اللون المستخدم بالواجهة (purple, green...)
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('units');
    }
};
