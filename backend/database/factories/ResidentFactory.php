<?php

namespace Database\Factories;

use App\Models\Resident;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Resident>
 */
class ResidentFactory extends Factory
{
    protected $model = Resident::class;

    public function definition(): array
    {
        return [
            'user_id' => null,
            'first_name' => fake()->firstName(),
            'middle_name' => fake()->optional()->firstName(),
            'last_name' => fake()->lastName(),
            'birth_date' => fake()->dateTimeBetween('-75 years', '-18 years')->format('Y-m-d'),
            'gender' => fake()->randomElement(['Male', 'Female']),
            'civil_status' => fake()->randomElement([
                'Single',
                'Married',
                'Widowed',
            ]),
            'phone' => fake()->numerify('09#########'),
            'address' => fake()->streetAddress(),
            'purok' => 'Purok ' . fake()->numberBetween(1, 8),
        ];
    }
}
