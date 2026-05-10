<?php

namespace Tests\Feature;

use App\Models\User;
use App\Support\ModulePermissions;
use Database\Seeders\ModulePermissionsSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
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

        return $user;
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
            $this->postJson($module['api'], [
                'isLoadingAll' => true,
                'take' => 1,
                'requireTotalCount' => true,
            ])
                ->assertOk()
                ->assertJsonPath('status', 200);
        }
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
}
