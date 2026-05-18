<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Surface the per-unit map placement (x%, y%, size, optional separate
 * map icon) in the database so the admin dashboard can drag/edit
 * pins without touching React code.
 *
 * Before this migration the positions lived inside MapScreen.jsx as a
 * `VISUAL_CONFIG` dictionary keyed by Unit.id — which made adding a
 * new unit (e.g. the Toy mode) a code change instead of a one-click
 * admin operation.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('units', function (Blueprint $table) {
            // Percent positions (0-100) used by MapScreen as
            // `left: {map_x}%, top: {map_y}%`. Nullable so existing
            // units use a sensible auto-layout fallback until set.
            $table->decimal('map_x', 5, 2)->nullable()->after('color_key');
            $table->decimal('map_y', 5, 2)->nullable()->after('map_x');
            // Tailwind size class (e.g. "w-32 h-32 sm:w-40 sm:h-40")
            // — kept as freeform string so the admin can pick from a
            // small preset list without a schema migration.
            $table->string('map_size', 128)->nullable()->after('map_y');
            // Optional separate image for the map pin (defaults to
            // the unit's main image_path when null).
            $table->string('map_image_path')->nullable()->after('map_size');
        });

        // Seed sensible defaults so the existing 3 units land in
        // their original spots even before the admin touches them.
        // Numbers come straight from the old VISUAL_CONFIG.
        $defaults = [
            'U0' => ['x' => 20.5, 'y' => 37,  'size' => 'w-40 h-40 sm:w-48 sm:h-48 lg:w-52 lg:h-52'],
            'U1' => ['x' => 72,   'y' => 33,  'size' => 'w-40 h-40 sm:w-48 sm:h-48 lg:w-52 lg:h-52'],
            'U2' => ['x' => 72,   'y' => 65,  'size' => 'w-32 h-32 sm:w-40 sm:h-40'],
        ];

        foreach ($defaults as $code => $cfg) {
            \DB::table('units')
                ->where('code', $code)
                ->update([
                    'map_x'    => $cfg['x'],
                    'map_y'    => $cfg['y'],
                    'map_size' => $cfg['size'],
                ]);
        }
    }

    public function down(): void
    {
        Schema::table('units', function (Blueprint $table) {
            $table->dropColumn(['map_x', 'map_y', 'map_size', 'map_image_path']);
        });
    }
};
