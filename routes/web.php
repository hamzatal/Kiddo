<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\HomeController;
use App\Http\Controllers\MapController;
use App\Http\Controllers\LessonController;
use App\Http\Controllers\QuizController;
use App\Http\Controllers\ProgressController;
use Inertia\Inertia;

// الصفحات العامة (Public)
Route::get('/', [HomeController::class, 'index'])->name('home');
Route::get('/about', [HomeController::class, 'about'])->name('about');
Route::get('/contact', [HomeController::class, 'contact'])->name('contact');

// صفحات التسجيل والدخول
Route::get('/login', [HomeController::class, 'showLogin'])->name('login')->middleware('guest');
Route::post('/login', [HomeController::class, 'login'])->middleware('guest');
Route::get('/register', [HomeController::class, 'showRegister'])->name('register')->middleware('guest');
Route::post('/register', [HomeController::class, 'register'])->middleware('guest');
Route::post('/logout', [HomeController::class, 'logout'])->name('logout')->middleware('auth');

// الصفحات المحمية (Requires Authentication)
Route::middleware(['auth'])->group(function () {
    Route::get('/map', [MapController::class, 'index'])->name('map');
    Route::get('/lesson/{unit_id?}', [LessonController::class, 'show'])->name('lesson');
    Route::get('/quiz/{unit_id?}', [QuizController::class, 'show'])->name('quiz.show');
    Route::post('/quiz/submit', [QuizController::class, 'submit'])->name('quiz.submit');
    Route::get('/progress', [ProgressController::class, 'index'])->name('progress');
});
