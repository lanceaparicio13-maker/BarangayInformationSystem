<?php

namespace Tests\Feature;

use App\Models\DocumentRequest;
use App\Models\DocumentType;
use App\Models\Resident;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class DocumentRequestTest extends TestCase
{
    use RefreshDatabase;

    public function test_resident_can_submit_a_valid_document_request(): void
    {
        $user = User::factory()->create([
            'role' => 'resident',
        ]);

        $resident = Resident::factory()->create([
            'user_id' => $user->id,
        ]);

        $documentType = DocumentType::factory()->create([
            'is_active' => true,
        ]);

        Sanctum::actingAs($user);

        $response = $this->postJson('/api/document-requests', [
            'document_type_id' => $documentType->id,
            'purpose' => 'Applying for employment',
        ]);

        $response->assertCreated()
            ->assertJsonPath(
                'message',
                'Document request submitted successfully.'
            )
            ->assertJsonPath(
                'document_request.resident_id',
                $resident->id
            )
            ->assertJsonPath(
                'document_request.document_type_id',
                $documentType->id
            )
            ->assertJsonPath(
                'document_request.status',
                'pending'
            );

        $this->assertDatabaseHas('document_requests', [
            'resident_id' => $resident->id,
            'document_type_id' => $documentType->id,
            'purpose' => 'Applying for employment',
            'status' => 'pending',
        ]);
    }

    public function test_resident_cannot_submit_a_request_with_an_invalid_document_type(): void
    {
        $user = User::factory()->create([
            'role' => 'resident',
        ]);

        Resident::factory()->create([
            'user_id' => $user->id,
        ]);

        Sanctum::actingAs($user);

        $response = $this->postJson('/api/document-requests', [
            'document_type_id' => 999999,
            'purpose' => 'Applying for employment',
        ]);

        $response->assertUnprocessable()
            ->assertJsonValidationErrors([
                'document_type_id',
            ]);

        $this->assertDatabaseCount('document_requests', 0);
    }

    public function test_guest_cannot_submit_a_document_request(): void
    {
        $documentType = DocumentType::factory()->create([
            'is_active' => true,
        ]);

        $response = $this->postJson('/api/document-requests', [
            'document_type_id' => $documentType->id,
            'purpose' => 'Applying for employment',
        ]);

        $response->assertUnauthorized();

        $this->assertDatabaseCount('document_requests', 0);
    }

    public function test_resident_can_view_their_own_document_requests(): void
    {
        $user = User::factory()->create([
            'role' => 'resident',
        ]);

        $resident = Resident::factory()->create([
            'user_id' => $user->id,
        ]);

        $documentType = DocumentType::factory()->create();

        $ownRequest = DocumentRequest::factory()->create([
            'resident_id' => $resident->id,
            'document_type_id' => $documentType->id,
        ]);

        // Create another resident and a separate request.
        $otherResident = Resident::factory()->create();

        DocumentRequest::factory()->create([
            'resident_id' => $otherResident->id,
            'document_type_id' => $documentType->id,
        ]);

        Sanctum::actingAs($user);

        $response = $this->getJson('/api/my-document-requests');

        $response->assertOk()
            ->assertJsonCount(1, 'document_requests')
            ->assertJsonPath(
                'document_requests.0.id',
                $ownRequest->id
            );
    }

    public function test_resident_cannot_view_all_document_requests(): void
    {
        $user = User::factory()->create([
            'role' => 'resident',
        ]);

        Sanctum::actingAs($user);

        $response = $this->getJson('/api/document-requests');

        $response->assertForbidden();
    }

    public function test_staff_can_view_all_document_requests(): void
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

        DocumentRequest::factory()->create([
            'resident_id' => $resident->id,
            'document_type_id' => $documentType->id,
        ]);

        Sanctum::actingAs($staff);

        $response = $this->getJson('/api/document-requests');

        $response->assertOk()
            ->assertJsonCount(1, 'document_requests');
    }
}
