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
        $unitsRaw = Unit::orderBy('unit_number')->get();

        // Strict sequential unlocking: only the first unit (unit_number=0)
        // is open by default. Each subsequent unit requires the previous to be 'done'.
        $prevStatus = 'done'; // so unit_number=0 always unlocks
        $units = $unitsRaw->map(function (Unit $unit) use ($user, &$prevStatus) {
            $status = 'locked';

            if ($user) {
                $progress = $user->progresses()
                    ->where('unit_id', $unit->id)
                    ->first();

                $storedStatus = $progress->status ?? null;

                if ((int) $unit->unit_number === 0) {
                    $status = $storedStatus === 'done' ? 'done' : 'active';
                } else {
                    if ($storedStatus === 'done') {
                        $status = 'done';
                    } elseif ($prevStatus === 'done') {
                        $status = 'active';
                    } else {
                        $status = 'locked';
                    }
                }
            } elseif ((int) $unit->unit_number === 0) {
                $status = 'active';
            }

            $prevStatus = $status;

            return [
                'id'          => $unit->id,
                'unitNumber'  => $unit->unit_number,
                'title'       => $unit->title,
                'imagePath'   => $this->asset($unit->image_path),
                'colorKey'    => $unit->color_key,
                'status'      => $status,
            ];
        });

        return Inertia::render('Home/HomeScreen', [
            'units'    => $units,
            'propUser' => $user,
        ]);
    }

    /**
     * Convert a stored image path into a browser URL. We always emit
     * the URL even when the file is missing on disk — SmartImage's
     * onError handler swaps in the coloured-letter tile, which is
     * preferable to silently dropping the image and shifting the
     * layout to a fallback that other parts of the page might not
     * have rendered.
     */
    private function asset(?string $path): ?string
    {
        if (! $path) {
            return null;
        }
        if (preg_match('~^https?://~i', $path)) {
            return $path;
        }
        return '/' . ltrim($path, '/');
    }
}
