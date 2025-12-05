<?php

namespace App\Http\Controllers;

use App\Models\Booking;
use Illuminate\Http\Request;

class PaymentController extends Controller
{
    public function store(Request $request)
    {
        $request->validate([
            'booking_id' => 'required|exists:bookings,id',
            'payment_method' => 'required|string', // e.g., 'credit_card'
        ]);

        $booking = Booking::findOrFail($request->booking_id);

        if ($booking->user_id !== $request->user()->id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        if ($booking->payment_status === 'paid') {
            return response()->json(['message' => 'Booking already paid'], 400);
        }

        if ($request->payment_method === 'wallet') {
            $wallet = $request->user()->wallet;
            if (!$wallet || $wallet->balance < $booking->total_price) {
                return response()->json(['message' => 'Insufficient funds'], 400);
            }

            \DB::transaction(function () use ($booking, $wallet) {
                $wallet->decrement('balance', $booking->total_price);
                $wallet->transactions()->create([
                    'amount' => $booking->total_price,
                    'type' => 'debit',
                    'description' => "Payment for booking #{$booking->pnr}",
                ]);
                
                $booking->update([
                    'payment_status' => 'paid',
                    'status' => 'confirmed',
                ]);
            });
        } else {
            // Mock Payment Logic
            $booking->update([
                'payment_status' => 'paid',
                'status' => 'confirmed',
            ]);
        }

        return response()->json([
            'message' => 'Payment successful',
            'booking' => $booking,
        ]);
    }

    public function process(Request $request)
    {
        $request->validate([
            'booking_id' => 'required|exists:bookings,id',
            'payment_method' => 'required|string|in:credit_card,debit_card',
            'amount' => 'required|numeric|min:0.01',
            'card_last_four' => 'nullable|string|size:4',
        ]);

        $booking = Booking::findOrFail($request->booking_id);

        // Verify the booking belongs to the user
        if ($booking->user_id !== $request->user()->id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        // Check if already paid
        if ($booking->payment_status === 'paid') {
            return response()->json(['message' => 'Booking already paid'], 400);
        }

        // In a real application, this would integrate with a payment gateway like Stripe
        // For now, we simulate payment processing
        
        // Simulate payment processing delay (in production, this would be async)
        // usleep(500000); // 500ms

        // Mock successful payment
        $booking->update([
            'payment_status' => 'paid',
            'status' => 'confirmed',
        ]);

        return response()->json([
            'message' => 'Payment successful',
            'booking' => $booking->fresh()->load('passengers', 'flight.airline', 'flight.originAirport', 'flight.destinationAirport'),
            'transaction_id' => 'TXN_' . strtoupper(uniqid()),
        ]);
    }
}
