<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\DocumentRequest;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class StaffDocumentRequestController extends Controller
{
    // View all document requests
    public function index()
    {
        $requests = DocumentRequest::with([
            'resident',
            'documentType',
            'processor',
        ])->latest()->get();

        return response()->json([
            'document_requests' => $requests,
        ]);
    }

    // Approve or reject a document request
    public function update(Request $request, $id)
    {
        $validated = $request->validate([
            'status' => [
                'required',
                Rule::in(['approved', 'rejected']),
            ],
            'staff_remarks' => ['nullable', 'string', 'max:1000'],
        ]);

        $documentRequest = DocumentRequest::find($id);

        if (! $documentRequest) {
            return response()->json([
                'message' => 'Document request not found.',
            ], 404);
        }

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

    // Mark an approved document request as released
    public function release($id)
    {
        $documentRequest = DocumentRequest::find($id);

        if (! $documentRequest) {
            return response()->json([
                'message' => 'Document request not found.',
            ], 404);
        }

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
