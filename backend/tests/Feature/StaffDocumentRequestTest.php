<?php

namespace Tests\Feature;

use App\Models\DocumentRequest;
use App\Models\DocumentType;
use App\Models\Resident;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class StaffDocumentRequestTest extends TestCase
{
    use RefreshDatabase;

    public function test_staff_can_approve_a_pending_request(): void
    {
        $staff = User::factory()->create([
            'role' => 'staff',
        ]);

        $documentRequest = DocumentRequest::factory()->create([
            'status' => 'pending',
        ]);

        Sanctum::actingAs($staff);

        $response = $this->putJson(
            "/api/staff/document-requests/{$documentRequest->id}",
            [
                'status' => 'approved',
                'staff_remarks' => 'Requirements verified.',
            ]
        );

        $response->assertOk()
            ->assertJsonPath(
                'document_request.status',
                'approved'
            )
            ->assertJsonPath(
                'document_request.processed_by',
                $staff->id
            )
            ->assertJsonPath(
                'document_request.staff_remarks',
                'Requirements verified.'
            );

        $this->assertDatabaseHas('document_requests', [
            'id' => $documentRequest->id,
            'status' => 'approved',
            'processed_by' => $staff->id,
            'staff_remarks' => 'Requirements verified.',
        ]);
    }

    public function test_staff_can_reject_a_pending_request(): void
    {
        $staff = User::factory()->create([
            'role' => 'staff',
        ]);

        $documentRequest = DocumentRequest::factory()->create([
            'status' => 'pending',
        ]);

        Sanctum::actingAs($staff);

        $response = $this->putJson(
            "/api/staff/document-requests/{$documentRequest->id}",
            [
                'status' => 'rejected',
                'staff_remarks' => 'Required information is incomplete.',
            ]
        );

        $response->assertOk()
            ->assertJsonPath(
                'document_request.status',
                'rejected'
            )
            ->assertJsonPath(
                'document_request.processed_by',
                $staff->id
            );

        $this->assertDatabaseHas('document_requests', [
            'id' => $documentRequest->id,
            'status' => 'rejected',
            'processed_by' => $staff->id,
        ]);
    }

    public function test_staff_cannot_approve_an_already_processed_request(): void
    {
        $staff = User::factory()->create([
            'role' => 'staff',
        ]);

        $documentRequest = DocumentRequest::factory()->create([
            'status' => 'approved',
        ]);

        Sanctum::actingAs($staff);

        $response = $this->putJson(
            "/api/staff/document-requests/{$documentRequest->id}",
            [
                'status' => 'approved',
            ]
        );

        $response->assertUnprocessable()
            ->assertJsonPath(
                'message',
                'Only pending requests can be approved or rejected.'
            );

        $this->assertDatabaseHas('document_requests', [
            'id' => $documentRequest->id,
            'status' => 'approved',
        ]);
    }

    public function test_staff_cannot_submit_an_invalid_status(): void
    {
        $staff = User::factory()->create([
            'role' => 'staff',
        ]);

        $documentRequest = DocumentRequest::factory()->create([
            'status' => 'pending',
        ]);

        Sanctum::actingAs($staff);

        $response = $this->putJson(
            "/api/staff/document-requests/{$documentRequest->id}",
            [
                'status' => 'completed',
            ]
        );

        $response->assertUnprocessable()
            ->assertJsonValidationErrors([
                'status',
            ]);

        $this->assertDatabaseHas('document_requests', [
            'id' => $documentRequest->id,
            'status' => 'pending',
        ]);
    }

    public function test_staff_can_release_an_approved_request(): void
    {
        $staff = User::factory()->create([
            'role' => 'staff',
        ]);

        $documentRequest = DocumentRequest::factory()->create([
            'status' => 'approved',
        ]);

        Sanctum::actingAs($staff);

        $response = $this->putJson(
            "/api/staff/document-requests/{$documentRequest->id}/release"
        );

        $response->assertOk()
            ->assertJsonPath(
                'document_request.status',
                'released'
            );

        $this->assertDatabaseHas('document_requests', [
            'id' => $documentRequest->id,
            'status' => 'released',
        ]);

        $this->assertNotNull(
            $documentRequest->fresh()->released_at
        );
    }

    public function test_staff_cannot_release_a_pending_request(): void
    {
        $staff = User::factory()->create([
            'role' => 'staff',
        ]);

        $documentRequest = DocumentRequest::factory()->create([
            'status' => 'pending',
        ]);

        Sanctum::actingAs($staff);

        $response = $this->putJson(
            "/api/staff/document-requests/{$documentRequest->id}/release"
        );

        $response->assertUnprocessable()
            ->assertJsonPath(
                'message',
                'Only approved requests can be released.'
            );

        $this->assertDatabaseHas('document_requests', [
            'id' => $documentRequest->id,
            'status' => 'pending',
            'released_at' => null,
        ]);
    }

    public function test_staff_can_filter_requests_by_status(): void
    {
        $staff = User::factory()->create([
            'role' => 'staff',
        ]);

        $pendingRequest = DocumentRequest::factory()->create([
            'status' => 'pending',
        ]);

        DocumentRequest::factory()->create([
            'status' => 'approved',
        ]);

        Sanctum::actingAs($staff);

        $response = $this->getJson(
            '/api/staff/document-requests?status=pending'
        );

        $response->assertOk()
            ->assertJsonPath('data.0.id', $pendingRequest->id)
            ->assertJsonPath('data.0.status', 'pending')
            ->assertJsonCount(1, 'data');
    }

    public function test_staff_can_search_requests_by_resident_name(): void
    {
        $staff = User::factory()->create([
            'role' => 'staff',
        ]);

        $documentType = DocumentType::factory()->create();

        $matchingResident = Resident::factory()->create([
            'first_name' => 'Alexandra',
            'last_name' => 'Santos',
        ]);

        $otherResident = Resident::factory()->create([
            'first_name' => 'Benjamin',
            'last_name' => 'Reyes',
        ]);

        $matchingRequest = DocumentRequest::factory()->create([
            'resident_id' => $matchingResident->id,
            'document_type_id' => $documentType->id,
            'status' => 'pending',
        ]);

        DocumentRequest::factory()->create([
            'resident_id' => $otherResident->id,
            'document_type_id' => $documentType->id,
            'status' => 'pending',
        ]);

        Sanctum::actingAs($staff);

        $response = $this->getJson(
            '/api/staff/document-requests?search=Alexandra'
        );

        $response->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.id', $matchingRequest->id)
            ->assertJsonPath(
                'data.0.resident.first_name',
                'Alexandra'
            );
    }

    public function test_staff_request_list_is_paginated(): void
    {
        $staff = User::factory()->create([
            'role' => 'staff',
        ]);

        DocumentRequest::factory()->count(3)->create();

        Sanctum::actingAs($staff);

        $response = $this->getJson(
            '/api/staff/document-requests?per_page=2'
        );

        $response->assertOk()
            ->assertJsonCount(2, 'data')
            ->assertJsonPath('per_page', 2)
            ->assertJsonPath('total', 3)
            ->assertJsonPath('last_page', 2);
    }
}
