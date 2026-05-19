<?php

namespace Tests;

use Illuminate\Foundation\Testing\TestCase as BaseTestCase;
use Illuminate\Support\Facades\Vite;

abstract class TestCase extends BaseTestCase
{
    /**
     * Why we override setUp:
     *
     *   Feature tests like ExampleTest::test_the_application_returns_a_successful_response
     *   call $this->get('/'), which renders an Inertia view that contains
     *   a `@vite(['resources/css/app.css','resources/js/app.jsx'])` directive
     *   in resources/views/app.blade.php.
     *
     *   In CI we run the backend job WITHOUT building the frontend first
     *   (the frontend has its own job in the same workflow), so
     *   public/build/manifest.json doesn't exist. The Vite facade then
     *   throws "Unable to locate file in Vite manifest..." and the test
     *   blows up with a 500 instead of asserting a 200.
     *
     *   `Vite::withoutVite()` is the framework-blessed escape hatch:
     *   the @vite directive becomes a no-op for the duration of the
     *   test run. We do not need a real bundle to verify routing,
     *   middleware, controllers, or view composition.
     *
     *   Note: this only affects `Vite` invocations during tests; in
     *   browser HTTP requests outside the test suite the directive
     *   continues to behave normally.
     */
    protected function setUp(): void
    {
        parent::setUp();

        Vite::useHotFile(storage_path('vite.hot-test'))
            ->useBuildDirectory('build');
        Vite::useScriptTagAttributes([]);
        // Short-circuit Vite resolution entirely so the manifest is
        // never consulted during HTTP tests.
        $this->withoutVite();
    }
}
