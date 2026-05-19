<?php

namespace App\Http\Controllers;

use App\Models\Unit;
use App\Services\UnitAccessService;
use Illuminate\Http\Request;
use Inertia\Inertia;

class HomeController extends Controller
{
    public function __construct(private readonly UnitAccessService $access)
    {
    }

    public function index(Request $request)
    {
        $user = $request->user();

        // FIX (N+1): we no longer query progresses inside a `map()`
        // closure. The shared UnitAccessService loads all the user's
        // progresses in one query and indexes them by unit_id.
        $unitsRaw = Unit::orderBy('unit_number')->get();
        $annotated = $this->access->annotate($unitsRaw, $user);

        $units = $annotated->map(function (array $row) {
            $unit = $row['unit'];
            return [
                'id'         => $unit->id,
                'unitNumber' => $unit->unit_number,
                'title'      => $unit->title,
                'imagePath'  => $this->asset($unit->image_path),
                'colorKey'   => $unit->color_key,
                'status'     => $row['status'],
            ];
        });

        return Inertia::render('Home/HomeScreen', [
            'units' => $units,
        ]);
    }

    /**
     * Resolve a unit cover image. Same SVG fallback strategy as
     * Word::imageUrl() so units with missing seed art still surface
     * something visually consistent on the homepage.
     */
    private function asset(?string $path): ?string
    {
        if (! $path) {
            return null;
        }
        if (preg_match('~^https?://~i', $path)) {
            return $path;
        }
        $rel = ltrim($path, '/');
        if (is_file(public_path($rel))) {
            return '/' . $rel;
        }
        return null;
    }
}
