<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules\Password;
use Inertia\Inertia;

/**
 * Auth flow for parents creating accounts on their kid's behalf.
 *
 * Hardening notes (this rewrite):
 *   - Throttle middleware moved to routes/web.php so login/register
 *     are limited per-IP (8/min and 5/min respectively).
 *   - Password rule upgraded to NIST-aligned: min 8 chars, at least
 *     one letter and one digit, plus password_confirmation.
 *   - Register now persists the explicit `role => student` so the
 *     User model's role-based helpers (`isAdmin`, `isParent`) keep
 *     returning a deterministic result regardless of DB defaults.
 *   - Login honours an explicit ?next=... redirect target (used by
 *     bootstrap.js when a 401 bounces the user here).
 *   - Logout now invalidates the session AND regenerates the CSRF
 *     token in a single step.
 */
class AuthController extends Controller
{
    public function showLogin(Request $request)
    {
        return Inertia::render('Auth/Login', [
            'next' => $this->safeNext($request),
        ]);
    }

    public function showRegister(Request $request)
    {
        return Inertia::render('Auth/Register', [
            'next' => $this->safeNext($request),
        ]);
    }

    public function register(Request $request)
    {
        $data = $request->validate([
            'name'              => ['required', 'string', 'min:2', 'max:60'],
            'email'             => ['required', 'string', 'email:rfc,dns', 'max:255', 'unique:users,email'],
            'password'          => [
                'required',
                'confirmed',
                Password::min(8)->letters()->numbers(),
            ],
            'terms_accepted'    => ['accepted'],
        ], [
            'terms_accepted.accepted' => 'Please confirm you accept the terms and parental consent.',
        ]);

        $user = User::create([
            'name'         => $data['name'],
            'email'        => $data['email'],
            'password'     => Hash::make($data['password']),
            'role'         => 'student',
            'xp'           => 0,
            'total_stars'  => 0,
            'level'        => 1,
        ]);

        Auth::login($user, remember: true);
        $request->session()->regenerate();

        // Admins land on the admin dashboard; everyone else goes to the map.
        if ($user->isAdmin()) {
            return redirect()->intended(route('admin.dashboard'));
        }

        return redirect()->intended($this->safeNext($request) ?? route('map'));
    }

    public function login(Request $request)
    {
        $credentials = $request->validate([
            'email'    => ['required', 'string', 'email'],
            'password' => ['required', 'string'],
        ]);

        $remember = $request->boolean('remember');

        if (! Auth::attempt($credentials, $remember)) {
            return back()
                ->withErrors([
                    'email' => 'These credentials do not match our records.',
                ])
                ->onlyInput('email');
        }

        $request->session()->regenerate();

        $user = Auth::user();
        if ($user && $user->isAdmin()) {
            return redirect()->intended(route('admin.dashboard'));
        }

        return redirect()->intended($this->safeNext($request) ?? route('map'));
    }

    public function logout(Request $request)
    {
        Auth::logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return redirect()->route('home');
    }

    /**
     * Returns a safe `?next=` redirect target — the path must be on
     * our own host (no protocol-relative or absolute URLs) so the
     * login flow can't be turned into an open redirector.
     */
    private function safeNext(Request $request): ?string
    {
        $candidate = $request->input('next');
        if (! is_string($candidate) || $candidate === '') {
            return null;
        }
        // Refuse anything that doesn't start with a single slash.
        if (! preg_match('~^/[^/]~', $candidate)) {
            return null;
        }
        return $candidate;
    }
}
