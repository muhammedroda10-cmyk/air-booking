<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class WalletController extends Controller
{
    public function show(Request $request)
    {
        $wallet = $request->user()->wallet()->with('transactions')->firstOrCreate([
            'user_id' => $request->user()->id
        ]);

        return $wallet;
    }

    public function deposit(Request $request)
    {
        $request->validate([
            'amount' => 'required|numeric|min:1',
        ]);

        $wallet = $request->user()->wallet()->firstOrCreate([
            'user_id' => $request->user()->id
        ]);

        DB::transaction(function () use ($wallet, $request) {
            $wallet->increment('balance', $request->amount);
            $wallet->transactions()->create([
                'amount' => $request->amount,
                'type' => 'credit',
                'description' => 'Deposit',
            ]);
        });

        return $wallet->load('transactions');
    }

    public function pay(Request $request)
    {
        $request->validate([
            'booking_id' => 'required|exists:bookings,id',
            'amount' => 'required|numeric|min:0.01',
        ]);

        $booking = \App\Models\Booking::findOrFail($request->booking_id);

        // Verify the booking belongs to the user
        if ($booking->user_id !== $request->user()->id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        // Check if already paid
        if ($booking->payment_status === 'paid') {
            return response()->json(['message' => 'Booking already paid'], 400);
        }

        $wallet = $request->user()->wallet()->firstOrCreate([
            'user_id' => $request->user()->id
        ]);

        // Check sufficient balance
        if ($wallet->balance < $request->amount) {
            return response()->json(['message' => 'Insufficient wallet balance'], 400);
        }

        DB::transaction(function () use ($wallet, $booking, $request) {
            // Deduct from wallet
            $wallet->decrement('balance', $request->amount);
            $wallet->transactions()->create([
                'amount' => $request->amount,
                'type' => 'debit',
                'description' => "Payment for booking #{$booking->pnr}",
            ]);

            // Update booking status
            $booking->update([
                'payment_status' => 'paid',
                'status' => 'confirmed',
            ]);
        });

        return response()->json([
            'message' => 'Payment successful',
            'booking' => $booking->fresh()->load('passengers', 'flight.airline', 'flight.originAirport', 'flight.destinationAirport'),
            'new_balance' => $wallet->fresh()->balance
        ]);
    }
}
