<?php

use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use App\Http\Controllers\AudioStreamController;
use App\Http\Controllers\AdminController;
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

// Streams an NCCD audio track by its stable code (e.g. AB6, PB12).
// The browser issues HTTP Range requests so only the bytes needed for
// the current clip are downloaded; no local copy is required.
Route::get('/api/audio/{code}', AudioStreamController::class)
    ->whereAlphaNumeric('code')
    ->name('audio.stream');

Route::get('/about', function () {
    return Inertia::render('AboutScreen');
})->name('about');

// Help Center عام للجميع
Route::get('/help', [HelpCenterController::class, 'index'])->name('help');

// شِل contact أو خلّيه يوجّه لـ help لو بدك احتياطي:
Route::redirect('/contact', '/help');

// Auth pages (مرة واحدة فقط)
Route::get('/login', [AuthController::class, 'showLogin'])->name('login');
Route::post('/login', [AuthController::class, 'login'])->name('login.post');

Route::get('/register', [AuthController::class, 'showRegister'])->name('register');
Route::post('/register', [AuthController::class, 'register'])->name('register.post');

Route::post('/logout', [AuthController::class, 'logout'])->name('logout');

// Protected routes
Route::middleware(['auth'])->group(function () {
    Route::get('/map', [MapController::class, 'index'])->name('map');

    Route::get('/lesson/{unit}', [LessonController::class, 'show'])
        ->whereNumber('unit')
        ->name('lesson.show');

    Route::post('/lesson/{unit}/complete', [LessonController::class, 'complete'])
        ->whereNumber('unit')
        ->name('lesson.complete');

    Route::post('/lesson/{unit}/{lesson}/result', [LessonController::class, 'submitResult'])
        ->whereNumber('unit')
        ->whereNumber('lesson')
        ->name('lesson.result');

    Route::get('/quiz/{unit}', [QuizController::class, 'show'])
        ->whereNumber('unit')
        ->name('quiz.show');

    Route::post('/quiz/submit', [QuizController::class, 'submit'])
        ->name('quiz.submit');

    Route::get('/progress', [ParentDashboardController::class, 'index'])
        ->name('progress');

    // AI endpoints
    Route::post('/ai/lesson-helper', [AiController::class, 'lessonHelper'])
        ->name('ai.lesson-helper');
    Route::post('/ai/parent-report', [AiController::class, 'parentReport'])
        ->name('ai.parent-report');
    Route::post('/ai/help-center', [AiController::class, 'helpCenter'])
        ->name('ai.help-center');

    // ═══════════════════════════════════════════════════════════
    // Admin panel — full curriculum + audio control
    // ═══════════════════════════════════════════════════════════
    Route::middleware('admin')->prefix('admin')->name('admin.')->group(function () {
        Route::get('/',         [AdminController::class, 'dashboard'])->name('dashboard');
        Route::get('/units',    [AdminController::class, 'units'])->name('units');
        Route::get('/lessons',  [AdminController::class, 'lessons'])->name('lessons');
        Route::get('/tracks',   [AdminController::class, 'tracks'])->name('tracks');
        Route::get('/words',    [AdminController::class, 'words'])->name('words');

        // JSON API (PATCH-style updates the React UI uses)
        Route::post('/units',                [AdminController::class, 'createUnit']);
        Route::patch('/units/{unit}',        [AdminController::class, 'updateUnit']);
        Route::post('/units/{unit}/image',   [AdminController::class, 'uploadUnitImage']);
        Route::post('/lessons',              [AdminController::class, 'createLesson']);
        Route::patch('/lessons/{lesson}',    [AdminController::class, 'updateLesson']);
        Route::post('/tracks',               [AdminController::class, 'createTrack']);
        Route::patch('/tracks/{track}',      [AdminController::class, 'updateTrack']);
        Route::delete('/tracks/{track}',     [AdminController::class, 'deleteTrack']);
        Route::post('/words',                [AdminController::class, 'createWord']);
        Route::patch('/words/{word}',        [AdminController::class, 'updateWord']);
        Route::delete('/words/{word}',       [AdminController::class, 'deleteWord']);
        Route::post('/words/{word}/image',   [AdminController::class, 'uploadWordImage']);
        Route::post('/words/{word}/auto-segment', [AdminController::class, 'autoSegmentWord']);
    });
});