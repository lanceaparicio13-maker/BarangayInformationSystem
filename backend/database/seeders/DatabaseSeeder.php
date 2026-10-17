<?php

namespace Database\Seeders;

use App\Models\CommunityConcern;
use App\Models\DocumentRequest;
use App\Models\DocumentType;
use App\Models\Resident;
use App\Models\User;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // Create or update the demo administrator.
        $admin = User::updateOrCreate(
            ['email' => 'admin@barangay.test'],
            [
                'name' => 'Barangay Administrator',
                'password' => 'Admin123!',
                'role' => 'admin',
            ]
        );

        // Create or update the demo resident account.
        $residentUser = User::updateOrCreate(
            ['email' => 'resident@barangay.test'],
            [
                'name' => 'Juan Dela Cruz',
                'password' => 'Resident123!',
                'role' => 'resident',
            ]
        );

        // Link the resident account to a resident profile.
        $resident = Resident::firstOrCreate(
            ['user_id' => $residentUser->id],
            [
                'first_name' => 'Juan',
                'middle_name' => 'Santos',
                'last_name' => 'Dela Cruz',
                'birth_date' => '2000-01-15',
                'gender' => 'Male',
                'civil_status' => 'Single',
                'phone' => '09171234567',
                'address' => 'Poblacion',
                'purok' => 'Purok 1',
            ]
        );

        // Ensure at least 20 resident profiles exist.
        $missingResidents = max(0, 20 - Resident::count());

        if ($missingResidents > 0) {
            Resident::factory()->count($missingResidents)->create();
        }

        // Create the standard barangay document types.
        $documentTypes = [
            [
                'name' => 'Barangay Clearance',
                'description' => 'Clearance for employment and other lawful purposes.',
                'fee' => 50,
                'is_active' => true,
            ],
            [
                'name' => 'Certificate of Residency',
                'description' => 'Certification of residence within the barangay.',
                'fee' => 30,
                'is_active' => true,
            ],
            [
                'name' => 'Certificate of Indigency',
                'description' => 'Certification of indigency, subject to barangay verification.',
                'fee' => 0,
                'is_active' => true,
            ],
            [
                'name' => 'Barangay Business Clearance',
                'description' => 'Barangay-level business clearance.',
                'fee' => 100,
                'is_active' => true,
            ],
        ];

        foreach ($documentTypes as $type) {
            DocumentType::updateOrCreate(
                ['name' => $type['name']],
                $type
            );
        }

        // Create sample requests and concerns only if none exist.
        if (DocumentRequest::count() === 0) {
            DocumentRequest::factory()->count(10)->create();
        }

        if (CommunityConcern::count() === 0) {
            CommunityConcern::factory()->count(10)->create();
        }
    }
}
