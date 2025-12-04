<?php

use App\Http\Controllers\AuthController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);

Route::get('/flights/search', [\App\Http\Controllers\FlightController::class, 'search']);
Route::get('/flights/routes', [\App\Http\Controllers\FlightController::class, 'routes']);
Route::get('/flights', [\App\Http\Controllers\FlightController::class, 'index']);
Route::get('/flights/{flight}/seats', [\App\Http\Controllers\SeatController::class, 'index']);
Route::get('/airports', [\App\Http\Controllers\AirportController::class, 'index']);
Route::get('/airlines', [\App\Http\Controllers\AirlineController::class, 'index']);

// Hotel public routes
Route::get('/hotels', [\App\Http\Controllers\HotelController::class, 'index']);
Route::get('/hotels/search', [\App\Http\Controllers\HotelController::class, 'search']);
Route::get('/hotels/{hotel}', [\App\Http\Controllers\HotelController::class, 'show']);

Route::post('/contact', [\App\Http\Controllers\ContactController::class, 'contact']);
Route::post('/newsletter', [\App\Http\Controllers\ContactController::class, 'newsletter']);
Route::post('/forgot-password', [AuthController::class, 'forgotPassword']);
Route::post('/reset-password', [AuthController::class, 'resetPassword']);

Route::middleware('auth:sanctum')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/user', [AuthController::class, 'user']);
    Route::put('/user/profile', [AuthController::class, 'updateProfile']);
    Route::put('/user/password', [AuthController::class, 'changePassword']);

    Route::get('/wallet', [\App\Http\Controllers\WalletController::class, 'show']);
    Route::post('/wallet/deposit', [\App\Http\Controllers\WalletController::class, 'deposit']);

    Route::get('/bookings', [\App\Http\Controllers\BookingController::class, 'index']);
    Route::post('/bookings', [\App\Http\Controllers\BookingController::class, 'store']);
    Route::get('/bookings/{booking}', [\App\Http\Controllers\BookingController::class, 'show']);
    Route::post('/payments', [\App\Http\Controllers\PaymentController::class, 'store']);

    Route::post('/hotel-bookings', [\App\Http\Controllers\HotelBookingController::class, 'store']);
    Route::get('/hotel-bookings', [\App\Http\Controllers\HotelBookingController::class, 'index']);

    Route::middleware('admin')->group(function () {
        Route::apiResource('airports', \App\Http\Controllers\AirportController::class)->except(['index']);
        Route::apiResource('airlines', \App\Http\Controllers\AirlineController::class);
        Route::apiResource('flights', \App\Http\Controllers\FlightController::class);
        Route::get('/admin/bookings', [\App\Http\Controllers\AdminBookingController::class, 'index']);
        Route::get('/admin/stats', [\App\Http\Controllers\DashboardController::class, 'stats']);
    });
});
