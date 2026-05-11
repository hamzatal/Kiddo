<?php

namespace App\Providers;

use App\Services\OpenAiService;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        $this->app->singleton(OpenAiService::class, fn () => OpenAiService::make());
    }

    public function boot(): void
    {
        Schema::defaultStringLength(191);
    }
}
