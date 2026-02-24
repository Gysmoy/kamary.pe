<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class UsersSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        User::updateOrCreate([
            'email' => 'admin@' . env('APP_CORRELATIVE') . '.pe'
        ], [
            'name' => 'Admin',
            'lastname' => env('APP_NAME'),
            'password' => '4ccessme'
        ])->assignRole('Admin');

        User::updateOrCreate([
            'email' => 'customer@' . env('APP_CORRELATIVE') . '.pe'
        ], [
            'name' => 'Customer',
            'lastname' => env('APP_NAME'),
            'password' => '12345678'
        ])->assignRole('Customer');
    }
}
