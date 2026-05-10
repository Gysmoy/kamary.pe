<?php

namespace Database\Seeders;

use App\Support\ModulePermissions;
use Illuminate\Database\Seeder;

class ModulePermissionsSeeder extends Seeder
{
    public function run(): void
    {
        ModulePermissions::sync();
    }
}
