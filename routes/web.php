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
use App\Http\Controllers\GamesArenaController;

// ─────────────────────────────────────────────────────────────
// Public routes
// ─────────────────────────────────────────────────────────────
Route::get('/', [HomeController::class, 'index'])->name('home');

Route::get('/about', fn () => Inertia::render('AboutScreen'))->name('about');

// Help Center is open to everyone (sign-in optional).
Route::get('/help', [HelpCenterController::class, 'index'])->name('help');

// `/contact` was the v1 link; keep the redirect so any printed
// stickers / emails out in the wild still resolve.
Route::redirect('/contact', '/help');

// ─────────────────────────────────────────────────────────────
// Audio + media APIs
// ─────────────────────────────────────────────────────────────
//
// 302-streams an NCCD audio track by its stable code (e.g. AB6, PB12).
// The browser issues HTTP Range requests so only the bytes needed for
// the current clip are downloaded — no local copy required.
Route::get('/api/audio/{code}', AudioStreamController::class)
    ->whereAlphaNumeric('code')
    ->name('audio.stream');

// Dynamic SVG word images — universal fallback when a Word's
// image_path doesn't exist on disk. Cached for a year because
// the SVG output is deterministic per word.
Route::get('/api/word-svg/{word}.svg', [\App\Http\Controllers\WordImageController::class, 'show'])
    ->whereNumber('word')
    ->name('word.svg');
Route::get('/api/word-svg-by-text/{text}.svg', [\App\Http\Controllers\WordImageController::class, 'byText'])
    ->where('text', '[A-Za-z0-9 _-]+')
    ->name('word.svg.byText');

// On-demand TTS — generates (or returns the cached) child-friendly
// OpenAI nova-voice mp3 clip for any word that doesn't have NCCD
// audio. Auth + per-IP throttling keep the OpenAI bill bounded.
Route::middleware(['auth', 'throttle:30,1'])->group(function () {
    Route::post('/api/words/{word}/tts', [\App\Http\Controllers\TtsController::class, 'generateForWord'])
        ->whereNumber('word')
        ->name('api.words.tts');
    Route::post('/api/tts/by-text', [\App\Http\Controllers\TtsController::class, 'generateForText'])
        ->name('api.tts.by-text');
});

// ─────────────────────────────────────────────────────────────
// Auth (FIX: throttled to prevent brute-force + bot signups)
// ─────────────────────────────────────────────────────────────
//
// Rationale for the throttle keys:
//   - login/register share a 5-attempts-per-minute budget, scoped
//     by the throttle middleware (per-IP by default in Laravel 11).
//   - Logout has no throttle so the user can always sign out.
Route::middleware('guest')->group(function () {
    Route::get('/login',     [AuthController::class, 'showLogin'])->name('login');
    Route::post('/login',    [AuthController::class, 'login'])
        ->middleware('throttle:8,1')
        ->name('login.post');

    Route::get('/register',  [AuthController::class, 'showRegister'])->name('register');
    Route::post('/register', [AuthController::class, 'register'])
        ->middleware('throttle:5,1')
        ->name('register.post');
});

Route::post('/logout', [AuthController::class, 'logout'])
    ->middleware('auth')
    ->name('logout');

// ─────────────────────────────────────────────────────────────
// Authenticated learner routes
// ─────────────────────────────────────────────────────────────
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
        ->middleware('throttle:60,1') // FIX: cap result floods on a stuck client
        ->name('lesson.result');

    Route::get('/quiz/{unit}', [QuizController::class, 'show'])
        ->whereNumber('unit')
        ->name('quiz.show');

    Route::post('/quiz/submit', [QuizController::class, 'submit'])
        ->middleware('throttle:30,1')
        ->name('quiz.submit');

    // ─── Games Arena (mixed review across all unlocked units) ───
    Route::get('/arena',         [GamesArenaController::class, 'show'])->name('arena');
    Route::post('/arena/submit', [GamesArenaController::class, 'submit'])
        ->middleware('throttle:30,1')
        ->name('arena.submit');

    Route::get('/progress', [ParentDashboardController::class, 'index'])
        ->name('progress');

    // ─── AI endpoints (FIX: per-user throttling) ───
    //
    // We use a TIGHT per-user throttle on these because every call
    // costs us OpenAI credits. The previous version was wide open
    // — a bored kid mashing the Fox helper button could rack up
    // dozens of dollars of API spend in seconds.
    Route::middleware('throttle:20,1')->group(function () {
        Route::post('/ai/lesson-helper', [AiController::class, 'lessonHelper'])
            ->name('ai.lesson-helper');
        Route::post('/ai/parent-report', [AiController::class, 'parentReport'])
            ->name('ai.parent-report');
        Route::post('/ai/help-center', [AiController::class, 'helpCenter'])
            ->name('ai.help-center');
    });

    // ═══════════════════════════════════════════════════════════
    // Admin panel — full curriculum + audio control
    // ═══════════════════════════════════════════════════════════
    Route::middleware('admin')->prefix('admin')->name('admin.')->group(function () {
        Route::get('/',         [AdminController::class, 'dashboard'])->name('dashboard');
        Route::get('/units',    [AdminController::class, 'units'])->name('units');
        Route::get('/lessons',  [AdminController::class, 'lessons'])->name('lessons');
        Route::get('/tracks',   [AdminController::class, 'tracks'])->name('tracks');
        Route::get('/words',    [AdminController::class, 'words'])->name('words');

        // Generic uploads (used by create-word / create-lesson before
        // the row exists) — base64 path so we never hit POST limits.
        Route::post('/uploads',       [AdminController::class, 'uploadGenericImage']);
        Route::post('/uploads/image', [AdminController::class, 'uploadGenericImage']);

        // JSON API (PATCH-style updates the React UI uses)
        Route::post('/units',                [AdminController::class, 'createUnit']);
        Route::patch('/units/{unit}',        [AdminController::class, 'updateUnit']);
        Route::delete('/units/{unit}',       [AdminController::class, 'deleteUnit']);
        Route::post('/units/{unit}/image',   [AdminController::class, 'uploadUnitImage']);
        Route::post('/units/{unit}/tts-fallback', [AdminController::class, 'generateTtsForUnit']);
        Route::post('/units/{unit}/ai-ingest',    [AdminController::class, 'ingestUnitFromAudio']);
        Route::post('/lessons',              [AdminController::class, 'createLesson']);
        Route::patch('/lessons/{lesson}',    [AdminController::class, 'updateLesson']);
        Route::delete('/lessons/{lesson}',   [AdminController::class, 'deleteLesson']);
        Route::post('/tracks',               [AdminController::class, 'createTrack']);
        Route::patch('/tracks/{track}',      [AdminController::class, 'updateTrack']);
        Route::delete('/tracks/{track}',     [AdminController::class, 'deleteTrack']);
        Route::post('/words',                [AdminController::class, 'createWord']);
        Route::patch('/words/{word}',        [AdminController::class, 'updateWord']);
        Route::delete('/words/{word}',       [AdminController::class, 'deleteWord']);
        Route::post('/words/bulk-delete',    [AdminController::class, 'bulkDeleteWords']);
        Route::post('/words/{word}/image',   [AdminController::class, 'uploadWordImage']);
        Route::post('/words/{word}/audio',         [AdminController::class, 'uploadWordAudio']);
        Route::post('/words/{word}/clear-audio',   [AdminController::class, 'clearWordAudio']);
        Route::post('/words/{word}/auto-segment',  [AdminController::class, 'autoSegmentWord']);
        Route::post('/words/{word}/tts',           [AdminController::class, 'generateTtsForWord']);
        Route::post('/words/auto-segment-all',     [AdminController::class, 'autoSegmentAll']);
        Route::get('/words/duplicates',            [AdminController::class, 'findDuplicateWords']);
        Route::get('/audio/check',                 [AdminController::class, 'checkAudioUrls']);
        Route::get('/audio/library',               [AdminController::class, 'audioLibrary']);
        Route::post('/audio/discover',             [AdminController::class, 'discoverNccdAudio']);
        Route::post('/audio/auto-map',             [AdminController::class, 'autoMapCurriculum']);
    });
});
