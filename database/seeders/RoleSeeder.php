<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use SoDe\Extend\Crypto;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

class RoleSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $adminJpa = Role::updateOrCreate(['name' => 'Admin']);
        $sellerJpa = Role::updateOrCreate(['name' => 'Seller']);
        $customerJpa = Role::updateOrCreate(['name' => 'Customer']);

        Permission::updateOrCreate(['name' => 'Admin'])
            ->syncRoles([$adminJpa, $sellerJpa, $customerJpa]);
        Permission::updateOrCreate(['name' => 'Seller'])
            ->syncRoles([$sellerJpa, $customerJpa]);
        Permission::updateOrCreate(['name' => 'Customer'])
            ->syncRoles([$customerJpa]);
    }
}
