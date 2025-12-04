<?php

namespace App\Http\Controllers;

use App\Models\Booking;
use Illuminate\Http\Request;

class TicketController extends Controller
{
    /**
     * Get ticket details for a booking
     */
    public function show(Booking $booking)
    {
        $user = request()->user();

        // Authorization check
        if ($booking->user_id !== $user->id && !$user->isAdmin()) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $booking->load([
            'flight.airline',
            'flight.originAirport',
            'flight.destinationAirport',
            'passengers',
            'user'
        ]);

        return response()->json([
            'ticket' => [
                'pnr' => $booking->pnr,
                'status' => $booking->status,
                'payment_status' => $booking->payment_status,
                'total_price' => $booking->total_price,
                'created_at' => $booking->created_at,
                'passenger' => [
                    'name' => $booking->user->name,
                    'email' => $booking->user->email,
                ],
                'flight' => [
                    'number' => $booking->flight->flight_number,
                    'airline' => $booking->flight->airline->name,
                    'departure' => [
                        'airport' => $booking->flight->originAirport->code,
                        'city' => $booking->flight->originAirport->city,
                        'time' => $booking->flight->departure_time,
                    ],
                    'arrival' => [
                        'airport' => $booking->flight->destinationAirport->code,
                        'city' => $booking->flight->destinationAirport->city,
                        'time' => $booking->flight->arrival_time,
                    ],
                ],
                'passengers' => $booking->passengers->map(function ($p) {
                    return [
                        'name' => $p->name,
                        'seat' => $p->seat_number,
                        'passport' => $p->passport_number,
                    ];
                }),
            ]
        ]);
    }

    /**
     * Cancel a booking
     */
    public function cancel(Booking $booking)
    {
        $user = request()->user();

        if ($booking->user_id !== $user->id && !$user->isAdmin()) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        if ($booking->status === 'cancelled') {
            return response()->json(['message' => 'Booking is already cancelled'], 422);
        }

        // Check if flight hasn't departed
        if ($booking->flight && now()->isAfter($booking->flight->departure_time)) {
            return response()->json(['message' => 'Cannot cancel a booking for a departed flight'], 422);
        }

        // Release seats
        foreach ($booking->passengers as $passenger) {
            $booking->flight->seats()
                ->where('seat_number', $passenger->seat_number)
                ->update(['is_booked' => false]);
        }

        $booking->update(['status' => 'cancelled']);

        // If paid, initiate refund to wallet
        if ($booking->payment_status === 'paid') {
            $wallet = $user->wallet;
            if ($wallet) {
                $wallet->increment('balance', $booking->total_price);
                $wallet->transactions()->create([
                    'amount' => $booking->total_price,
                    'type' => 'credit',
                    'description' => "Refund for cancelled booking {$booking->pnr}",
                ]);
            }
            $booking->update(['payment_status' => 'refunded']);
        }

        return response()->json([
            'message' => 'Booking cancelled successfully',
            'booking' => $booking->fresh()
        ]);
    }
}
