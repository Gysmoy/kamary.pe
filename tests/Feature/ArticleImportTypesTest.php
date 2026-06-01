<?php

namespace Tests\Feature;

use App\Models\Article;
use App\Models\ArticlePackComponent;
use App\Models\Business;
use App\Models\User;
use App\Models\Warehouse;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class ArticleImportTypesTest extends TestCase
{
    use RefreshDatabase;

    private function makeUser(): User
    {
        return User::create([
            'name' => 'Article',
            'lastname' => 'Importer',
            'fullname' => 'Article Importer',
            'username' => 'article_import_' . uniqid(),
            'email' => 'article_import_' . uniqid() . '@mail.com',
            'password' => Hash::make('secret'),
            'status' => true,
        ]);
    }

    private function makeWarehouse(User $user): Warehouse
    {
        $business = Business::where('business_key', 'kamary_peru')->firstOrFail();
        $branch = $business->branches()->create([
            'name' => 'Sede Import QA',
            'status' => true,
            'created_by' => $user->id,
            'updated_by' => $user->id,
        ]);

        return Warehouse::create([
            'name' => 'Almacen Import QA',
            'business_branch_id' => $branch->id,
            'status' => true,
            'created_by' => $user->id,
            'updated_by' => $user->id,
        ]);
    }

    public function test_article_import_type_upsert_and_corporate_catalog(): void
    {
        $user = $this->makeUser();
        $warehouse = $this->makeWarehouse($user);

        $request = [
            'rows' => [[
                'CODIGO' => 'ART-IMP-001',
                'NOMBRE' => 'Articulo Importado',
                'ALMACEN' => $warehouse->name,
                'LABORATORIO' => 'Lab Import',
                'PRINCIPIO ACTIVO' => 'Principio Import',
                'UNIDAD' => 'UND',
                'ESTADO' => 1,
            ]],
            'mapping' => [
                'code' => 'CODIGO',
                'name' => 'NOMBRE',
                'warehouse' => 'ALMACEN',
                'laboratory' => 'LABORATORIO',
                'active_principle' => 'PRINCIPIO ACTIVO',
                'unit' => 'UNIDAD',
                'status' => 'ESTADO',
            ],
        ];

        $this->actingAs($user)->withoutMiddleware()
            ->post('/api/admin/articles/import', array_merge($request, ['import_type' => 'upsert']))
            ->assertStatus(200);

        $this->assertDatabaseHas('articles', [
            'code' => 'ART-IMP-001',
            'name' => 'Articulo Importado',
            'is_pack' => 0,
            'is_corporate_catalog' => 0,
        ]);

        $request['rows'][0]['CODIGO'] = 'ART-CORP-001';
        $request['rows'][0]['NOMBRE'] = 'Articulo Corporativo';

        $this->actingAs($user)->withoutMiddleware()
            ->post('/api/admin/articles/import', array_merge($request, ['import_type' => 'corporate_catalog']))
            ->assertStatus(200);

        $this->assertDatabaseHas('articles', [
            'code' => 'ART-CORP-001',
            'name' => 'Articulo Corporativo',
            'is_pack' => 0,
            'is_corporate_catalog' => 1,
        ]);
    }

    public function test_article_import_type_pack_components_creates_pack_relation(): void
    {
        $user = $this->makeUser();
        $warehouse = $this->makeWarehouse($user);

        $this->actingAs($user)->withoutMiddleware()
            ->post('/api/admin/articles/import', [
                'import_type' => 'pack_components',
                'rows' => [[
                    'CODIGO PACK' => 'PACK-001',
                    'NOMBRE PACK' => 'Pack Importado',
                    'CODIGO COMPONENTE' => 'COMP-001',
                    'NOMBRE COMPONENTE' => 'Componente Importado',
                    'CANTIDAD COMPONENTE' => '2.5',
                    'ALMACEN' => $warehouse->name,
                    'LABORATORIO' => 'Lab Pack',
                    'PRINCIPIO ACTIVO' => 'Principio Pack',
                    'UNIDAD' => 'UND',
                    'ESTADO' => 1,
                ]],
                'mapping' => [
                    'pack_code' => 'CODIGO PACK',
                    'pack_name' => 'NOMBRE PACK',
                    'component_code' => 'CODIGO COMPONENTE',
                    'component_name' => 'NOMBRE COMPONENTE',
                    'component_quantity' => 'CANTIDAD COMPONENTE',
                    'warehouse' => 'ALMACEN',
                    'laboratory' => 'LABORATORIO',
                    'active_principle' => 'PRINCIPIO ACTIVO',
                    'unit' => 'UNIDAD',
                    'status' => 'ESTADO',
                ],
            ])
            ->assertStatus(200);

        $pack = Article::where('code', 'PACK-001')->firstOrFail();
        $component = Article::where('code', 'COMP-001')->firstOrFail();
        $relation = ArticlePackComponent::where('pack_article_id', $pack->id)
            ->where('component_article_id', $component->id)
            ->firstOrFail();

        $this->assertTrue((bool)$pack->is_pack);
        $this->assertFalse((bool)$component->is_pack);
        $this->assertSame(2.5, (float)$relation->quantity);
    }
}
