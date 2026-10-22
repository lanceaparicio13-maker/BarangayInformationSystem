<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\DocumentType;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class StaffDocumentTypeController extends Controller
{
    /**
     * List all document types for staff, including inactive types.
     */
    public function index()
    {
        return response()->json([
            'document_types' => DocumentType::query()
                ->orderBy('name')
                ->get(),
        ]);
    }

    /**
     * Create a document type.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => [
                'required',
                'string',
                'max:255',
                'unique:document_types,name',
            ],
            'description' => ['nullable', 'string', 'max:5000'],
            'fee' => ['required', 'numeric', 'min:0', 'max:99999999.99'],
            'is_active' => ['sometimes', 'boolean'],
        ]);

        $documentType = DocumentType::create([
            ...$validated,
            'is_active' => $validated['is_active'] ?? true,
        ]);

        return response()->json([
            'message' => 'Document type created successfully.',
            'document_type' => $documentType,
        ], 201);
    }

    /**
     * Update a document type.
     */
    public function update(Request $request, string $id)
    {
        $documentType = DocumentType::find($id);

        if (! $documentType) {
            return response()->json([
                'message' => 'Document type not found.',
            ], 404);
        }

        $validated = $request->validate([
            'name' => [
                'required',
                'string',
                'max:255',
                Rule::unique('document_types', 'name')
                    ->ignore($documentType->id),
            ],
            'description' => ['nullable', 'string', 'max:5000'],
            'fee' => ['required', 'numeric', 'min:0', 'max:99999999.99'],
            'is_active' => ['required', 'boolean'],
        ]);

        $documentType->update($validated);

        return response()->json([
            'message' => 'Document type updated successfully.',
            'document_type' => $documentType->fresh(),
        ]);
    }
}
