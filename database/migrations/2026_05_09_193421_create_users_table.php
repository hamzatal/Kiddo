<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('users', function (Blueprint $table) {
            $table->id();

            // بيانات أساسية
            $table->string('name');
            $table->string('email')->unique();
            $table->timestamp('email_verified_at')->nullable();
            $table->string('password');

            // دور المستخدم (طالب / ولي أمر / أدمن)
            $table->enum('role', ['student', 'parent', 'admin'])
                ->default('student');

            // حقول التعلّم (Rewards) مدمجة هنا
            $table->unsignedInteger('level')->default(1);
            $table->unsignedInteger('xp')->default(0);
            $table->unsignedInteger('total_stars')->default(0);
            $table->json('badges')->nullable(); // مصفوفة بسيطة للبادجز

            // بيانات إضافية اختيارية
            $table->string('avatar')->nullable(); // صورة الطفل / ولي الأمر
            $table->string('locale')->default('en'); // أو 'ar'
            $table->boolean('sound_enabled')->default(true); // تفعيل الأصوات

            // حقول Laravel الافتراضية
            $table->rememberToken();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('users');
    }
};
