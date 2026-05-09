<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('units', function (Blueprint $table) {
            $table->id();
            $table->unsignedInteger('unit_number')->unique(); // 1..5
            $table->string('title'); // Welcome / Hello, Family and friends, ...
            $table->string('code')->unique(); // U1, U2, ...
            $table->text('description')->nullable();
            $table->string('image_path')->nullable(); // map icon / hero image
            $table->string('color_key')->nullable();  // purple, green, blue...
            $table->unsignedInteger('lessons_count')->default(0); // total mini-lessons in app
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('units');
    }
};
