<?php

namespace App\Http\Controllers;

use App\Models\Booking;
use App\Models\Flight;
use App\Models\Passenger;
use App\Models\Seat;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class BookingController extends Controller
{
    public function index(Request $request)
    {
        return $request->user()->bookings()->with(['flight.airline', 'flight.originAirport', 'flight.destinationAirport'])->get();
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'flight_id' => 'required|exists:flights,id',
            'passengers' => 'required|array|min:1',
            'passengers.*.name' => 'required|string',
            'passengers.*.passport_number' => 'nullable|string',
            'passengers.*.seat_number' => 'required|string',
        ]);

        $flight = Flight::findOrFail($validated['flight_id']);
        $totalPrice = $flight->base_price * count($validated['passengers']);

        // Check seat availability
        foreach ($validated['passengers'] as $passengerData) {
            $seat = $flight->seats()->where('seat_number', $passengerData['seat_number'])->first();
            
            if (!$seat) {
                return response()->json(['message' => "Seat {$passengerData['seat_number']} does not exist on this flight."], 422);
            }

            if ($seat->is_booked) {
                return response()->json(['message' => "Seat {$passengerData['seat_number']} is already booked."], 422);
            }
        }

        return DB::transaction(function () use ($validated, $flight, $totalPrice, $request) {
            $booking = Booking::create([
                'user_id' => $request->user()->id,
                'flight_id' => $flight->id,
                'total_price' => $totalPrice,
                'status' => 'pending',
                'payment_status' => 'unpaid',
                'pnr' => Str::upper(Str::random(6)),
            ]);

            foreach ($validated['passengers'] as $passengerData) {
                $booking->passengers()->create([
                    'name' => $passengerData['name'],
                    'passport_number' => $passengerData['passport_number'] ?? null,
                    'seat_number' => $passengerData['seat_number'],
                ]);

                // Mark seat as booked
                $flight->seats()->where('seat_number', $passengerData['seat_number'])->update(['is_booked' => true]);
            }

            return $booking->load('passengers', 'flight.airline', 'flight.originAirport', 'flight.destinationAirport');
        });
    }

    public function show(Booking $booking)
    {
        if ($booking->user_id !== request()->user()->id && !request()->user()->isAdmin()) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        return $booking->load(['flight.airline', 'flight.originAirport', 'flight.destinationAirport', 'passengers']);
    }
}
