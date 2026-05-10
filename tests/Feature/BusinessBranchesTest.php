<?php

namespace Tests\Feature;

use App\Models\Business;
use App\Models\BusinessBranch;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class BusinessBranchesTest extends TestCase
{
    use RefreshDatabase;

    private function makeUser(): User
    {
        return User::create([
            'name' => 'Test',
            'lastname' => 'User',
            'fullname' => 'Test User',
            'username' => 'testuser_' . uniqid(),
            'email' => 'test_' . uniqid() . '@mail.com',
            'password' => Hash::make('secret'),
            'status' => true,
        ]);
    }

    public function test_can_create_multiple_branches_for_same_business(): void
    {
        $user = $this->makeUser();
        $business = Business::where('business_key', 'kamary_peru')->firstOrFail();

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

        $this->assertDatabaseCount('business_branches', 2);
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
        $this->assertDatabaseCount('business_branches', 2);
    }
}
