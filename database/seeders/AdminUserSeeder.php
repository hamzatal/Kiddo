<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

/**
 * Creates a default admin account on fresh installs so the owner can
 * log into /admin immediately.
 *
 *   email: admin@kiddo.test
 *   pass : admin1234
 *
 * Idempotent: re-running does not change an existing admin password.
 */
class AdminUserSeeder extends Seeder
{
    public function run(): void
    {
        User::firstOrCreate(
            ['email' => 'admin@kiddo.test'],
            [
                'name'     => 'Kiddo Admin',
                'password' => Hash::make('admin1234'),
                'role'     => 'admin',
                'level'    => 10,
            ]
        );
    }
}
