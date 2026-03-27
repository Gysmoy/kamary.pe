<?php

namespace Tests\Feature;

use App\Models\Business;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class WarehouseBranchRelationTest extends TestCase
{
    use RefreshDatabase;

    private function makeUser(): User
    {
        return User::create([
            'name' => 'Warehouse',
            'lastname' => 'Tester',
            'fullname' => 'Warehouse Tester',
            'username' => 'warehouse_' . uniqid(),
            'email' => 'warehouse_' . uniqid() . '@mail.com',
            'password' => Hash::make('secret'),
            'status' => true,
        ]);
    }

    public function test_warehouse_requires_branch_and_can_be_created_with_valid_branch(): void
    {
        $user = $this->makeUser();
        $business = Business::create([
            'name' => 'Empresa Warehouse',
            'description' => null,
            'status' => true,
            'created_by' => $user->id,
            'updated_by' => $user->id,
        ]);
        $branch = $business->branches()->create([
            'name' => 'Sede Warehouse',
            'status' => true,
            'created_by' => $user->id,
            'updated_by' => $user->id,
        ]);

        $this->actingAs($user);

        $withoutBranch = $this->post('/api/admin/warehouses', [
            'name' => 'Almacen sin sede',
            'description' => 'x',
        ]);
        $withoutBranch->assertStatus(400);

        $withBranch = $this->post('/api/admin/warehouses', [
            'name' => 'Almacen con sede',
            'description' => 'ok',
            'business_branch_id' => $branch->id,
        ]);
        $withBranch->assertStatus(200);

        $this->assertDatabaseHas('warehouses', [
            'name' => 'Almacen con sede',
            'business_branch_id' => $branch->id,
        ]);
    }
}

