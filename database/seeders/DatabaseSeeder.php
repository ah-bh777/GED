<?php

namespace Database\Seeders;

use App\Models\User;
// use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // User::factory(10)->create();

 User::create([
            'nom' => 'Admin',
            'prenom' => 'User',
            'email' => 'admin@example.com',
            'email_verified_at' => now(),
            'password' => Hash::make('password123'),  // Always hash passwords!
            'telephone' => '0123456789',
            'date_d_naissance' => '1980-01-01',
            'adresse' => '123 Admin Street',
            'role' => 'admin',
            'remember_token' => null,
            // created_at and updated_at will be handled automatically by Eloquent
        ]);
    }
}
