<?php

namespace Tests\Feature;

use App\Models\DocumentType;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class StaffDocumentTypeTest extends TestCase
{
    use RefreshDatabase;

    public function test_staff_can_list_active_and_inactive_document_types(): void
    {
        $staff = User::factory()->create(['role' => 'staff']);

        DocumentType::create([
            'name' => 'Barangay Clearance',
            'description' => 'Clearance certificate',
            'fee' => 50,
            'is_active' => true,
        ]);

        DocumentType::create([
            'name' => 'Old Certificate',
            'description' => 'Inactive document',
            'fee' => 20,
            'is_active' => false,
        ]);

        $response = $this->actingAs($staff, 'sanctum')
            ->getJson('/api/staff/document-types');

        $response->assertOk()
            ->assertJsonCount(2, 'document_types')
            ->assertJsonFragment(['name' => 'Barangay Clearance'])
            ->assertJsonFragment(['name' => 'Old Certificate']);
    }

    public function test_staff_can_create_a_document_type(): void
    {
        $staff = User::factory()->create(['role' => 'staff']);

        $response = $this->actingAs($staff, 'sanctum')
            ->postJson('/api/staff/document-types', [
                'name' => 'Certificate of Residency',
                'description' => 'Proof of residency',
                'fee' => 25,
            ]);

        $response->assertCreated()
            ->assertJsonPath(
                'document_type.name',
                'Certificate of Residency'
            )
            ->assertJsonPath('document_type.is_active', true);

        $this->assertDatabaseHas('document_types', [
            'name' => 'Certificate of Residency',
            'fee' => 25,
            'is_active' => true,
        ]);
    }

    public function test_staff_can_update_and_deactivate_a_document_type(): void
    {
        $staff = User::factory()->create(['role' => 'staff']);

        $documentType = DocumentType::create([
            'name' => 'Barangay Clearance',
            'description' => 'Old description',
            'fee' => 50,
            'is_active' => true,
        ]);

        $response = $this->actingAs($staff, 'sanctum')
            ->putJson("/api/staff/document-types/{$documentType->id}", [
                'name' => 'Barangay Clearance',
                'description' => 'Updated description',
                'fee' => 75,
                'is_active' => false,
            ]);

        $response->assertOk()
            ->assertJsonPath(
                'document_type.description',
                'Updated description'
            )
            ->assertJsonPath('document_type.fee', '75.00')
            ->assertJsonPath('document_type.is_active', false);

        $this->assertDatabaseHas('document_types', [
            'id' => $documentType->id,
            'fee' => 75,
            'is_active' => false,
        ]);
    }

    public function test_residents_cannot_manage_document_types(): void
    {
        $resident = User::factory()->create(['role' => 'resident']);

        $this->actingAs($resident, 'sanctum')
            ->getJson('/api/staff/document-types')
            ->assertForbidden();

        $this->actingAs($resident, 'sanctum')
            ->postJson('/api/staff/document-types', [
                'name' => 'Unauthorized Type',
                'description' => 'Should not be created',
                'fee' => 10,
            ])
            ->assertForbidden();
    }

    public function test_guests_cannot_manage_document_types(): void
    {
        $this->getJson('/api/staff/document-types')->assertUnauthorized();

        $this->postJson('/api/staff/document-types', [
            'name' => 'Unauthorized Type',
            'fee' => 10,
        ])->assertUnauthorized();
    }

    public function test_document_type_creation_rejects_invalid_input(): void
    {
        $staff = User::factory()->create(['role' => 'staff']);

        $this->actingAs($staff, 'sanctum')
            ->postJson('/api/staff/document-types', [
                'name' => '',
                'fee' => -1,
            ])
            ->assertUnprocessable();
    }

    public function test_document_type_creation_rejects_duplicate_names(): void
    {
        $staff = User::factory()->create(['role' => 'staff']);

        DocumentType::create([
            'name' => 'Barangay Clearance',
            'description' => null,
            'fee' => 50,
            'is_active' => true,
        ]);

        $this->actingAs($staff, 'sanctum')
            ->postJson('/api/staff/document-types', [
                'name' => 'Barangay Clearance',
                'description' => 'Duplicate',
                'fee' => 30,
            ])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['name']);
    }

    public function test_updating_a_missing_document_type_returns_not_found(): void
    {
        $staff = User::factory()->create(['role' => 'staff']);

        $this->actingAs($staff, 'sanctum')
            ->putJson('/api/staff/document-types/999999', [
                'name' => 'Missing Type',
                'description' => null,
                'fee' => 10,
                'is_active' => true,
            ])
            ->assertNotFound();
    }
}
