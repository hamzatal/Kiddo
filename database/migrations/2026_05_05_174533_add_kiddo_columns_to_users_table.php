<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('avatar')->default('boy'); // لتحديد صورة الطفل
            $table->integer('level')->default(1);     // المستوى الحالي
            $table->integer('xp')->default(0);        // النقاط المكتسبة
            $table->integer('total_stars')->default(0); // إجمالي النجوم
            $table->string('role')->default('student'); // 'student' or 'parent'
        });
    }

    public function down()
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['avatar', 'level', 'xp', 'total_stars', 'role']);
        });
    }
};
