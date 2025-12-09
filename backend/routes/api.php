<?php

use App\Http\Controllers\AuthController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);

Route::get('/flights/search', [\App\Http\Controllers\FlightController::class, 'search']);
Route::get('/flights/search-external', [\App\Http\Controllers\FlightController::class, 'searchExternal']);
Route::get('/flights/offer-details', [\App\Http\Controllers\FlightController::class, 'getOfferDetails']);
Route::get('/flights/routes', [\App\Http\Controllers\FlightController::class, 'routes']);
Route::get('/flights', [\App\Http\Controllers\FlightController::class, 'index']);
Route::get('/flights/{flight}', [\App\Http\Controllers\FlightController::class, 'show']);
Route::get('/flights/{flight}/seats', [\App\Http\Controllers\SeatController::class, 'index']);
Route::get('/offers/seats', [\App\Http\Controllers\SeatController::class, 'showOfferSeats']);
Route::get('/flights/{flight}/packages', [\App\Http\Controllers\FlightPackageController::class, 'index']);

// Amadeus API endpoints (Location search, Airline lookup, Pricing, Order management)
Route::get('/locations/search', [\App\Http\Controllers\AmadeusController::class, 'searchLocations']);
Route::get('/airlines/lookup/{code}', [\App\Http\Controllers\AmadeusController::class, 'getAirline']);
Route::post('/flights/price', [\App\Http\Controllers\AmadeusController::class, 'priceOffer']);
Route::get('/flights/orders/{orderId}', [\App\Http\Controllers\AmadeusController::class, 'getOrder']);
Route::delete('/flights/orders/{orderId}', [\App\Http\Controllers\AmadeusController::class, 'cancelOrder']);

Route::get('/airports', [\App\Http\Controllers\AirportController::class, 'index']);
Route::get('/airlines', [\App\Http\Controllers\AirlineController::class, 'index']);
Route::get('/airlines/{airline}', [\App\Http\Controllers\AirlineController::class, 'show']);
Route::get('/addons', [\App\Http\Controllers\AddonController::class, 'index']);




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

// Promotions/Deals routes (static for display)
Route::get('/promotions', [\App\Http\Controllers\PromotionController::class, 'index']);
Route::get('/promotions/featured', [\App\Http\Controllers\PromotionController::class, 'featured']);
Route::get('/promotions/homepage-deals', [\App\Http\Controllers\PromotionController::class, 'homepageDeals']);

// Promo codes public routes
Route::get('/promo-codes/active', [\App\Http\Controllers\PromoCodeController::class, 'activePromoCodes']);
Route::post('/promo-codes/validate', [\App\Http\Controllers\PromoCodeController::class, 'validateCode']);

// Reviews public routes
Route::get('/reviews', [\App\Http\Controllers\ReviewController::class, 'index']);


Route::middleware('auth:sanctum')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/user', [AuthController::class, 'user']);
    Route::put('/user/profile', [AuthController::class, 'updateProfile']);
    Route::put('/user/password', [AuthController::class, 'changePassword']);

    Route::get('/wallet', [\App\Http\Controllers\WalletController::class, 'show']);
    Route::post('/wallet/deposit', [\App\Http\Controllers\WalletController::class, 'deposit']);
    Route::get('/wallet/stats', [\App\Http\Controllers\WalletController::class, 'stats']);

    Route::get('/bookings', [\App\Http\Controllers\BookingController::class, 'index']);
    Route::post('/bookings', [\App\Http\Controllers\BookingController::class, 'store']);
    Route::get('/bookings/{booking}', [\App\Http\Controllers\BookingController::class, 'show']);
    Route::get('/bookings/{booking}/ticket', [\App\Http\Controllers\TicketController::class, 'show']);
    Route::get('/bookings/{booking}/cancel-preview', [\App\Http\Controllers\TicketController::class, 'previewCancellation']);
    Route::post('/bookings/{booking}/cancel', [\App\Http\Controllers\TicketController::class, 'cancel']);
    Route::get('/bookings/{booking}/download', [\App\Http\Controllers\TicketController::class, 'download']);
    Route::get('/bookings/{booking}/calendar', [\App\Http\Controllers\TicketController::class, 'exportCalendar']);

    Route::post('/payments', [\App\Http\Controllers\PaymentController::class, 'store']);
    Route::post('/bookings/{booking}/payment/intent', [\App\Http\Controllers\PaymentController::class, 'createPaymentIntent']);
    Route::post('/bookings/{booking}/payment/confirm', [\App\Http\Controllers\PaymentController::class, 'confirmPayment']);
    Route::get('/payments/{bookingId}/status', [\App\Http\Controllers\PaymentController::class, 'status']);
    Route::post('/bookings/{booking}/refund', [\App\Http\Controllers\PaymentController::class, 'refund']);


    Route::post('/hotel-bookings', [\App\Http\Controllers\HotelBookingController::class, 'store']);
    Route::get('/hotel-bookings', [\App\Http\Controllers\HotelBookingController::class, 'index']);

    // Reviews user routes
    Route::post('/reviews', [\App\Http\Controllers\ReviewController::class, 'store']);
    Route::get('/user/reviews', [\App\Http\Controllers\ReviewController::class, 'userReviews']);

    // Notifications routes
    Route::get('/notifications', [\App\Http\Controllers\NotificationController::class, 'index']);
    Route::get('/notifications/unread-count', [\App\Http\Controllers\NotificationController::class, 'unreadCount']);
    Route::post('/notifications/{notification}/read', [\App\Http\Controllers\NotificationController::class, 'markAsRead']);
    Route::post('/notifications/read-all', [\App\Http\Controllers\NotificationController::class, 'markAllAsRead']);
    Route::delete('/notifications/{notification}', [\App\Http\Controllers\NotificationController::class, 'destroy']);
    Route::delete('/notifications', [\App\Http\Controllers\NotificationController::class, 'clearAll']);

    // Price Alerts routes
    Route::get('/price-alerts', [\App\Http\Controllers\PriceAlertController::class, 'index']);
    Route::post('/price-alerts', [\App\Http\Controllers\PriceAlertController::class, 'store']);
    Route::get('/price-alerts/{priceAlert}', [\App\Http\Controllers\PriceAlertController::class, 'show']);
    Route::put('/price-alerts/{priceAlert}', [\App\Http\Controllers\PriceAlertController::class, 'update']);
    Route::delete('/price-alerts/{priceAlert}', [\App\Http\Controllers\PriceAlertController::class, 'destroy']);
    Route::post('/price-alerts/{priceAlert}/toggle', [\App\Http\Controllers\PriceAlertController::class, 'toggle']);
    Route::post('/price-alerts/{priceAlert}/check', [\App\Http\Controllers\PriceAlertController::class, 'checkPrice']);

    // Loyalty Program routes
    Route::get('/loyalty', [\App\Http\Controllers\LoyaltyController::class, 'show']);
    Route::get('/loyalty/transactions', [\App\Http\Controllers\LoyaltyController::class, 'transactions']);
    Route::post('/loyalty/calculate', [\App\Http\Controllers\LoyaltyController::class, 'calculatePoints']);
    Route::post('/loyalty/redeem', [\App\Http\Controllers\LoyaltyController::class, 'redeem']);
    Route::get('/loyalty/tiers', [\App\Http\Controllers\LoyaltyController::class, 'tiers']);

    Route::middleware('admin')->group(function () {

        Route::apiResource('airports', \App\Http\Controllers\AirportController::class)->except(['index']);
        Route::apiResource('airlines', \App\Http\Controllers\AirlineController::class)->except(['index', 'show']);
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

        // Promo code management
        Route::apiResource('admin/promo-codes', \App\Http\Controllers\PromoCodeController::class);

        // Review management
        Route::get('/admin/reviews', [\App\Http\Controllers\ReviewController::class, 'adminIndex']);
        Route::get('/admin/reviews/pending', [\App\Http\Controllers\ReviewController::class, 'pending']);
        Route::post('/admin/reviews/{review}/approve', [\App\Http\Controllers\ReviewController::class, 'approve']);
        Route::post('/admin/reviews/{review}/reject', [\App\Http\Controllers\ReviewController::class, 'reject']);
        Route::post('/admin/reviews/{review}/respond', [\App\Http\Controllers\ReviewController::class, 'respond']);

        // Supplier management
        Route::apiResource('admin/suppliers', \App\Http\Controllers\Admin\SupplierController::class);
        Route::post('/admin/suppliers/{supplier}/toggle-status', [\App\Http\Controllers\Admin\SupplierController::class, 'toggleStatus']);
        Route::post('/admin/suppliers/{supplier}/test', [\App\Http\Controllers\Admin\SupplierController::class, 'testConnection']);
    });
});
