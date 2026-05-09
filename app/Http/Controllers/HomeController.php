<?php

namespace App\Http\Controllers;

use App\Models\Unit;
use Illuminate\Http\Request;
use Inertia\Inertia;

class HomeController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();

        // جلب الوحدات لإظهارها في HomeScreen (Our Learning Units)
        $units = Unit::orderBy('unit_number')
            ->get()
            ->map(function (Unit $unit) use ($user) {
                // حالة الوحدة بالنسبة للطالب
                $status = 'locked';
                if ($user) {
                    $progress = $user->progresses()
                        ->where('unit_id', $unit->id)
                        ->first();

                    if ($progress) {
                        $status = $progress->status;
                    } elseif ($unit->unit_number === 1) {
                        $status = 'active';
                    }
                } elseif ($unit->unit_number === 1) {
                    // لو غير مسجل، أول وحدة مفتوحة كمثال
                    $status = 'active';
                }

                return [
                    'id'          => $unit->id,
                    'unitNumber'  => $unit->unit_number,
                    'title'       => $unit->title,
                    'imagePath'   => $unit->image_path,
                    'colorKey'    => $unit->color_key,
                    'status'      => $status,
                ];
            });

        return Inertia::render('Home/HomeScreen', [
            'units'    => $units,
            'propUser' => $user,
        ]);
    }
}
