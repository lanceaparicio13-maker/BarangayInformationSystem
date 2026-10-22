<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\DashboardController;
use App\Http\Controllers\Api\DocumentRequestController;
use App\Http\Controllers\Api\ResidentController;
use App\Http\Controllers\Api\StaffDocumentRequestController;
use App\Http\Controllers\Api\StaffDocumentTypeController;
use App\Http\Controllers\Api\StaffResidentController;

Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);

Route::middleware('auth:sanctum')->group(function () {

    // Authenticated user
    Route::get('/user', function (Request $request) {
        return $request->user();
    });

    // Staff/admin test access
    Route::get('/staff-test', function (Request $request) {
        return response()->json([
            'message' => 'Staff access granted!',
            'user' => $request->user()->name,
        ]);
    })->middleware('role:staff,admin');

    // Staff/admin dashboard
    Route::get('/staff/dashboard', [
        DashboardController::class,
        'index',
    ])->middleware('role:staff,admin');

    // Staff/admin resident directory
    Route::middleware('role:staff,admin')
        ->prefix('staff')
        ->group(function () {
            Route::get('/residents', [
                StaffResidentController::class,
                'index',
            ]);

            Route::get('/residents/{id}', [
                StaffResidentController::class,
                'show',
            ]);
        });

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

    // Active document types for resident document requests
    Route::get('/document-types', [
        DocumentRequestController::class,
        'documentTypes',
    ]);

    // Staff/admin document type management
    Route::middleware('role:staff,admin')
        ->prefix('staff/document-types')
        ->controller(StaffDocumentTypeController::class)
        ->group(function () {
            Route::get('/', 'index');
            Route::post('/', 'store');
            Route::put('/{id}', 'update');
        });

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

    // Staff/admin document request management
    Route::middleware('role:staff,admin')
        ->prefix('staff/document-requests')
        ->controller(StaffDocumentRequestController::class)
        ->group(function () {
            Route::get('/', 'index');
            Route::put('/{id}', 'update');
            Route::put('/{id}/release', 'release');
        });

    // Logout
    Route::post('/logout', [
        AuthController::class,
        'logout',
    ]);
});
