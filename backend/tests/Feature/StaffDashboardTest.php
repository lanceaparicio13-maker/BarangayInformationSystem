<?php

namespace Tests\Feature;

use App\Models\DocumentRequest;
use App\Models\DocumentType;
use App\Models\Resident;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class StaffDashboardTest extends TestCase
{
    use RefreshDatabase;

    
public function test_staff_can_view_dashboard_summary(): void
{
    $staff = User::factory()->create([
        'role' => 'staff',
    ]);

    Sanctum::actingAs($staff);

    $this->getJson('/api/staff/dashboard')
        ->assertOk()
        ->assertJsonStructure([
            'message',
            'summary' => [
                'total_requests',
                'pending_requests',
                'approved_requests',
                'rejected_requests',
                'released_requests',
                'total_residents',
            ],
        ]);
}


    public function test_resident_cannot_view_staff_dashboard(): void
    {
        $residentUser = User::factory()->create([
            'role' => 'resident',
        ]);

        Sanctum::actingAs($residentUser);

        $this->getJson('/api/staff/dashboard')
            ->assertForbidden();
    }

    public function test_guest_cannot_view_staff_dashboard(): void
    {
        $this->getJson('/api/staff/dashboard')
            ->assertUnauthorized();
    }

    public function test_dashboard_counts_requests_and_residents(): void
    {
        $staff = User::factory()->create([
            'role' => 'staff',
        ]);

        $residentUser = User::factory()->create([
            'role' => 'resident',
        ]);

        $resident = Resident::factory()->create([
            'user_id' => $residentUser->id,
        ]);

        $documentType = DocumentType::factory()->create();

        foreach (['pending', 'pending', 'approved', 'rejected', 'released'] as $status) {
            DocumentRequest::factory()->create([
                'resident_id' => $resident->id,
                'document_type_id' => $documentType->id,
                'status' => $status,
            ]);
        }

        Sanctum::actingAs($staff);

    $this->getJson('/api/staff/dashboard')
        ->assertOk()
        ->assertJson([
            'summary' => [
                'total_requests' => 5,
                'pending_requests' => 2,
                'approved_requests' => 1,
                'rejected_requests' => 1,
                'released_requests' => 1,
                'total_residents' => 1,
            ],
        ]);

    }
}
