<?php

namespace Database\Factories;

use App\Models\CommunityConcern;
use App\Models\Resident;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<CommunityConcern>
 */
class CommunityConcernFactory extends Factory
{
    protected $model = CommunityConcern::class;

    public function definition(): array
    {
        return [
            'resident_id' => Resident::factory(),
            'title' => fake()->sentence(4),
            'description' => fake()->paragraph(),
            'category' => fake()->randomElement([
                'Road Maintenance',
                'Waste Management',
                'Public Safety',
                'Noise Complaint',
                'Other',
            ]),
            'status' => 'open',
            'staff_remarks' => null,
            'assigned_to' => null,
            'resolved_at' => null,
        ];
    }
}
