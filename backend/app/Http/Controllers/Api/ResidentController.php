<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Resident;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class ResidentController extends Controller
{
    public function show(Request $request)
    {
        $resident = Resident::where(
            'user_id',
            $request->user()->id
        )->first();

        if (! $resident) {
            return response()->json([
                'message' => 'Resident profile not found.',
            ], 404);
        }

        return response()->json([
            'resident' => $resident,
        ]);
    }

    public function store(Request $request)
    {
        $user = $request->user();

        if ($user->role !== 'resident') {
            return response()->json([
                'message' => 'Only resident accounts can create resident profiles.',
            ], 403);
        }

        if (Resident::where('user_id', $user->id)->exists()) {
            return response()->json([
                'message' => 'A resident profile already exists for this account.',
            ], 409);
        }

        $validated = $request->validate([
            'first_name' => ['required', 'string', 'max:255'],
            'middle_name' => ['nullable', 'string', 'max:255'],
            'last_name' => ['required', 'string', 'max:255'],
            'birth_date' => ['nullable', 'date', 'before_or_equal:today'],
            'gender' => ['nullable', 'string', 'max:20'],
            'civil_status' => ['nullable', 'string', 'max:30'],
            'phone' => ['nullable', 'string', 'max:30'],
            'address' => ['required', 'string'],
            'purok' => ['nullable', 'string', 'max:50'],
        ]);

        $resident = Resident::create([
            ...$validated,
            'user_id' => $user->id,
        ]);

        return response()->json([
            'message' => 'Resident profile created successfully.',
            'resident' => $resident,
        ], 201);
    }

    public function update(Request $request)
    {
        $user = $request->user();

        $resident = Resident::where('user_id', $user->id)->first();

        if (! $resident) {
            return response()->json([
                'message' => 'Resident profile not found.',
            ], 404);
        }

        $validated = $request->validate([
            'first_name' => ['sometimes', 'required', 'string', 'max:255'],
            'middle_name' => ['sometimes', 'nullable', 'string', 'max:255'],
            'last_name' => ['sometimes', 'required', 'string', 'max:255'],
            'birth_date' => ['sometimes', 'nullable', 'date', 'before_or_equal:today'],
            'gender' => ['sometimes', 'nullable', 'string', 'max:20'],
            'civil_status' => ['sometimes', 'nullable', 'string', 'max:30'],
            'phone' => ['sometimes', 'nullable', 'string', 'max:30'],
            'address' => ['sometimes', 'required', 'string'],
            'purok' => ['sometimes', 'nullable', 'string', 'max:50'],
        ]);

        $resident->update($validated);

        return response()->json([
            'message' => 'Resident profile updated successfully.',
            'resident' => $resident->fresh(),
        ]);
    }
}
