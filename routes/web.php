<?php

use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use App\Http\Controllers\HomeController;
use App\Http\Controllers\MapController;
use App\Http\Controllers\LessonController;
use App\Http\Controllers\QuizController;
use App\Http\Controllers\ParentDashboardController;
use App\Http\Controllers\HelpCenterController;
use App\Http\Controllers\AiController;
use App\Http\Controllers\AuthController;

// Public routes
Route::get('/', [HomeController::class, 'index'])->name('home');

Route::get('/about', function () {
    return Inertia::render('AboutScreen');
})->name('about');

Route::get('/contact', [HelpCenterController::class, 'index'])->name('contact');

// Auth routes (بناءً على Pages/Auth)
Route::get('/login', function () {
    return Inertia::render('Auth/Login');
})->name('login');

Route::get('/register', function () {
    return Inertia::render('Auth/Register');
})->name('register');


Route::middleware(['auth'])->group(
    function () {
        // Adventure map
        Route::get('/map', [MapController::class, 'index'])->name('map');

        // Lessons
        Route::get('/lesson/{unit}', [LessonController::class, 'show'])
            ->whereNumber('unit')
            ->name('lesson.show');

        Route::post('/lesson/{unit}/complete', [LessonController::class, 'complete'])
            ->whereNumber('unit')
            ->name('lesson.complete');

        // Quiz
        Route::get('/quiz/{unit}', [QuizController::class, 'show'])
            ->whereNumber('unit')
            ->name('quiz.show');

        Route::post('/quiz/submit', [QuizController::class, 'submit'])
            ->name('quiz.submit');

        // Parent dashboard
        Route::get('/progress', [ParentDashboardController::class, 'index'])
            ->name('progress');

        // Help center (authenticated version إن احتجت)
        Route::get('/help', [HelpCenterController::class, 'index'])
            ->name('help');

        // AI endpoints
        Route::post('/ai/lesson-helper', [AiController::class, 'lessonHelper'])
            ->name('ai.lesson-helper');

        Route::post('/ai/parent-report', [AiController::class, 'parentReport'])
            ->name('ai.parent-report');

        Route::post('/ai/help-center', [AiController::class, 'helpCenter'])
            ->name('ai.help-center');
    }
);

// Auth pages
Route::get('/login', [AuthController::class, 'showLogin'])->name('login');
Route::post('/login', [AuthController::class, 'login'])->name('login.post');

Route::get('/register', [AuthController::class, 'showRegister'])->name('register');
Route::post('/register', [AuthController::class, 'register'])->name('register.post');

Route::post('/logout', [AuthController::class, 'logout'])->name('logout');