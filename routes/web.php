<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\MapController;
use App\Http\Controllers\LessonController;
use App\Http\Controllers\QuizController;
use App\Http\Controllers\ProgressController;
use App\Http\Controllers\HomeController;


use Inertia\Inertia;

Route::get('/map', [MapController::class, 'index'])->name('map');

Route::get('/lesson', function () {
    return Inertia::render('LessonScreen');
})->name('lesson');

Route::get('/quiz', function () {
    return Inertia::render('QuizScreen');
})->name('quiz');

Route::get('/progress', function () {
    return Inertia::render('ProgressScreen');
})->name('progress');

Route::get('/lesson/{unit_id?}', [LessonController::class, 'show'])->name('lesson');

Route::get('/quiz/{unit_id?}', [QuizController::class, 'show'])->name('quiz.show');
Route::post('/quiz/submit', [QuizController::class, 'submit'])->name('quiz.submit');

Route::get('/progress', [ProgressController::class, 'index'])->name('progress');


Route::get('/', [HomeController::class, 'index'])->name('home');
Route::post('/login', [HomeController::class, 'login'])->name('login');
Route::post('/logout', [HomeController::class, 'logout'])->name('logout');