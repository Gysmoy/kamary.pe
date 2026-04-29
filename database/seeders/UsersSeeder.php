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
            'username' => 'kamary'
        ], [
            'email' => 'admin@kamary.pe',
            'name' => 'Admin',
            'lastname' => 'Kamary',
            'password' => '4ccessme'
        ])->assignRole('Admin');
        User::updateOrCreate([
            'username' => 'xplain'
        ], [
            'email' => 'admin@xplain.pe',
            'name' => 'Admin',
            'lastname' => 'xPlain',
            'password' => '4ccessme'
        ])->assignRole('Admin');
    }
}
