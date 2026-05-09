<?php

namespace App\Http\Controllers;

use App\Models\Unit;
use App\Models\UserProgress;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class HomeController extends Controller
{
    public function index()
    {
        $user = Auth::user();
        $units = Unit::orderBy('unit_number')->get();

        // إذا الطالب مسجل دخول، نجيب تقدمه الحقيقي
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
                    // إذا كان مسجل وكل شي مفتوح عندك، تأكد إن الحالة هون مش 'locked'
                    'status' => $unitProgress ? $unitProgress->status : ($unit->unit_number == 1 ? 'active' : 'locked'),
                ];
            });
        } else {
            // للزوار: أول وحدة مفتوحة والباقي مقفل (أو حسب رغبتك)
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
}
