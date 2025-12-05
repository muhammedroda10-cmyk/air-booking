<?php

namespace App\Http\Controllers;

use App\Models\Booking;
use App\Models\Flight;
use App\Models\PromoCode;
use App\Models\PromoCodeUsage;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class BookingController extends Controller
{
    public function index(Request $request): JsonResponse
    {
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
            $booking->can_review = $booking->status === 'confirmed' && 
                                   $booking->payment_status === 'paid' &&
                                   $booking->flight->departure_time < now();
        });

        return response()->json($bookings);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'flight_id' => 'required|exists:flights,id',
            'package_id' => 'nullable|string', // Can be string for default packages or integer for stored packages
            'passengers' => 'required|array|min:1',
            'passengers.*.name' => 'required|string',
            'passengers.*.first_name' => 'nullable|string',
            'passengers.*.last_name' => 'nullable|string',
            'passengers.*.date_of_birth' => 'nullable|date',
            'passengers.*.passport_number' => 'nullable|string',
            'passengers.*.passport_expiry' => 'nullable|date',
            'passengers.*.nationality' => 'nullable|string',
            'passengers.*.passenger_type' => 'nullable|in:adult,child,infant',
            'passengers.*.meal_preference' => 'nullable|string',
            'passengers.*.special_requests' => 'nullable|string',
            'passengers.*.seat_number' => 'nullable|string',
            'promo_code' => 'nullable|string',
        ]);

        $flight = Flight::findOrFail($validated['flight_id']);
        
        // Calculate price based on package if provided
        $basePrice = $flight->base_price;
        $packageId = $validated['package_id'] ?? null;
        $packageModifier = 0;
        
        // Handle package pricing
        if ($packageId) {
            if (is_numeric($packageId)) {
                // Stored package
                $package = \App\Models\FlightPackage::find($packageId);
                if ($package && $package->flight_id === $flight->id) {
                    $packageModifier = $package->price_modifier;
                }
            } else {
                // Default package calculation
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
        
        $pricePerPassenger = $basePrice + $packageModifier;
        $totalBasePrice = $pricePerPassenger * count($validated['passengers']);
        $discount = 0;
        $promoCode = null;

        // Validate and apply promo code
        if (!empty($validated['promo_code'])) {
            $promoCode = PromoCode::where('code', strtoupper($validated['promo_code']))->first();
            
            if ($promoCode && $promoCode->isValid()) {
                // Check if applicable to flights
                if ($promoCode->applicable_to !== 'both' && $promoCode->applicable_to !== 'flight') {
                    return response()->json(['message' => 'This promo code is not applicable for flight bookings'], 422);
                }

                // Check if user already used this promo
                $alreadyUsed = PromoCodeUsage::where('promo_code_id', $promoCode->id)
                    ->where('user_id', $request->user()->id)
                    ->exists();

                if ($alreadyUsed) {
                    return response()->json(['message' => 'You have already used this promo code'], 422);
                }

                $discount = $promoCode->calculateDiscount($totalBasePrice);
            } else {
                return response()->json(['message' => 'Invalid or expired promo code'], 422);
            }
        }

        $totalPrice = $totalBasePrice - $discount;

        // Check seat availability only if seats are provided and flight has seats
        $flightHasSeats = $flight->seats()->exists();
        
        if ($flightHasSeats) {
            foreach ($validated['passengers'] as $passengerData) {
                if (!empty($passengerData['seat_number'])) {
                    $seat = $flight->seats()->where('seat_number', $passengerData['seat_number'])->first();
                    
                    if (!$seat) {
                        return response()->json(['message' => "Seat {$passengerData['seat_number']} does not exist on this flight."], 422);
                    }

                    if ($seat->is_booked) {
                        return response()->json(['message' => "Seat {$passengerData['seat_number']} is already booked."], 422);
                    }
                }
            }
        }

        return DB::transaction(function () use ($validated, $flight, $totalPrice, $discount, $promoCode, $request, $flightHasSeats) {
            $booking = Booking::create([
                'user_id' => $request->user()->id,
                'flight_id' => $flight->id,
                'total_price' => $totalPrice,
                'currency' => 'USD',
                'status' => 'pending',
                'payment_status' => 'unpaid',
                'pnr' => Str::upper(Str::random(6)),
                'source' => 'web',
            ]);

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
                ]);

                // Mark seat as booked only if seat exists
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

            $booking->load('passengers', 'flight.airline', 'flight.originAirport', 'flight.destinationAirport');

            return response()->json([
                'booking' => $booking,
                'discount_applied' => $discount,
                'message' => 'Booking created successfully',
            ], 201);
        });
    }

    public function show(Booking $booking): JsonResponse
    {
        if ($booking->user_id !== request()->user()->id && !request()->user()->isAdmin()) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $booking->load(['flight.airline', 'flight.originAirport', 'flight.destinationAirport', 'passengers', 'promoCodeUsage.promoCode']);
        
        // Add computed properties
        $booking->can_cancel = $booking->canBeCancelled();
        $booking->cancellation_preview = $booking->canBeCancelled() ? $booking->calculateRefund() : null;

        return response()->json($booking);
    }
}
