<?php

namespace App\Http\Controllers;

use App\Models\Booking;
use App\Models\Flight;
use App\Models\Notification;
use App\Models\PromoCode;
use App\Models\PromoCodeUsage;
use App\Services\ActivityService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class BookingController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        try {
            $query = $request->user()->bookings()
                ->with(['flight.airline', 'flight.originAirport', 'flight.destinationAirport', 'passengers']);

            // Filter by status
            if ($request->has('status')) {
                $query->where('status', $request->status);
            }

            // Order by date
            $bookings = $query->orderBy('created_at', 'desc')->get();

            // Add computed properties
            $bookings->each(function ($booking) {
                $booking->can_cancel = $booking->canBeCancelled();

                // For external bookings without flight relation
                if ($booking->isExternal()) {
                    $booking->flight_details = $booking->external_booking_data;
                    $booking->can_review = false; // External bookings can't be reviewed in our system
                } else if ($booking->flight) {
                    $booking->can_review = $booking->status === 'confirmed' &&
                        $booking->payment_status === 'paid' &&
                        $booking->flight->departure_time < now();
                } else {
                    $booking->can_review = false;
                }
            });

            return response()->json($bookings);
        } catch (\Exception $e) {
            Log::error('Failed to fetch bookings', [
                'user_id' => $request->user()->id,
                'error' => $e->getMessage(),
            ]);
            return response()->json([
                'message' => 'Failed to fetch bookings. Please try again.',
            ], 500);
        }
    }

    public function store(Request $request): JsonResponse
    {
        // Validate request
        try {
            $validated = $request->validate([
                'flight_id' => 'required',
                'package_id' => 'nullable|string',
                'passengers' => 'required|array|min:1',
                'passengers.*.name' => 'required|string',
                'passengers.*.first_name' => 'nullable|string',
                'passengers.*.last_name' => 'nullable|string',
                'passengers.*.date_of_birth' => 'nullable|date',
                'passengers.*.passport_number' => 'nullable|string',
                'passengers.*.passport_expiry' => 'nullable|date|after:today',
                'passengers.*.nationality' => 'nullable|string',
                'passengers.*.passenger_type' => 'nullable|in:adult,child,infant',
                'passengers.*.meal_preference' => 'nullable|string',
                'passengers.*.special_requests' => 'nullable|string',
                'passengers.*.seat_number' => 'nullable|string',
                'passengers.*.email' => 'nullable|email',
                'passengers.*.phone_number' => 'nullable|string',
                'promo_code' => 'nullable|string',
                'addons' => 'nullable|array',
                'addons.*.id' => 'required|exists:addons,id',
                'addons.*.quantity' => 'required|integer|min:1',
            ]);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $e->errors(),
            ], 422);
        }

        $flight = null;
        $externalOffer = null;
        $totalPrice = 0;
        $supplierCode = null;
        $externalOfferId = null;

        // Determine if local or external flight
        try {
            if (is_numeric($validated['flight_id'])) {
                $flight = Flight::find($validated['flight_id']);
                if (!$flight) {
                    return response()->json([
                        'message' => 'Flight not found',
                    ], 404);
                }
                $basePrice = $flight->base_price;
            } else {
                // External Flight
                $parts = explode('_', $validated['flight_id'], 2);
                if (count($parts) !== 2) {
                    return response()->json([
                        'message' => 'Invalid flight ID format. Expected format: supplierCode_offerId',
                    ], 400);
                }
                [$supplierCode, $externalOfferId] = $parts;

                // Get offer details from supplier
                $supplier = app(\App\Services\FlightSupplierManager::class)->driver($supplierCode);
                $externalOffer = $supplier->getOfferDetails($externalOfferId);

                if (!$externalOffer) {
                    return response()->json([
                        'message' => 'Flight offer is no longer available. Please search again.',
                    ], 404);
                }

                $basePrice = $externalOffer->price->total / count($validated['passengers']);
            }
        } catch (\InvalidArgumentException $e) {
            return response()->json([
                'message' => 'Unknown flight supplier: ' . $supplierCode,
            ], 400);
        } catch (\Exception $e) {
            Log::error('Failed to retrieve flight details', [
                'flight_id' => $validated['flight_id'],
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);
            return response()->json([
                'message' => 'Failed to retrieve flight details. Please try again.',
            ], 500);
        }

        // Calculate price based on package
        $packageId = $validated['package_id'] ?? null;
        $packageModifier = 0;

        if ($packageId && $flight) {
            if (is_numeric($packageId)) {
                $package = \App\Models\FlightPackage::find($packageId);
                if ($package && $package->flight_id === $flight->id) {
                    $packageModifier = $package->price_modifier;
                }
            } else {
                switch ($packageId) {
                    case 'premium_economy':
                        $packageModifier = round($basePrice * 0.4, 2);
                        break;
                    case 'business':
                        $packageModifier = round($basePrice * 1.5, 2);
                        break;
                    default:
                        $packageModifier = 0;
                }
            }
        }

        if ($flight) {
            $pricePerPassenger = $basePrice + $packageModifier;
            $totalBasePrice = $pricePerPassenger * count($validated['passengers']);
        } else {
            $totalBasePrice = $externalOffer->price->total;
        }

        // Calculate Add-ons Price
        $addonsCost = 0;
        $addonsData = [];
        if (!empty($validated['addons'])) {
            foreach ($validated['addons'] as $addonItem) {
                $addon = \App\Models\Addon::find($addonItem['id']);
                // Validate airline specific (if flight is local)
                if ($flight && $addon->airline_id && $addon->airline_id !== $flight->airline_id) {
                    continue; // Skip invalid addon for this airline
                }
                
                $qty = $addonItem['quantity'];
                $cost = $addon->price * $qty;
                $addonsCost += $cost;
                
                $addonsData[] = [
                    'addon_id' => $addon->id,
                    'quantity' => $qty,
                    'unit_price' => $addon->price,
                    'total_price' => $cost
                ];
            }
        }
        
        $totalBasePrice += $addonsCost;

        $discount = 0;
        $promoCode = null;

        // Validate and apply promo code
        if (!empty($validated['promo_code'])) {
            try {
                $promoCode = PromoCode::where('code', strtoupper($validated['promo_code']))->first();

                if (!$promoCode || !$promoCode->isValid()) {
                    return response()->json([
                        'message' => 'Invalid or expired promo code',
                    ], 422);
                }

                if ($promoCode->applicable_to !== 'both' && $promoCode->applicable_to !== 'flight') {
                    return response()->json([
                        'message' => 'This promo code is not applicable for flight bookings',
                    ], 422);
                }

                $alreadyUsed = PromoCodeUsage::where('promo_code_id', $promoCode->id)
                    ->where('user_id', $request->user()->id)
                    ->exists();

                if ($alreadyUsed) {
                    return response()->json([
                        'message' => 'You have already used this promo code',
                    ], 422);
                }

                $discount = $promoCode->calculateDiscount($totalBasePrice);
            } catch (\Exception $e) {
                Log::warning('Promo code validation error', [
                    'code' => $validated['promo_code'],
                    'error' => $e->getMessage(),
                ]);
                // Continue without promo code
                $promoCode = null;
                $discount = 0;
            }
        }

        $totalPrice = $totalBasePrice - $discount;

        // Check seat availability (Local flights only)
        $flightHasSeats = $flight && $flight->seats()->exists();

        if ($flightHasSeats) {
            $requestedSeats = [];
            foreach ($validated['passengers'] as $passengerData) {
                if (!empty($passengerData['seat_number'])) {
                    $seatNumber = $passengerData['seat_number'];
                    
                    // Check for duplicate seat selection
                    if (in_array($seatNumber, $requestedSeats)) {
                        return response()->json([
                            'message' => "Seat {$seatNumber} has been selected for multiple passengers.",
                        ], 422);
                    }
                    $requestedSeats[] = $seatNumber;

                    $seat = $flight->seats()->where('seat_number', $seatNumber)->first();

                    if (!$seat) {
                        return response()->json([
                            'message' => "Seat {$seatNumber} does not exist on this flight.",
                        ], 422);
                    }

                    if ($seat->is_booked) {
                        return response()->json([
                            'message' => "Seat {$seatNumber} is already booked.",
                        ], 422);
                    }
                }
            }
        }

        // Create booking within transaction
        try {
            return DB::transaction(function () use ($validated, $flight, $externalOffer, $totalPrice, $discount, $promoCode, $request, $flightHasSeats, $supplierCode, $externalOfferId, $addonsData) {
                $booking = Booking::create([
                    'user_id' => $request->user()->id,
                    'flight_id' => $flight?->id,
                    'supplier_code' => $supplierCode,
                    'external_offer_id' => $externalOfferId,
                    'external_booking_data' => $externalOffer ? [
                        'flight' => $externalOffer->getSummary(),
                        'raw_offer' => $externalOffer->toArray(),
                    ] : null,
                    'total_price' => $totalPrice,
                    'currency' => $flight ? 'USD' : ($externalOffer->price->currency ?? 'USD'),
                    'status' => 'pending',
                    'payment_status' => 'unpaid',
                    'pnr' => Str::upper(Str::random(6)),
                    'source' => 'web',
                ]);

                // Create Booking Add-ons
                foreach ($addonsData as $addon) {
                    $booking->addons()->create($addon);
                }

                foreach ($validated['passengers'] as $passengerData) {
                    $seatNumber = $passengerData['seat_number'] ?? null;

                    $booking->passengers()->create([
                        'name' => $passengerData['name'],
                        'first_name' => $passengerData['first_name'] ?? null,
                        'last_name' => $passengerData['last_name'] ?? null,
                        'date_of_birth' => $passengerData['date_of_birth'] ?? null,
                        'passport_number' => $passengerData['passport_number'] ?? null,
                        'passport_expiry' => $passengerData['passport_expiry'] ?? null,
                        'nationality' => $passengerData['nationality'] ?? null,
                        'passenger_type' => $passengerData['passenger_type'] ?? 'adult',
                        'meal_preference' => $passengerData['meal_preference'] ?? null,
                        'special_requests' => $passengerData['special_requests'] ?? null,
                        'seat_number' => $seatNumber,
                        'email' => $passengerData['email'] ?? null,
                        'phone_number' => $passengerData['phone_number'] ?? null,
                    ]);

                    // Mark seat as booked (Local only)
                    if ($flightHasSeats && !empty($seatNumber)) {
                        $flight->seats()->where('seat_number', $seatNumber)->update(['is_booked' => true]);
                    }
                }

                // Record promo code usage
                if ($promoCode && $discount > 0) {
                    PromoCodeUsage::create([
                        'promo_code_id' => $promoCode->id,
                        'user_id' => $request->user()->id,
                        'booking_id' => $booking->id,
                        'discount_applied' => $discount,
                    ]);

                    $promoCode->increment('used_count');
                }

                // Create notification for user
                Notification::create([
                    'user_id' => $request->user()->id,
                    'type' => 'booking',
                    'title' => 'Booking Created',
                    'message' => "Your booking #{$booking->pnr} has been created. Please complete payment to confirm.",
                    'data' => ['booking_id' => $booking->id],
                ]);

                $booking->load('passengers', 'addons');
                if ($booking->flight_id) {
                    $booking->load('flight.airline', 'flight.originAirport', 'flight.destinationAirport');
                }

                Log::info('Booking created successfully', [
                    'booking_id' => $booking->id,
                    'pnr' => $booking->pnr,
                    'user_id' => $request->user()->id,
                    'total_price' => $totalPrice,
                    'discount' => $discount,
                    'addons_count' => count($addonsData)
                ]);

                // Log activity
                ActivityService::logBookingCreated($booking);

                return response()->json([
                    'booking' => $booking,
                    'discount_applied' => $discount,
                    'message' => 'Booking created successfully',
                ], 201);
            });
        } catch (\Exception $e) {
            Log::error('Booking creation failed', [
                'user_id' => $request->user()->id,
                'flight_id' => $validated['flight_id'],
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json([
                'message' => 'Failed to create booking. Please try again.',
            ], 500);
        }
    }


    public function show(Booking $booking): JsonResponse
    {
        try {
            if ($booking->user_id !== request()->user()->id && !request()->user()->isAdmin()) {
                return response()->json(['message' => 'Unauthorized'], 403);
            }

            // Load base relations
            $booking->load(['passengers', 'promoCodeUsage.promoCode']);

            // Only load flight relations for local bookings
            if ($booking->flight_id) {
                $booking->load(['flight.airline', 'flight.originAirport', 'flight.destinationAirport']);
            }

            // Add computed properties
            $booking->can_cancel = $booking->canBeCancelled();
            $booking->cancellation_preview = $booking->canBeCancelled() ? $booking->calculateRefund() : null;

            // For external bookings, include flight details
            if ($booking->isExternal() && !$booking->flight_id) {
                $booking->flight_details = $booking->external_booking_data;
            }

            return response()->json($booking);
        } catch (\Exception $e) {
            Log::error('Failed to fetch booking details', [
                'booking_id' => $booking->id,
                'error' => $e->getMessage(),
            ]);
            return response()->json([
                'message' => 'Failed to fetch booking details.',
            ], 500);
        }
    }

    /**
     * Update booking status (Admin only)
     */
    public function update(Request $request, Booking $booking): JsonResponse
    {
        if (!$request->user()->isAdmin()) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $validated = $request->validate([
            'status' => 'sometimes|in:pending,confirmed,cancelled,completed',
            'payment_status' => 'sometimes|in:unpaid,paid,refunded',
        ]);

        try {
            $booking->update($validated);

            Log::info('Booking updated by admin', [
                'booking_id' => $booking->id,
                'admin_id' => $request->user()->id,
                'changes' => $validated,
            ]);

            return response()->json([
                'booking' => $booking->fresh(['passengers', 'flight']),
                'message' => 'Booking updated successfully',
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to update booking', [
                'booking_id' => $booking->id,
                'error' => $e->getMessage(),
            ]);
            return response()->json([
                'message' => 'Failed to update booking.',
            ], 500);
        }
    }
}
