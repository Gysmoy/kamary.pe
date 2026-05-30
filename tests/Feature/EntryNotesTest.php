<?php

namespace Tests\Feature;

use App\Models\ActivePrinciple;
use App\Models\Article;
use App\Models\Business;
use App\Models\Laboratory;
use App\Models\Unit;
use App\Models\User;
use App\Models\Warehouse;
use Database\Seeders\ModulePermissionsSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Spatie\Permission\PermissionRegistrar;
use Tests\TestCase;

class EntryNotesTest extends TestCase
{
    use RefreshDatabase;

    private function makeUser(): User
    {
        $this->seed(ModulePermissionsSeeder::class);
        app(PermissionRegistrar::class)->forgetCachedPermissions();

        $user = User::create([
            'name' => 'Entry',
            'lastname' => 'Tester',
            'fullname' => 'Entry Tester',
            'username' => 'entry_' . uniqid(),
            'email' => 'entry_' . uniqid() . '@mail.com',
            'password' => Hash::make('secret'),
            'status' => true,
        ]);

        $user->assignRole('Admin');

        return $user;
    }

    public function test_can_create_entry_note_with_multiple_items(): void
    {
        $user = $this->makeUser();

        $business = Business::where('business_key', 'kamary_peru')->firstOrFail();
        $branch = $business->branches()->create([
            'name' => 'Sede Entry QA',
            'status' => true,
            'created_by' => $user->id,
            'updated_by' => $user->id,
        ]);
        $warehouse = Warehouse::create([
            'name' => 'Principal',
            'description' => null,
            'business_branch_id' => $branch->id,
            'status' => true,
            'created_by' => $user->id,
            'updated_by' => $user->id,
        ]);
        $unit = Unit::create([
            'name' => 'Unidad',
            'symbol' => 'UND',
            'status' => true,
            'created_by' => $user->id,
            'updated_by' => $user->id,
        ]);
        $lab = Laboratory::create([
            'name' => 'Lab QA',
            'code' => 'LABQA',
            'status' => true,
            'created_by' => $user->id,
            'updated_by' => $user->id,
        ]);
        $principle = ActivePrinciple::create([
            'laboratory_id' => $lab->id,
            'name' => 'Principio QA',
            'status' => true,
            'created_by' => $user->id,
            'updated_by' => $user->id,
        ]);
        $articleA = Article::create([
            'code' => 'ART-QA-001',
            'name' => 'Articulo QA 1',
            'laboratory_id' => $lab->id,
            'active_principle_id' => $principle->id,
            'unit_id' => $unit->id,
            'status' => true,
            'margin_rule' => false,
            'igv_rule' => false,
            'units_per_article' => 1,
            'created_by' => $user->id,
            'updated_by' => $user->id,
        ]);
        $articleB = Article::create([
            'code' => 'ART-QA-002',
            'name' => 'Articulo QA 2',
            'laboratory_id' => $lab->id,
            'active_principle_id' => $principle->id,
            'unit_id' => $unit->id,
            'status' => true,
            'margin_rule' => false,
            'igv_rule' => false,
            'units_per_article' => 1,
            'created_by' => $user->id,
            'updated_by' => $user->id,
        ]);

        $this->actingAs($user);

        $response = $this->post("/api/admin/entry-notes", [
            'business_id' => $business->id,
            'business_branch_id' => $branch->id,
            'warehouse_id' => $warehouse->id,
            'document_type' => 'Boleta',
            'currency' => 'PEN',
            'items' => [
                [
                    'batch_code' => 'BC-001',
                    'lot' => 'L-001',
                    'article_id' => $articleA->id,
                    'warehouse_id' => $warehouse->id,
                    'stock' => 5,
                    'cost_unit' => 10,
                    'quantity' => 2,
                    'total' => 20,
                ],
                [
                    'batch_code' => 'BC-002',
                    'lot' => 'L-002',
                    'article_id' => $articleB->id,
                    'warehouse_id' => $warehouse->id,
                    'stock' => 8,
                    'cost_unit' => 7.5,
                    'quantity' => 3,
                    'total' => 22.5,
                ],
            ],
        ]);

        $response->assertStatus(200);
        $this->assertDatabaseCount('entry_notes', 1);
        $this->assertDatabaseCount('entry_note_items', 2);
        $this->assertDatabaseHas('entry_notes', [
            'business_id' => $business->id,
            'warehouse_id' => $warehouse->id,
            'document_type' => 'Boleta',
            'currency' => 'PEN',
        ]);
    }
}
