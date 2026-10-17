<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreDocumentRequestRequest;
use App\Models\DocumentRequest;
use App\Models\DocumentType;
use App\Models\Resident;
use Illuminate\Http\Request;

class DocumentRequestController extends Controller
{
    /**
     * Get all active document types.
     */
    public function documentTypes()
    {
        return response()->json([
            'document_types' => DocumentType::where('is_active', true)
                ->orderBy('name')
                ->get(),
        ]);
    }

    /**
     * Submit a document request.
     */
    public function store(StoreDocumentRequestRequest $request)
    {
        $user = $request->user();

        $resident = Resident::where('user_id', $user->id)->first();

        if (! $resident) {
            return response()->json([
                'message' => 'Please create your resident profile first.',
            ], 404);
        }

        $validated = $request->validated();

        $documentRequest = DocumentRequest::create([
            'resident_id' => $resident->id,
            'document_type_id' => $validated['document_type_id'],
            'purpose' => $validated['purpose'],
            'status' => 'pending',
        ]);

        return response()->json([
            'message' => 'Document request submitted successfully.',
            'document_request' => $documentRequest->load('documentType'),
        ], 201);
    }

    /**
     * View the authenticated resident's own document requests.
     */
    public function myRequests(Request $request)
    {
        $user = $request->user();

        if ($user->role !== 'resident') {
            return response()->json([
                'message' => 'This endpoint is for residents only.',
            ], 403);
        }

        $resident = Resident::where('user_id', $user->id)->first();

        if (! $resident) {
            return response()->json([
                'message' => 'Resident profile not found.',
            ], 404);
        }

        return response()->json([
            'document_requests' => DocumentRequest::with('documentType')
                ->where('resident_id', $resident->id)
                ->latest()
                ->get(),
        ]);
    }

    /**
     * Staff and administrators can view all document requests.
     */
    public function index(Request $request)
    {
        if (! in_array($request->user()->role, ['staff', 'admin'], true)) {
            return response()->json([
                'message' => 'You are not authorized to view all document requests.',
            ], 403);
        }

        return response()->json([
            'document_requests' => DocumentRequest::with([
                'resident',
                'documentType',
                'processor',
            ])->latest()->get(),
        ]);
    }
}
