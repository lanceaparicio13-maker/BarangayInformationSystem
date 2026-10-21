<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\ResidentResource;
use App\Models\Resident;
use Illuminate\Http\Request;

class StaffResidentController extends Controller
{
    public function index(Request $request)
    {
        $validated = $request->validate([
            'search' => ['nullable', 'string', 'max:100'],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:100'],
        ]);

        $query = Resident::query()->with('user');

        if (! empty($validated['search'])) {
            $search = $validated['search'];

            $query->where(function ($residentQuery) use ($search) {
                $residentQuery
                    ->where('first_name', 'like', "%{$search}%")
                    ->orWhere('middle_name', 'like', "%{$search}%")
                    ->orWhere('last_name', 'like', "%{$search}%")
                    ->orWhere('phone', 'like', "%{$search}%")
                    ->orWhere('purok', 'like', "%{$search}%");
            });
        }

        $residents = $query
            ->orderBy('last_name')
            ->orderBy('first_name')
            ->paginate($validated['per_page'] ?? 10)
            ->withQueryString();

        return ResidentResource::collection($residents);
    }

    public function show(string $id)
    {
        $resident = Resident::with('user')->find($id);

        if (! $resident) {
            return response()->json([
                'message' => 'Resident not found.',
            ], 404);
        }

        return new ResidentResource($resident);
    }
}
