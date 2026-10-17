<?php

namespace Database\Factories;

use App\Models\DocumentRequest;
use App\Models\DocumentType;
use App\Models\Resident;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<DocumentRequest>
 */
class DocumentRequestFactory extends Factory
{
    protected $model = DocumentRequest::class;

    public function definition(): array
    {
        return [
            'resident_id' => Resident::factory(),
            'document_type_id' => DocumentType::factory(),
            'purpose' => fake()->sentence(),
            'status' => 'pending',
            'staff_remarks' => null,
            'processed_by' => null,
            'released_at' => null,
        ];
    }
}
