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
}
