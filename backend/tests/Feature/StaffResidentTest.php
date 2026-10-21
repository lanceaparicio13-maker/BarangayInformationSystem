<?php

namespace Tests\Feature;

use App\Models\Resident;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class StaffResidentTest extends TestCase
{
    use RefreshDatabase;

    public function test_staff_can_view_paginated_residents(): void
    {
        $staff = User::factory()->create([
            'role' => 'staff',
        ]);

        Resident::create([
            'first_name' => 'Alex',
            'middle_name' => null,
            'last_name' => 'Santos',
            'address' => 'Purok 1',
        ]);

        $response = $this->actingAs($staff, 'sanctum')
            ->getJson('/api/staff/residents');

        $response->assertOk()
            ->assertJsonPath('data.0.first_name', 'Alex')
            ->assertJsonPath('data.0.last_name', 'Santos')
            ->assertJsonStructure([
                'data',
                'links',
                'meta',
            ]);
    }

    public function test_staff_can_search_residents_by_name(): void
    {
        $staff = User::factory()->create([
            'role' => 'staff',
        ]);

        Resident::create([
            'first_name' => 'Maria',
            'last_name' => 'Dela Cruz',
            'address' => 'Purok 2',
        ]);

        Resident::create([
            'first_name' => 'Pedro',
            'last_name' => 'Reyes',
            'address' => 'Purok 3',
        ]);

        $response = $this->actingAs($staff, 'sanctum')
            ->getJson('/api/staff/residents?search=Maria');

        $response->assertOk()
            ->assertJsonPath('data.0.first_name', 'Maria')
            ->assertJsonCount(1, 'data');
    }

    public function test_staff_can_view_a_resident_details(): void
    {
        $staff = User::factory()->create([
            'role' => 'staff',
        ]);

        $resident = Resident::create([
            'first_name' => 'Juan',
            'last_name' => 'Dela Cruz',
            'address' => 'Purok 4',
        ]);

        $response = $this->actingAs($staff, 'sanctum')
            ->getJson("/api/staff/residents/{$resident->id}");

        $response->assertOk()
            ->assertJsonPath('data.id', $resident->id)
            ->assertJsonPath('data.full_name', 'Juan Dela Cruz');
    }

    public function test_resident_cannot_access_staff_residents_list(): void
    {
        $residentUser = User::factory()->create([
            'role' => 'resident',
        ]);

        $response = $this->actingAs($residentUser, 'sanctum')
            ->getJson('/api/staff/residents');

        $response->assertForbidden();
    }

    public function test_guest_cannot_access_staff_residents_list(): void
    {
        $this->getJson('/api/staff/residents')
            ->assertUnauthorized();
    }

    public function test_missing_resident_returns_not_found(): void
    {
        $staff = User::factory()->create([
            'role' => 'staff',
        ]);

        $this->actingAs($staff, 'sanctum')
            ->getJson('/api/staff/residents/999999')
            ->assertNotFound()
            ->assertJsonPath('message', 'Resident not found.');
    }
}
