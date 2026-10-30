<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\DashboardController;
use App\Http\Controllers\Api\EquipmentCategoryController;
use App\Http\Controllers\Api\EquipmentController;
use App\Http\Controllers\Api\FacilityController;
use App\Http\Controllers\Api\ReservationController;
use Illuminate\Support\Facades\Route;

Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);

Route::middleware('auth:sanctum')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/user', [AuthController::class, 'user']);
    Route::get('/dashboard', DashboardController::class);

    Route::get('/facilities/options', [FacilityController::class, 'options']);
    Route::get('/equipment/options', [EquipmentController::class, 'options']);
    Route::get('/equipment-categories/options', [EquipmentCategoryController::class, 'options']);

    Route::apiResource('reservations', ReservationController::class);
    Route::patch('/reservations/{reservation}/status', [ReservationController::class, 'changeStatus'])->middleware('admin');

    Route::apiResource('facilities', FacilityController::class)->only(['index', 'show']);
    Route::apiResource('equipment', EquipmentController::class)->only(['index', 'show']);
    Route::apiResource('equipment-categories', EquipmentCategoryController::class)->only(['index', 'show']);

    Route::middleware('admin')->group(function () {
        Route::apiResource('facilities', FacilityController::class)->only(['store', 'update', 'destroy']);
        Route::apiResource('equipment', EquipmentController::class)->only(['store', 'update', 'destroy']);
        Route::apiResource('equipment-categories', EquipmentCategoryController::class)->only(['store', 'update', 'destroy']);
    });
});
