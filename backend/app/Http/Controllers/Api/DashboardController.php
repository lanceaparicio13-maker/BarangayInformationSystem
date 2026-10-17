<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\DocumentRequest;
use App\Models\Resident;
use Illuminate\Http\JsonResponse;

class DashboardController extends Controller
{
    /**
     * Return summary statistics for the staff dashboard.
     */
    public function index(): JsonResponse
    {
        $summary = [
            'total_requests' => DocumentRequest::count(),

            'pending_requests' => DocumentRequest::where(
                'status',
                'pending'
            )->count(),

            'approved_requests' => DocumentRequest::where(
                'status',
                'approved'
            )->count(),

            'rejected_requests' => DocumentRequest::where(
                'status',
                'rejected'
            )->count(),

            'released_requests' => DocumentRequest::where(
                'status',
                'released'
            )->count(),

            'total_residents' => Resident::count(),
        ];

        return response()->json([
            'message' => 'Dashboard summary retrieved successfully.',
            'summary' => $summary,
        ]);
    }
}
