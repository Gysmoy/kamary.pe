<?php

namespace Tests\Feature;

use App\Http\Controllers\Admin\Magistrales\IncomeController as MagistralesIncomeController;
use App\Models\Article;
use App\Models\Business;
use App\Models\Laboratory;
use App\Models\MagistralCategory;
use App\Models\MagistralSubcategory;
use App\Models\Unit;
use App\Models\User;
use App\Models\Warehouse;
use App\Support\BusinessScope;
use App\Support\ModulePermissions;
use Database\Seeders\ModulePermissionsSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Illuminate\Http\Request;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;
use Tests\TestCase;

class MagistralesModuleReadinessTest extends TestCase
{
    use RefreshDatabase;

    private function adminUser(): User
    {
        $this->seed(ModulePermissionsSeeder::class);
        app(PermissionRegistrar::class)->forgetCachedPermissions();

        $user = User::create([
            'name' => 'Admin',
            'lastname' => 'Readiness',
            'fullname' => 'Admin Readiness',
            'username' => 'admin_readiness_' . uniqid(),
            'email' => 'admin_readiness_' . uniqid() . '@mail.com',
            'password' => Hash::make('secret'),
            'status' => true,
        ]);
        $user->assignRole('Admin');
        $this->ensureMagistralesWarehouse($user);

        return $user;
    }

    private function ensureMagistralesWarehouse(User $user): void
    {
        $business = Business::firstOrCreate(
            ['business_key' => BusinessScope::KAMARY_MEDICALS],
            [
                'name' => 'Kamary Medicals',
                'description' => 'Empresa para pruebas de magistrales',
                'status' => true,
                'created_by' => $user->id,
                'updated_by' => $user->id,
            ]
        );

        $branch = $business->branches()->firstOrCreate(
            ['name' => 'Sede Magistrales QA'],
            [
                'status' => true,
                'created_by' => $user->id,
                'updated_by' => $user->id,
            ]
        );

        Warehouse::firstOrCreate(
            [
                'business_branch_id' => $branch->id,
                'name' => config('magistrales.default_warehouse_name', 'Almacen Magistrales Principal'),
            ],
            [
                'description' => 'Almacen fijo de magistrales para pruebas',
                'status' => true,
                'created_by' => $user->id,
                'updated_by' => $user->id,
            ]
        );
    }

    public function test_module_permissions_seeder_creates_permissions_and_assigns_admin(): void
    {
        $this->seed(ModulePermissionsSeeder::class);
        app(PermissionRegistrar::class)->forgetCachedPermissions();

        foreach (ModulePermissions::permissions() as $name => $beautyName) {
            $this->assertDatabaseHas('permissions', [
                'name' => $name,
                'guard_name' => 'web',
            ]);
        }

        $admin = Role::where('name', 'Admin')->firstOrFail();
        $missing = collect(array_keys(ModulePermissions::permissions()))
            ->reject(fn(string $permission) => $admin->hasPermissionTo($permission))
            ->values();

        $this->assertSame([], $missing->all(), 'Admin no tiene todos los permisos sembrados.');
    }

    public function test_magistrales_menu_configuration_contains_reference_modules_in_order(): void
    {
        $menu = file_get_contents(resource_path('js/Components/Adminto/Menu.jsx'));
        $roles = file_get_contents(resource_path('js/Admin/Roles.jsx'));

        $positions = [];
        foreach (ModulePermissions::magistralesModules() as $module) {
            $this->assertStringContainsString($module['permission'], $menu, "Falta permiso {$module['permission']} en Menu.jsx");
            $this->assertStringContainsString($module['permission'], $roles, "Falta permiso {$module['permission']} en Roles.jsx");
            $this->assertStringContainsString("href='{$module['web']}'", $menu, "Falta ruta {$module['web']} en Menu.jsx");

            $positions[$module['web']] = strpos($menu, "href='{$module['web']}'");
            $this->assertNotFalse($positions[$module['web']], "No se encontro {$module['web']} en Menu.jsx");
        }

        $this->assertSame(array_values($positions), collect($positions)->sort()->values()->all(), 'El orden visible de Magistrales cambio en el menu.');
    }

    public function test_magistrales_web_modules_render_for_admin(): void
    {
        $this->actingAs($this->adminUser());

        foreach (ModulePermissions::magistralesModules() as $module) {
            $this->get($module['web'])
                ->assertOk();
        }
    }

    public function test_magistrales_api_paginate_modules_are_reachable_for_admin(): void
    {
        $this->actingAs($this->adminUser());

        foreach (ModulePermissions::magistralesModules() as $module) {
            if (!$module['api']) {
                continue;
            }

            $this->postJson($module['api'], [
                'isLoadingAll' => true,
                'take' => 1,
                'requireTotalCount' => true,
            ])
                ->assertOk()
                ->assertJsonPath('status', 200);
        }
    }

    public function test_magistrales_entry_note_routes_use_magistrales_income_controller(): void
    {
        $router = app('router')->getRoutes();
        $webRoute = $router->match(Request::create('/admin/magistrales/entry-note', 'GET'));
        $apiRoute = $router->match(Request::create('/api/admin/magistrales/entry-notes/paginate', 'POST'));

        $this->assertSame(MagistralesIncomeController::class . '@reactView', $webRoute->getActionName());
        $this->assertSame(MagistralesIncomeController::class . '@paginate', $apiRoute->getActionName());
    }

    public function test_all_magistrales_permissions_exist_in_database(): void
    {
        $this->seed(ModulePermissionsSeeder::class);

        foreach (ModulePermissions::magistralesModules() as $module) {
            $this->assertTrue(
                Permission::where('name', $module['permission'])->exists(),
                "No existe el permiso {$module['permission']}"
            );
        }
    }

    public function test_magistrales_article_save_derives_unit_from_first_equivalence(): void
    {
        $user = $this->adminUser();
        $this->actingAs($user);

        $laboratory = Laboratory::create([
            'name' => 'MAGISTRAL',
            'code' => 'MAG-QA',
            'country' => 'Perú',
            'status' => true,
            'created_by' => $user->id,
            'updated_by' => $user->id,
        ]);
        $category = MagistralCategory::create([
            'code' => 'INS',
            'description' => 'INSUMOS',
            'status' => true,
            'created_by' => $user->id,
            'updated_by' => $user->id,
        ]);
        MagistralSubcategory::create([
            'magistral_category_id' => $category->id,
            'description' => 'POLVO',
            'status' => true,
            'created_by' => $user->id,
            'updated_by' => $user->id,
        ]);

        $response = $this->postJson('/api/admin/magistrales/articles', [
            'name' => 'ACIDO ASCORBICO',
            'article_type' => 'INSUMOS',
            'administration_route' => 'N/A',
            'magistral_category_id' => $category->id,
            'sub_category' => 'POLVO',
            'magistral_presentation' => 'POLVO',
            'laboratory_id' => $laboratory->id,
            'igv_rule' => true,
            'stock_min' => 100,
            'stock_max' => 1000,
            'currency' => 'PEN',
            'stock_has_expiration' => true,
            'stock_has_lot' => true,
            'cost_price' => 200,
            'sale_price' => 0,
            'presentations' => [
                [
                    'units' => 1,
                    'name' => 'Kg',
                    'price' => 0,
                    'purchase_price_national' => 200,
                    'purchase_price_foreign' => 0,
                ],
                [
                    'units' => 1000,
                    'name' => 'g',
                    'price' => 0,
                    'purchase_price_national' => 0.2,
                    'purchase_price_foreign' => 0,
                ],
            ],
        ]);

        $response->assertOk()->assertJsonPath('status', 200);

        $unit = Unit::where('symbol', 'KG')->first();
        $this->assertNotNull($unit);

        $article = Article::where('module_scope', 'magistrales')->where('name', 'ACIDO ASCORBICO')->firstOrFail();
        $this->assertSame($unit->id, $article->unit_id);
        $this->assertSame($laboratory->id, $article->laboratory_id);
        $this->assertSame('INS-1', $article->code);
        $this->assertCount(2, $article->presentations);
    }
}
