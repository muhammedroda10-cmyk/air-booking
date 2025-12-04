<?php

use App\Http\Controllers\AuthController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);

Route::get('/flights/search', [\App\Http\Controllers\FlightController::class, 'search']);
Route::get('/flights/routes', [\App\Http\Controllers\FlightController::class, 'routes']);
Route::get('/flights', [\App\Http\Controllers\FlightController::class, 'index']);
Route::get('/flights/{flight}', [\App\Http\Controllers\FlightController::class, 'show']);
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

// Blog routes
Route::get('/blog', [\App\Http\Controllers\BlogController::class, 'index']);
Route::get('/blog/{slug}', [\App\Http\Controllers\BlogController::class, 'show']);

// Promotions/Deals routes
Route::get('/promotions', [\App\Http\Controllers\PromotionController::class, 'index']);
Route::get('/promotions/featured', [\App\Http\Controllers\PromotionController::class, 'featured']);
Route::post('/promotions/validate', [\App\Http\Controllers\PromotionController::class, 'validate']);


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
    Route::get('/bookings/{booking}/ticket', [\App\Http\Controllers\TicketController::class, 'show']);
    Route::post('/bookings/{booking}/cancel', [\App\Http\Controllers\TicketController::class, 'cancel']);
    Route::post('/payments', [\App\Http\Controllers\PaymentController::class, 'store']);

    Route::post('/hotel-bookings', [\App\Http\Controllers\HotelBookingController::class, 'store']);
    Route::get('/hotel-bookings', [\App\Http\Controllers\HotelBookingController::class, 'index']);

    Route::middleware('admin')->group(function () {
        Route::apiResource('airports', \App\Http\Controllers\AirportController::class)->except(['index']);
        Route::apiResource('airlines', \App\Http\Controllers\AirlineController::class)->except(['index']);
        Route::apiResource('flights', \App\Http\Controllers\FlightController::class)->except(['index', 'show']);
        Route::apiResource('admin/hotels', \App\Http\Controllers\HotelController::class)->except(['index', 'show']);
        Route::get('/admin/bookings', [\App\Http\Controllers\AdminBookingController::class, 'index']);
        Route::get('/admin/stats', [\App\Http\Controllers\DashboardController::class, 'stats']);

        // User management
        Route::get('/admin/users', [\App\Http\Controllers\AdminUserController::class, 'index']);
        Route::get('/admin/users/{user}', [\App\Http\Controllers\AdminUserController::class, 'show']);
        Route::put('/admin/users/{user}', [\App\Http\Controllers\AdminUserController::class, 'update']);
        Route::post('/admin/users/{user}/toggle-status', [\App\Http\Controllers\AdminUserController::class, 'toggleStatus']);
        Route::delete('/admin/users/{user}', [\App\Http\Controllers\AdminUserController::class, 'destroy']);
    });
});
