<?php

namespace App\Http\Controllers;

use App\Models\Booking;
use App\Models\Wallet;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class PaymentController extends Controller
{
    /**
     * Process payment for a booking
     */
    public function store(Request $request)
    {
        $request->validate([
            'booking_id' => 'required|exists:bookings,id',
            'payment_method' => 'required|string|in:wallet,credit_card,debit_card',
        ]);

        $booking = Booking::with('flight')->findOrFail($request->booking_id);

        // Authorization check
        if ($booking->user_id !== $request->user()->id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        // Already paid check
        if ($booking->payment_status === 'paid') {
            return response()->json(['message' => 'Booking is already paid'], 400);
        }

        $amount = (float) $booking->total_price;

        try {
            \Log::info("Payment Request for Booking #{$booking->id}, Method: {$request->payment_method}");

            if ($request->payment_method === 'wallet') {
                return $this->processWalletPayment($request->user(), $booking, $amount);
            } else {
                return $this->processCardPayment($request->user(), $booking, $amount, $request->payment_method);
            }
        } catch (\Throwable $e) {
            \Log::error("Payment Processing Error: " . $e->getMessage() . "\n" . $e->getTraceAsString());
            return response()->json([
                'message' => 'Payment failed: ' . $e->getMessage()
            ], 400);
        }
    }

    /**
     * Process wallet payment
     */
    private function processWalletPayment($user, Booking $booking, float $amount)
    {
        $wallet = $user->wallet()->firstOrCreate(
            ['user_id' => $user->id],
            ['balance' => 0]
        );

        // Check sufficient balance
        if ((float) $wallet->balance < $amount) {
            return response()->json([
                'message' => 'Insufficient wallet balance',
                'required' => $amount,
                'available' => (float) $wallet->balance,
            ], 400);
        }

        $transactionId = 'WLT_' . strtoupper(uniqid());

        DB::transaction(function () use ($wallet, $booking, $amount, $transactionId) {
            \Log::info("Processing wallet payment for Booking #{$booking->id}. isExternal: " . ($booking->isExternal() ? 'true' : 'false') . ", Supplier: {$booking->supplier_code}, FlightID: {$booking->flight_id}");

            // Deduct from wallet
            $wallet->decrement('balance', $amount);

            // Create transaction record
            $wallet->transactions()->create([
                'amount' => $amount,
                'type' => 'debit',
                'description' => "Payment for booking #{$booking->pnr}",
                'reference' => $transactionId,
            ]);

            // Handle External Supplier Booking
            if ($booking->isExternal()) {
                $this->confirmExternalBooking($booking);
            }

            // Update booking
            $booking->update([
                'payment_status' => 'paid',
                'status' => 'confirmed',
            ]);
        });

        $wallet->refresh();

        return response()->json([
            'message' => 'Payment successful',
            'transaction_id' => $transactionId,
            'payment_method' => 'wallet',
            'amount_paid' => $amount,
            'new_balance' => round((float) $wallet->balance, 2),
            'booking' => $booking->fresh()->load(
                'passengers',
                'flight.airline',
                'flight.originAirport',
                'flight.destinationAirport'
            ),
        ]);
    }

    /**
     * Process card payment (simulated)
     */
    private function processCardPayment($user, Booking $booking, float $amount, string $method)
    {
        $transactionId = 'TXN_' . strtoupper(uniqid());

        // In a real application, this would integrate with Stripe/PayPal
        // For now, we simulate successful payment

        DB::transaction(function () use ($user, $booking, $amount, $transactionId) {
            // Handle External Supplier Booking
            if ($booking->isExternal()) {
                $this->confirmExternalBooking($booking);
            }

            // Update booking
            $booking->update([
                'payment_status' => 'paid',
                'status' => 'confirmed',
            ]);

            // Optionally create a wallet transaction record for tracking
            // (even for card payments, to have complete payment history)
            $wallet = $user->wallet()->firstOrCreate(
                ['user_id' => $user->id],
                ['balance' => 0]
            );

            $wallet->transactions()->create([
                'amount' => $amount,
                'type' => 'credit', // Using 'credit' to match DB check constraint
                'description' => "Card payment for booking #{$booking->pnr}",
                'reference' => $transactionId,
            ]);
        });

        return response()->json([
            'message' => 'Payment successful',
            'transaction_id' => $transactionId,
            'payment_method' => $method,
            'amount_paid' => $amount,
            'booking' => $booking->fresh()->load(
                'passengers',
                'flight.airline',
                'flight.originAirport',
                'flight.destinationAirport'
            ),
        ]);
    }

    /**
     * Confirm booking with external supplier.
     */
    private function confirmExternalBooking(Booking $booking)
    {
        try {
            $supplier = app(\App\Services\FlightSupplierManager::class)->driver($booking->supplier_code);

            // Re-fetch offer to verify availability and get current state
            $offer = $supplier->getOfferDetails($booking->external_offer_id);

            if (!$offer) {
                throw new \Exception('Flight offer is no longer available.');
            }

            // Basic price check (allow small variance for currency float issues)
            if (abs($offer->price->total - $booking->total_price) > 1.00) {
                // In a real app we might ask user to re-confirm new price
                throw new \Exception("Price has changed from {$booking->total_price} to {$offer->price->total}. Please re-book.");
            }

            $bookingResult = $supplier->book($offer, $booking->passengers->toArray());

            $booking->pnr = $bookingResult['pnr'];
            $booking->external_order_id = $bookingResult['order_id'];

        } catch (\Exception $e) {
            \Log::error("External booking confirmation failed: " . $e->getMessage());
            // Throwing exception here will rollback the DB transaction
            throw new \Exception('Supplier Booking Failed: ' . $e->getMessage());
        }
    }

    /**
     * Get payment status for a booking
     */
    public function status(Request $request, $bookingId)
    {
        $booking = Booking::findOrFail($bookingId);

        if ($booking->user_id !== $request->user()->id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        return response()->json([
            'booking_id' => $booking->id,
            'pnr' => $booking->pnr,
            'payment_status' => $booking->payment_status,
            'total_price' => $booking->total_price,
            'status' => $booking->status,
        ]);
    }
}

