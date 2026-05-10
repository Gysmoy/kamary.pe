<?php

namespace Tests\Feature;

use App\Models\ActivePrinciple;
use App\Models\Article;
use App\Models\Business;
use App\Models\EntryNote;
use App\Models\EntryNoteItem;
use App\Models\Laboratory;
use App\Models\Unit;
use App\Models\User;
use App\Models\Warehouse;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class ExitNotesTest extends TestCase
{
    use RefreshDatabase;

    private function makeUser(): User
    {
        return User::create([
            'name' => 'Exit',
            'lastname' => 'Tester',
            'fullname' => 'Exit Tester',
            'username' => 'exit_' . uniqid(),
            'email' => 'exit_' . uniqid() . '@mail.com',
            'password' => Hash::make('secret'),
            'status' => true,
        ]);
    }

    public function test_can_create_exit_note_with_multiple_items_and_motives(): void
    {
        $user = $this->makeUser();

        $business = Business::where('business_key', 'kamary_peru')->firstOrFail();
        $branch = $business->branches()->create([
            'name' => 'Sede Central',
            'status' => true,
            'created_by' => $user->id,
            'updated_by' => $user->id,
        ]);
        $warehouse = Warehouse::create([
            'name' => 'Almacen Exit',
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
            'name' => 'Lab Exit QA',
            'code' => 'LEXITQA',
            'status' => true,
            'created_by' => $user->id,
            'updated_by' => $user->id,
        ]);
        $principle = ActivePrinciple::create([
            'laboratory_id' => $lab->id,
            'name' => 'Principio Exit QA',
            'status' => true,
            'created_by' => $user->id,
            'updated_by' => $user->id,
        ]);
        $articleA = Article::create([
            'code' => 'EXT-QA-001',
            'name' => 'Articulo Exit 1',
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
            'code' => 'EXT-QA-002',
            'name' => 'Articulo Exit 2',
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

        $entry = EntryNote::create([
            'business_id' => $business->id,
            'business_branch_id' => $branch->id,
            'warehouse_id' => $warehouse->id,
            'document_type' => 'Boleta',
            'currency' => 'PEN',
            'status' => true,
            'created_by' => $user->id,
            'updated_by' => $user->id,
        ]);
        EntryNoteItem::create([
            'entry_note_id' => $entry->id,
            'batch_code' => 'LX-001',
            'article_id' => $articleA->id,
            'warehouse_id' => $warehouse->id,
            'stock' => 10,
            'cost_unit' => 5,
            'quantity' => 10,
            'total' => 50,
            'status' => true,
        ]);
        EntryNoteItem::create([
            'entry_note_id' => $entry->id,
            'batch_code' => 'LX-002',
            'article_id' => $articleB->id,
            'warehouse_id' => $warehouse->id,
            'stock' => 5,
            'cost_unit' => 5,
            'quantity' => 5,
            'total' => 25,
            'status' => true,
        ]);

        $this->actingAs($user);

        $response = $this->post('/api/admin/exit-notes', [
            'business_id' => $business->id,
            'business_branch_id' => $branch->id,
            'warehouse_id' => $warehouse->id,
            'client_name' => 'Cliente QA',
            'motives' => ['Reposicion', 'Transferencia interna'],
            'observations' => 'Salida para validacion',
            'items' => [
                [
                    'batch_code' => 'LX-001',
                    'article_id' => $articleA->id,
                    'warehouse_id' => $warehouse->id,
                    'stock' => 10,
                    'expiration_date' => '2030-01-10',
                    'location' => 'A-01',
                    'destination_location' => 'B-02',
                    'quantity' => 2,
                    'total' => 2,
                ],
                [
                    'batch_code' => 'LX-002',
                    'article_id' => $articleB->id,
                    'warehouse_id' => $warehouse->id,
                    'stock' => 5,
                    'expiration_date' => '2030-01-11',
                    'location' => 'A-02',
                    'destination_location' => 'C-03',
                    'quantity' => 1,
                    'total' => 1,
                ],
            ],
        ]);

        $response->assertStatus(200);
        $this->assertDatabaseCount('exit_notes', 1);
        $this->assertDatabaseCount('exit_note_items', 2);
        $this->assertDatabaseHas('exit_notes', [
            'business_id' => $business->id,
            'business_branch_id' => $branch->id,
            'warehouse_id' => $warehouse->id,
            'client_name' => 'Cliente QA',
        ]);
        $this->assertDatabaseHas('exit_note_items', [
            'batch_code' => 'LX-001',
            'article_id' => $articleA->id,
            'destination_location' => 'B-02',
        ]);
    }
}
