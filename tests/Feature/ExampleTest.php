<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Smoke test that proves the framework is wired up correctly.
 *
 * - We mount RefreshDatabase so the in-memory SQLite gets the full
 *   schema before the test runs (HomeController queries `units`).
 * - TestCase::setUp() already calls $this->withoutVite() so the
 *   @vite directive in resources/views/app.blade.php doesn't try
 *   to read a manifest that the backend CI job hasn't built yet.
 */
class ExampleTest extends TestCase
{
    use RefreshDatabase;

    public function test_the_application_returns_a_successful_response(): void
    {
        $response = $this->get('/');

        $response->assertStatus(200);
    }
}
