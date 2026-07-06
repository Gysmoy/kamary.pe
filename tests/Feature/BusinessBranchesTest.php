<?php

namespace Tests\Feature;

use App\Models\Business;
use App\Models\BusinessBranch;
use App\Models\User;
use Database\Seeders\ModulePermissionsSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Spatie\Permission\PermissionRegistrar;
use Tests\TestCase;

class BusinessBranchesTest extends TestCase
{
    use RefreshDatabase;

    private function makeUser(): User
    {
        $this->seed(ModulePermissionsSeeder::class);
        app(PermissionRegistrar::class)->forgetCachedPermissions();

        $user = User::create([
            'name' => 'Test',
            'lastname' => 'User',
            'fullname' => 'Test User',
            'username' => 'testuser_' . uniqid(),
            'email' => 'test_' . uniqid() . '@mail.com',
            'password' => Hash::make('secret'),
            'status' => true,
        ]);
        $user->assignRole('Admin');

        return $user;
    }

    public function test_can_create_multiple_branches_for_same_business(): void
    {
        $user = $this->makeUser();
        $business = Business::where('business_key', 'kamary_peru')->firstOrFail();

        $branchesBefore = BusinessBranch::where('business_id', $business->id)->count();

        $this->actingAs($user);

        $first = $this->postJson("/api/admin/businesses/{$business->id}/branches", [
            'mode' => 'create',
            'name' => 'Sede Centro',
        ]);
        $first->assertStatus(200);

        $second = $this->postJson("/api/admin/businesses/{$business->id}/branches", [
            'mode' => 'create',
            'name' => 'Sede Norte',
        ]);
        $second->assertStatus(200);

        $this->assertSame(
            $branchesBefore + 2,
            BusinessBranch::where('business_id', $business->id)->count()
        );
        $this->assertDatabaseHas('business_branches', [
            'business_id' => $business->id,
            'name' => 'Sede Centro',
        ]);
        $this->assertDatabaseHas('business_branches', [
            'business_id' => $business->id,
            'name' => 'Sede Norte',
        ]);
    }

    public function test_update_mode_updates_only_selected_branch(): void
    {
        $user = $this->makeUser();
        $business = Business::where('business_key', 'kamary_peru')->firstOrFail();

        $branchA = BusinessBranch::create([
            'business_id' => $business->id,
            'name' => 'Sede A',
            'status' => true,
            'created_by' => $user->id,
            'updated_by' => $user->id,
        ]);
        $branchB = BusinessBranch::create([
            'business_id' => $business->id,
            'name' => 'Sede B',
            'status' => true,
            'created_by' => $user->id,
            'updated_by' => $user->id,
        ]);

        $branchesBefore = BusinessBranch::where('business_id', $business->id)->count();

        $this->actingAs($user);

        $update = $this->postJson("/api/admin/businesses/{$business->id}/branches", [
            'mode' => 'update',
            'id' => $branchA->id,
            'name' => 'Sede A Editada',
        ]);
        $update->assertStatus(200);

        $this->assertDatabaseHas('business_branches', [
            'id' => $branchA->id,
            'name' => 'Sede A Editada',
        ]);
        $this->assertDatabaseHas('business_branches', [
            'id' => $branchB->id,
            'name' => 'Sede B',
        ]);
        $this->assertSame(
            $branchesBefore,
            BusinessBranch::where('business_id', $business->id)->count()
        );
    }
}
