<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

/**
 * Blocks anyone who isn't a logged-in admin from hitting the /admin
 * routes. We keep the logic here (rather than in every controller)
 * so adding new admin routes stays cheap.
 */
class EnsureAdmin
{
    public function handle(Request $request, Closure $next)
    {
        $user = $request->user();

        if (! $user) {
            return redirect()->route('login');
        }

        if (! method_exists($user, 'isAdmin') || ! $user->isAdmin()) {
            abort(403, 'Admin access required.');
        }

        return $next($request);
    }
}
