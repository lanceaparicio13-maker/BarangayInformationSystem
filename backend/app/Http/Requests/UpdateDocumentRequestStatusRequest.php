<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateDocumentRequestStatusRequest extends FormRequest
{
    /**
     * Determine whether the user is authorized to process requests.
     */
    public function authorize(): bool
    {
        return in_array(
            $this->user()?->role,
            ['staff', 'admin'],
            true
        );
    }

    /**
     * Get the validation rules for updating a request's status.
     *
     * @return array<string, array<mixed>>
     */
    public function rules(): array
    {
        return [
            'status' => [
                'required',
                Rule::in(['approved', 'rejected']),
            ],
            'staff_remarks' => [
                'nullable',
                'string',
                'max:1000',
            ],
        ];
    }
}
