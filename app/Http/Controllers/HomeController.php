<?php

namespace App\Http\Controllers;

use Inertia\Inertia;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use App\Models\User;

class HomeController extends Controller
{
    // عرض الصفحة الرئيسية
    public function index()
    {
        return Inertia::render('HomeScreen', [
            // نبعث للريأكت هل المستخدم مسجل دخول أم لا
            'isLoggedIn' => Auth::check(),
            'user' => Auth::user()
        ]);
    }

    // تسجيل الدخول السريع (لأغراض العرض والمناقشة)
    public function login()
    {
        // بنبحث عن حساب Alex، وإذا مش موجود بنعمله
        $user = User::firstOrCreate(
            ['email' => 'alex@kiddo.test'],
            [
                'name' => 'Alex',
                'password' => bcrypt('password'),
                'avatar' => 'boy',
                'level' => 1,
                'xp' => 0,
                'total_stars' => 0
            ]
        );

        Auth::login($user);

        // بعد تسجيل الدخول بنحوله للخريطة
        return redirect()->route('map');
    }

    // تسجيل الخروج
    public function logout()
    {
        Auth::logout();
        return redirect()->route('home');
    }
}
