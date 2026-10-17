<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\ResidentController;
use App\Http\Controllers\Api\DocumentRequestController;
use App\Http\Controllers\Api\StaffDocumentRequestController;

Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);

Route::middleware('auth:sanctum')->group(function () {

    // Authenticated user
    Route::get('/user', function (Request $request) {
        return $request->user();
    });

    // Staff and admin: test access
    Route::get('/staff-test', function (Request $request) {
        return response()->json([
            'message' => 'Staff access granted!',
            'user' => $request->user()->name,
        ]);
    })->middleware('role:staff,admin');

    // Resident profile management
    Route::get('/resident/profile', [
        ResidentController::class,
        'show',
    ]);

    Route::post('/resident/profile', [
        ResidentController::class,
        'store',
    ]);

    Route::put('/resident/profile', [
        ResidentController::class,
        'update',
    ]);

    // Get active document types
    Route::get('/document-types', [
        DocumentRequestController::class,
        'documentTypes',
    ]);

    // Resident: submit a document request
    Route::post('/document-requests', [
        DocumentRequestController::class,
        'store',
    ]);

    // Resident: view their own document requests
    Route::get('/my-document-requests', [
        DocumentRequestController::class,
        'myRequests',
    ]);

    // Staff/admin: view all document requests
    Route::get('/document-requests', [
        DocumentRequestController::class,
        'index',
    ])->middleware('role:staff,admin');

    // Staff/admin: manage document requests
    Route::middleware('role:staff,admin')->group(function () {

        // View all requests for staff
        Route::get('/staff/document-requests', [
            StaffDocumentRequestController::class,
            'index',
        ]);

        // Approve or reject a pending request
        Route::put('/staff/document-requests/{id}', [
            StaffDocumentRequestController::class,
            'update',
        ]);

        // Mark an approved request as released
        Route::put('/staff/document-requests/{id}/release', [
            StaffDocumentRequestController::class,
            'release',
        ]);
    });

    // Logout
    Route::post('/logout', [
        AuthController::class,
        'logout',
    ]);
});
