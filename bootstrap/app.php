<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use App\Http\Middleware\HandleInertiaRequests;

// ───────────────────────────────────────────────────────────
// Runtime upload-limit bump.
//
// The admin "Words & Segments" screen lets staff upload images for
// each word (up to 20 MB per the validator). Default php.ini limits
// (2 MB upload_max_filesize / 8 MB post_max_size) reject those before
// Laravel ever gets the request and the React UI sees an opaque 413.
//
// We raise the limits here so `php artisan serve`, the built-in
// PHP-FPM, and Apache (when AllowOverride permits ini overrides)
// all behave the same. .htaccess already sets the same values for
// the Apache case; this block covers the rest.
// ───────────────────────────────────────────────────────────
@ini_set('upload_max_filesize', '20M');
@ini_set('post_max_size',       '25M');
@ini_set('memory_limit',        '256M');
@ini_set('max_execution_time',  '300');

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__ . '/../routes/web.php',
        commands: __DIR__ . '/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware) {
        $middleware->web(append: [
            HandleInertiaRequests::class,
        ]);

        // Named middleware so routes can attach it via ->middleware('admin')
        $middleware->alias([
            'admin' => \App\Http\Middleware\EnsureAdmin::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions) {
        //
    })->create();
