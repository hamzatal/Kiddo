<?php

namespace App\Http\Controllers;

use Inertia\Inertia;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use App\Models\User;
use App\Models\Unit;
use App\Models\UserProgress;

class HomeController extends Controller
{
    // ── 1. دالة الرئيسية (مدمج معها جلب الدروس من الداتا بيس) ──
    public function index()
    {
        $user = Auth::user();
        $units = Unit::orderBy('unit_number')->get();

        if ($user) {
            $progress = UserProgress::where('user_id', $user->id)->get()->keyBy('unit_id');

            $mappedUnits = $units->map(function ($unit) use ($progress) {
                $unitProgress = $progress->get($unit->id);
                return [
                    'id' => $unit->id,
                    'unit_number' => $unit->unit_number,
                    'title' => $unit->title,
                    'image_path' => $unit->image_path,
                    'color_key' => $unit->color_key,
                    'status' => $unitProgress ? $unitProgress->status : ($unit->unit_number == 1 ? 'active' : 'locked'),
                ];
            });
        } else {
            $mappedUnits = $units->map(function ($unit) {
                return [
                    'id' => $unit->id,
                    'unit_number' => $unit->unit_number,
                    'title' => $unit->title,
                    'image_path' => $unit->image_path,
                    'color_key' => $unit->color_key,
                    'status' => $unit->unit_number == 1 ? 'active' : 'locked',
                ];
            });
        }

        return Inertia::render('HomeScreen', [
            'units' => $mappedUnits
        ]);
    }

    // ── 2. الصفحات الثابتة ──
    public function about()
    {
        return Inertia::render('AboutScreen');
    }

    public function contact()
    {
        return Inertia::render('ContactScreen');
    }

    // ── 3. نظام تسجيل الدخول (Login) ──
    public function showLogin()
    {
        return Inertia::render('Auth/Login');
    }

    public function login(Request $request)
    {
        $credentials = $request->validate([
            'email' => 'required|email',
            'password' => 'required',
        ]);

        if (Auth::attempt($credentials)) {
            $request->session()->regenerate();
            return redirect()->intended('/map');
        }

        return back()->withErrors([
            'email' => 'The provided credentials do not match our records.',
        ]);
    }

    // ── 4. نظام التسجيل (Register) ──
    public function showRegister()
    {
        return Inertia::render('Auth/Register');
    }

    public function register(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'password' => 'required|string|min:6|confirmed',
        ]);

        $user = User::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'password' => Hash::make($validated['password']),
            'avatar' => 'boy',
            'level' => 1,
            'xp' => 0,
            'total_stars' => 0,
        ]);

        Auth::login($user);
        return redirect('/map');
    }

    // ── 5. نظام تسجيل الخروج (Logout) ──
    public function logout(Request $request)
    {
        Auth::logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();
        return redirect('/');
    }
}
