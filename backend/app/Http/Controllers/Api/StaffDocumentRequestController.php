<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\UpdateDocumentRequestStatusRequest;
use App\Models\DocumentRequest;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class StaffDocumentRequestController extends Controller
{
    /**
     * View document requests with search, filtering, and pagination.
     */
    public function index(Request $request)
    {
        $validated = $request->validate([
            'search' => ['nullable', 'string', 'max:100'],
            'status' => [
                'nullable',
                Rule::in([
                    'pending',
                    'approved',
                    'rejected',
                    'released',
                ]),
            ],
            'per_page' => [
                'nullable',
                'integer',
                'min:1',
                'max:100',
            ],
        ]);

        $query = DocumentRequest::with([
            'resident',
            'documentType',
            'processor',
        ]);

        // Search by resident name or document type.
        if (! empty($validated['search'])) {
            $search = $validated['search'];

            $query->where(function ($subQuery) use ($search) {
                $subQuery->whereHas('resident', function ($residentQuery) use ($search) {
                    $residentQuery->where('first_name', 'like', "%{$search}%")
                        ->orWhere('middle_name', 'like', "%{$search}%")
                        ->orWhere('last_name', 'like', "%{$search}%");
                })->orWhereHas('documentType', function ($typeQuery) use ($search) {
                    $typeQuery->where('name', 'like', "%{$search}%");
                });
            });
        }

        // Filter by request status.
        if (! empty($validated['status'])) {
            $query->where('status', $validated['status']);
        }

        // Return paginated results and preserve query parameters in page links.
        $requests = $query
            ->latest()
            ->paginate($validated['per_page'] ?? 10)
            ->withQueryString();

        return response()->json($requests);
    }

    /**
     * Approve or reject a pending document request.
     */
    public function update(UpdateDocumentRequestStatusRequest $request, $id)
    {
        // The Form Request validates the input and authorizes the user's role.
        $validated = $request->validated();

        $documentRequest = DocumentRequest::find($id);

        if (! $documentRequest) {
            return response()->json([
                'message' => 'Document request not found.',
            ], 404);
        }

        // Only pending requests can be approved or rejected.
        if ($documentRequest->status !== 'pending') {
            return response()->json([
                'message' => 'Only pending requests can be approved or rejected.',
            ], 422);
        }

        $documentRequest->status = $validated['status'];
        $documentRequest->staff_remarks = $validated['staff_remarks'] ?? null;
        $documentRequest->processed_by = $request->user()->id;
        $documentRequest->save();

        return response()->json([
            'message' => 'Document request updated successfully.',
            'document_request' => $documentRequest->load([
                'resident',
                'documentType',
                'processor',
            ]),
        ]);
    }

    /**
     * Mark an approved document request as released.
     */
    public function release($id)
    {
        $documentRequest = DocumentRequest::find($id);

        if (! $documentRequest) {
            return response()->json([
                'message' => 'Document request not found.',
            ], 404);
        }

        // Only approved requests can be released.
        if ($documentRequest->status !== 'approved') {
            return response()->json([
                'message' => 'Only approved requests can be released.',
            ], 422);
        }

        $documentRequest->status = 'released';
        $documentRequest->released_at = now();
        $documentRequest->save();

        return response()->json([
            'message' => 'Document marked as released successfully.',
            'document_request' => $documentRequest->load([
                'resident',
                'documentType',
                'processor',
            ]),
        ]);
    }
}
