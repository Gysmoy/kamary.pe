<?php

namespace Tests\Feature;

use App\Models\Supplier;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class SupplierImportTest extends TestCase
{
    use RefreshDatabase;

    private function makeUser(): User
    {
        return User::create([
            'name' => 'Supplier',
            'lastname' => 'Importer',
            'fullname' => 'Supplier Importer',
            'username' => 'supplier_' . uniqid(),
            'email' => 'supplier_' . uniqid() . '@mail.com',
            'password' => Hash::make('secret'),
            'status' => true,
        ]);
    }

    public function test_can_import_suppliers_and_update_existing_by_ruc(): void
    {
        $user = $this->makeUser();
        $existing = Supplier::create([
            'ruc' => '20517411613',
            'business_name' => 'RAZON ANTIGUA',
            'status' => true,
            'created_by' => $user->id,
            'updated_by' => $user->id,
        ]);

        $this->actingAs($user);

        $response = $this->post('/api/admin/suppliers/import', [
            'rows' => [
                [
                    '#' => '72',
                    'RUC' => '20517411613',
                    'RAZON SOCIAL' => 'GRUPO FAMEZA S.A.C.',
                    'DIRECCION' => 'DIR 1',
                    'TELEFONO' => '999888777',
                    'EMAIL' => 'a@fameza.com',
                    'CUENTA BANCARIA / CCI' => 'CCI-123',
                    'ESTADO' => 1,
                ],
                [
                    '#' => '73',
                    'RUC' => '20500000001',
                    'RAZON SOCIAL' => 'PROVEEDOR NUEVO S.A.C.',
                    'DIRECCION' => 'DIR 2',
                    'TELEFONO' => '987654321',
                    'EMAIL' => 'nuevo@proveedor.com',
                    'CUENTA BANCARIA / CCI' => 'CCI-999',
                    'ESTADO' => 0,
                ],
            ],
            'mapping' => [
                'ruc' => 'RUC',
                'business_name' => 'RAZON SOCIAL',
                'address' => 'DIRECCION',
                'phone' => 'TELEFONO',
                'email_1' => 'EMAIL',
                'bank_account_cci' => 'CUENTA BANCARIA / CCI',
                'status' => 'ESTADO',
            ],
        ]);

        $response->assertStatus(200);
        $this->assertDatabaseCount('suppliers', 2);
        $this->assertDatabaseHas('suppliers', [
            'id' => $existing->id,
            'ruc' => '20517411613',
            'business_name' => 'GRUPO FAMEZA S.A.C.',
            'address' => 'DIR 1',
            'phone' => '999888777',
            'email_1' => 'a@fameza.com',
            'bank_account_cci' => 'CCI-123',
            'status' => 1,
        ]);
        $this->assertDatabaseHas('suppliers', [
            'ruc' => '20500000001',
            'business_name' => 'PROVEEDOR NUEVO S.A.C.',
            'status' => 0,
        ]);
    }
}

