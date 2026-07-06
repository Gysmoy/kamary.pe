<?php

namespace Tests\Feature;

use App\Models\Business;
use App\Models\BusinessBranch;
use App\Models\User;
use App\Models\Warehouse;
use Database\Seeders\ModulePermissionsSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Spatie\Permission\PermissionRegistrar;
use Tests\TestCase;

class WarehouseBranchRelationTest extends TestCase
{
    use RefreshDatabase;

    private function makeUser(): User
    {
        $this->seed(ModulePermissionsSeeder::class);
        app(PermissionRegistrar::class)->forgetCachedPermissions();

        $user = User::create([
            'name' => 'Warehouse',
            'lastname' => 'Tester',
            'fullname' => 'Warehouse Tester',
            'username' => 'warehouse_' . uniqid(),
            'email' => 'warehouse_' . uniqid() . '@mail.com',
            'password' => Hash::make('secret'),
            'status' => true,
        ]);
        $user->assignRole('Admin');

        return $user;
    }

    public function test_warehouse_defaults_to_kamary_peru_branch_and_can_be_created_with_explicit_branch(): void
    {
        $user = $this->makeUser();
        $business = Business::where('business_key', 'kamary_peru')->firstOrFail();
        $branch = $business->branches()->create([
            'name' => 'Sede Warehouse',
            'status' => true,
            'created_by' => $user->id,
            'updated_by' => $user->id,
        ]);

        $this->actingAs($user);

        // WarehouseController::beforeSave ya no exige sede explicita: si no se
        // envia business_branch_id, asigna automaticamente la sede por defecto
        // de Kamary Peru (ver defaultKamaryPeruBranch, introducido en
        // "Implementa observaciones Kamary Peru inventario").
        $withoutBranch = $this->post('/api/admin/warehouses', [
            'name' => 'Almacen sin sede',
            'description' => 'x',
        ]);
        $withoutBranch->assertStatus(200);

        $createdWithoutBranch = Warehouse::where('name', 'Almacen sin sede')->firstOrFail();
        $defaultBranch = BusinessBranch::find($createdWithoutBranch->business_branch_id);
        $this->assertNotNull($defaultBranch);
        $this->assertSame($business->id, $defaultBranch->business_id, 'El almacen sin sede explicita debe quedar asignado a una sede de Kamary Peru.');

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
