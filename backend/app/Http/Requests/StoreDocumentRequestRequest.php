<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreDocumentRequestRequest extends FormRequest
{
    /**
     * Determine whether the current user may submit a document request.
     */
    public function authorize(): bool
    {
        return $this->user()?->role === 'resident';
    }

    /**
     * Get the validation rules for a new document request.
     *
     * @return array<string, array<mixed>>
     */
    public function rules(): array
    {
        return [
            'document_type_id' => [
                'required',
                'integer',
                Rule::exists('document_types', 'id')
                    ->where('is_active', true),
            ],
            'purpose' => [
                'required',
                'string',
                'max:255',
            ],
        ];
    }
}
