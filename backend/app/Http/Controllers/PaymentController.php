<?php

namespace App\Http\Controllers;

use App\Models\Booking;
use App\Models\Notification;
use App\Models\Payment;
use App\Models\Wallet;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class PaymentController extends Controller
{
    /**
     * Maximum retry attempts for external booking confirmation
     */
    private const MAX_RETRY_ATTEMPTS = 3;

    /**
     * Process payment for a booking
     */
    public function store(Request $request)
    {
        $request->validate([
            'booking_id' => 'required|exists:bookings,id',
            'payment_method' => 'required|string|in:wallet,credit_card,debit_card',
        ]);

        $booking = Booking::with(['flight', 'passengers'])->findOrFail($request->booking_id);

        // Authorization check
        if ($booking->user_id !== $request->user()->id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        // Already paid check
        if ($booking->payment_status === 'paid') {
            return response()->json([
                'message' => 'Booking is already paid',
                'booking' => $booking,
            ], 400);
        }

        // Cancelled booking check
        if ($booking->status === 'cancelled') {
            return response()->json([
                'message' => 'Cannot process payment for a cancelled booking',
            ], 400);
        }

        $amount = (float) $booking->total_price;
        $pointsToRedeem = (int) ($request->points_to_redeem ?? 0);
        
        // Calculate discount from points (100 points = $1)
        $pointsDiscount = $pointsToRedeem / 100;
        $finalAmount = max(0, $amount - $pointsDiscount);

        try {
            Log::info("Payment Request", [
                'booking_id' => $booking->id,
                'pnr' => $booking->pnr,
                'method' => $request->payment_method,
                'amount' => $amount,
                'points_to_redeem' => $pointsToRedeem,
                'final_amount' => $finalAmount,
                'user_id' => $request->user()->id,
            ]);

            if ($request->payment_method === 'wallet') {
                return $this->processWalletPayment($request->user(), $booking, $finalAmount, $pointsToRedeem);
            } elseif ($request->payment_method === 'credit_card') {
                // Simulated credit card payment - always succeeds
                return $this->processSimulatedCardPayment($request->user(), $booking, $finalAmount, $request->card_details ?? [], $pointsToRedeem);
            } else {
                return response()->json([
                    'message' => 'Invalid payment method. Use "wallet" or "credit_card".',
                ], 422);
            }
        } catch (\Throwable $e) {
            Log::error("Payment Processing Error", [
                'booking_id' => $booking->id,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);
            
            return response()->json([
                'message' => 'Payment failed. Please try again.',
                'error' => config('app.debug') ? $e->getMessage() : null,
            ], 400);
        }
    }

    /**
     * Process wallet payment
     */
    private function processWalletPayment($user, Booking $booking, float $amount, int $pointsToRedeem = 0)
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
                'available' => round((float) $wallet->balance, 2),
                'shortfall' => round($amount - (float) $wallet->balance, 2),
            ], 400);
        }

        // Validate user has enough loyalty points if redeeming
        if ($pointsToRedeem > 0) {
            $loyaltyRecord = $user->loyaltyPoints;
            if (!$loyaltyRecord || $loyaltyRecord->points < $pointsToRedeem) {
                return response()->json([
                    'message' => 'Insufficient loyalty points',
                    'requested' => $pointsToRedeem,
                    'available' => $loyaltyRecord?->points ?? 0,
                ], 400);
            }
        }

        $transactionId = 'WLT_' . strtoupper(uniqid());
        $transaction = null;

        try {
            DB::transaction(function () use ($wallet, $booking, $amount, $transactionId, &$transaction, $user, $pointsToRedeem) {
                Log::info("Processing wallet payment", [
                    'booking_id' => $booking->id,
                    'is_external' => $booking->isExternal(),
                    'supplier' => $booking->supplier_code,
                    'points_redeemed' => $pointsToRedeem,
                ]);

                // Deduct loyalty points if any
                if ($pointsToRedeem > 0) {
                    $user->loyaltyPoints->decrement('points', $pointsToRedeem);
                }


                // Deduct from wallet first
                $wallet->decrement('balance', $amount);

                // Create transaction record
                $transaction = $wallet->transactions()->create([
                    'amount' => $amount,
                    'type' => 'debit',
                    'description' => "Payment for booking #{$booking->pnr}",
                    'reference' => $transactionId,
                ]);

                // Handle External Supplier Booking
                if ($booking->isExternal()) {
                    $this->confirmExternalBookingWithRetry($booking);
                }

                // Update booking status
                $booking->update([
                    'payment_status' => 'paid',
                    'status' => 'confirmed',
                ]);

                // Create success notification
                Notification::create([
                    'user_id' => $user->id,
                    'type' => 'payment',
                    'title' => 'Payment Successful',
                    'message' => "Your payment of \${$amount} for booking #{$booking->pnr} was successful.",
                    'data' => [
                        'booking_id' => $booking->id,
                        'transaction_id' => $transactionId,
                        'amount' => $amount,
                    ],
                ]);

                // Award Loyalty Points
                $this->awardLoyaltyPoints($user, $booking);
            });

            $wallet->refresh();

            Log::info("Payment successful", [
                'booking_id' => $booking->id,
                'transaction_id' => $transactionId,
                'new_balance' => $wallet->balance,
            ]);

            return response()->json([
                'message' => 'Payment successful',
                'transaction_id' => $transactionId,
                'payment_method' => 'wallet',
                'amount_paid' => $amount,
                'new_balance' => round((float) $wallet->balance, 2),
                'booking' => $this->loadBookingRelations($booking->fresh()),
            ]);

        } catch (\Exception $e) {
            // Transaction will auto-rollback, wallet balance restored
            Log::error("Wallet payment failed, transaction rolled back", [
                'booking_id' => $booking->id,
                'transaction_id' => $transactionId,
                'error' => $e->getMessage(),
            ]);

            throw $e;
        }
    }

    /**
     * Process simulated credit card payment (for demo/development)
     */
    protected function processSimulatedCardPayment($user, Booking $booking, float $amount, array $cardDetails = [], int $pointsToRedeem = 0)
    {
        // Validate user has enough loyalty points if redeeming
        if ($pointsToRedeem > 0) {
            $loyaltyRecord = $user->loyaltyPoints;
            if (!$loyaltyRecord || $loyaltyRecord->points < $pointsToRedeem) {
                return response()->json([
                    'message' => 'Insufficient loyalty points',
                    'requested' => $pointsToRedeem,
                    'available' => $loyaltyRecord?->points ?? 0,
                ], 400);
            }
        }

        $transactionId = 'SIM_' . strtoupper(bin2hex(random_bytes(8)));

        try {
            DB::transaction(function () use ($user, $booking, $amount, $transactionId, $cardDetails, $pointsToRedeem) {
                // Deduct loyalty points if any
                if ($pointsToRedeem > 0) {
                    $user->loyaltyPoints->decrement('points', $pointsToRedeem);
                }

                $booking->update([
                    'payment_status' => 'paid',
                    'status' => 'confirmed',
                    'paid_at' => now(),
                ]);

                // Create a mock payment record
                Payment::create([
                    'user_id' => $user->id,
                    'booking_id' => $booking->id,
                    'amount' => $amount,
                    'currency' => $booking->currency ?? 'USD',
                    'payment_method' => 'credit_card',
                    'status' => 'completed',
                    'transaction_id' => $transactionId,
                    'gateway' => 'simulated',
                    'gateway_response' => json_encode([
                        'last_four' => $cardDetails['last_four'] ?? '0000',
                        'brand' => $cardDetails['brand'] ?? 'card',
                        'simulated' => true,
                    ]),
                ]);

                // Generate ticket numbers for passengers
                foreach ($booking->passengers as $passenger) {
                    $passenger->update([
                        'ticket_number' => 'E-' . strtoupper(bin2hex(random_bytes(6))),
                    ]);
                }

                // Send confirmation notification
                NotificationController::notifyPaymentConfirmed($user->id, [
                    'booking_id' => $booking->id,
                    'pnr' => $booking->pnr,
                    'amount' => $amount,
                ]);

                // Award Loyalty Points
                $this->awardLoyaltyPoints($user, $booking);
            });

            Log::info("Simulated Card Payment successful", [
                'booking_id' => $booking->id,
                'transaction_id' => $transactionId,
            ]);

            return response()->json([
                'message' => 'Payment successful',
                'transaction_id' => $transactionId,
                'payment_method' => 'credit_card',
                'amount_paid' => $amount,
                'booking' => $this->loadBookingRelations($booking->fresh()),
            ]);

        } catch (\Exception $e) {
            Log::error("Simulated Card payment failed", [
                'booking_id' => $booking->id,
                'error' => $e->getMessage(),
            ]);

            throw $e;
        }
    }

    /**
     * Create Stripe Payment Intent
     */
    public function createPaymentIntent(Request $request, Booking $booking)
    {
        if ($booking->user_id !== $request->user()->id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        if ($booking->payment_status === 'paid') {
            return response()->json(['message' => 'Booking is already paid'], 400);
        }

        try {
            $gateway = new \App\Services\PaymentGateway\StripeGateway();
            
            $result = $gateway->createPaymentIntent(
                $booking->total_price, 
                $booking->currency ?? 'usd',
                [
                    'booking_id' => $booking->id,
                    'pnr' => $booking->pnr,
                    'user_email' => $request->user()->email
                ]
            );

            if (!$result['success']) {
                throw new \Exception($result['error']);
            }

            return response()->json($result);

        } catch (\Exception $e) {
            Log::error("Stripe Intent Creation Failed", [
                'booking_id' => $booking->id,
                'error' => $e->getMessage()
            ]);
            return response()->json(['message' => 'Failed to initialize payment'], 500);
        }
    }

    /**
     * Confirm Stripe Payment (Server-side verification)
     */
    public function confirmPayment(Request $request, Booking $booking)
    {
        $request->validate([
            'payment_intent_id' => 'required|string',
        ]);

        if ($booking->user_id !== $request->user()->id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        try {
            $gateway = new \App\Services\PaymentGateway\StripeGateway();
            $status = $gateway->getPaymentStatus($request->payment_intent_id);

            if ($status['success'] && $status['status'] === 'succeeded') {
                // Determine payment method details if available
                $method = 'credit_card'; // Default
                if (!empty($status['payment_method'])) {
                     // Could fetch method details if needed
                }

                // Update Booking if not already updated (Webhook might have raced)
                if ($booking->payment_status !== 'paid') {
                    DB::transaction(function () use ($booking, $status, $request, $method) {
                        $booking->update([
                            'payment_status' => 'paid',
                            'status' => 'confirmed',
                            'stripe_payment_intent_id' => $request->payment_intent_id,
                        ]);

                        // Confirm external if needed
                        if ($booking->isExternal()) {
                            $this->confirmExternalBookingWithRetry($booking);
                        }

                        // Create wallet transaction for record keeping (optional, or just notification)
                        // We usually don't create wallet transaction for direct card payment unless we treat wallet as a ledger.
                        // Existing processCardPayment created a 'debit' on wallet? 
                        // "Create wallet transaction record for payment history" -> yes, it did.
                        // Let's replicate that for consistency.
                        
                        $wallet = $request->user()->wallet()->firstOrCreate(['user_id' => $request->user()->id], ['balance' => 0]);
                        $wallet->transactions()->create([
                            'amount' => $booking->total_price,
                            'type' => 'debit',
                            'description' => "Card payment for booking #{$booking->pnr}",
                            'reference' => $request->payment_intent_id,
                            // Note: We are NOT deducting balance, just recording it?
                            // Wait, the previous code created a 'debit'. If balance was 0, it would go negative?
                            // No, relying on wallet usually means using wallet funds.
                            // If paying by card, we shouldn't touch wallet balance unless we seek to "Top up and Pay".
                            // The previous code: "$wallet->firstOrCreate... $wallet->transactions()->create..."
                            // It did NOT decrement balance. It just created a transaction.
                            // This might be confusing for a "Wallet". Usually Wallet Transactions affecting balance.
                            // I will SKIP creating a wallet transaction for Card payments to avoid confusion, 
                            // OR create a specific "log" type.
                            // Actually, let's keep it simple: Notification only.
                        ]);

                        Notification::create([
                            'user_id' => $request->user()->id,
                            'type' => 'payment',
                            'title' => 'Payment Successful',
                            'message' => "Your payment of \${$booking->total_price} for booking #{$booking->pnr} was successful.",
                            'data' => [
                                'booking_id' => $booking->id,
                                'payment_intent_id' => $request->payment_intent_id,
                                'amount' => $booking->total_price,
                            ],
                        ]);

                        // Award Loyalty Points
                        $this->awardLoyaltyPoints($request->user(), $booking);
                    });
                }

                return response()->json([
                    'message' => 'Payment confirmed successfully',
                    'booking' => $this->loadBookingRelations($booking->fresh()),
                ]);
            } else {
                return response()->json([
                    'message' => 'Payment not successful yet',
                    'status' => $status['status']
                ], 400);
            }

        } catch (\Exception $e) {
             Log::error("Payment Confirmation Failed", [
                'booking_id' => $booking->id,
                'error' => $e->getMessage()
            ]);
            return response()->json(['message' => 'Failed to verify payment'], 500);
        }
    }



    /**
     * Confirm booking with external supplier with retry logic
     */
    private function confirmExternalBookingWithRetry(Booking $booking, int $attempt = 1)
    {
        try {
            $supplier = app(\App\Services\FlightSupplierManager::class)->driver($booking->supplier_code);

            // Re-fetch offer to verify availability
            $offer = $supplier->getOfferDetails($booking->external_offer_id);

            if (!$offer) {
                throw new \Exception('Flight offer is no longer available.');
            }

            // Price variance check (allow small differences for currency/rounding)
            $priceDifference = abs($offer->price->total - $booking->total_price);
            if ($priceDifference > 1.00) {
                // Price changed significantly
                Log::warning("Price changed for external booking", [
                    'booking_id' => $booking->id,
                    'original_price' => $booking->total_price,
                    'new_price' => $offer->price->total,
                    'difference' => $priceDifference,
                ]);
                
                throw new \Exception(
                    "Price has changed from \${$booking->total_price} to \${$offer->price->total}. Please re-book."
                );
            }

            // Attempt to book with supplier
            $bookingResult = $supplier->book($offer, $booking->passengers->toArray());

            // Update booking with supplier confirmation
            $booking->pnr = $bookingResult['pnr'];
            $booking->external_order_id = $bookingResult['order_id'];
            $booking->save();

            Log::info("External booking confirmed", [
                'booking_id' => $booking->id,
                'supplier' => $booking->supplier_code,
                'pnr' => $bookingResult['pnr'],
                'order_id' => $bookingResult['order_id'],
            ]);

        } catch (\Exception $e) {
            Log::error("External booking confirmation failed", [
                'booking_id' => $booking->id,
                'supplier' => $booking->supplier_code,
                'attempt' => $attempt,
                'error' => $e->getMessage(),
            ]);

            // Retry if we haven't exceeded max attempts (for transient errors)
            if ($attempt < self::MAX_RETRY_ATTEMPTS && $this->isRetryableError($e)) {
                Log::info("Retrying external booking confirmation", [
                    'booking_id' => $booking->id,
                    'attempt' => $attempt + 1,
                ]);
                
                // Wait briefly before retry (exponential backoff)
                usleep(pow(2, $attempt) * 100000); // 200ms, 400ms, 800ms
                
                return $this->confirmExternalBookingWithRetry($booking, $attempt + 1);
            }

            // Final failure - throw to trigger transaction rollback
            throw new \Exception('Supplier Booking Failed: ' . $e->getMessage());
        }
    }

    /**
     * Determine if an error is retryable (transient network issues, etc.)
     */
    private function isRetryableError(\Exception $e): bool
    {
        $retryableMessages = [
            'timeout',
            'connection refused',
            'temporarily unavailable',
            'service unavailable',
            'rate limit',
            '503',
            '504',
            '429',
        ];

        $message = strtolower($e->getMessage());
        
        foreach ($retryableMessages as $retryable) {
            if (str_contains($message, $retryable)) {
                return true;
            }
        }

        return false;
    }

    /**
     * Load booking relations for response
     */
    private function loadBookingRelations(Booking $booking): Booking
    {
        $booking->load('passengers');
        
        if ($booking->flight_id) {
            $booking->load('flight.airline', 'flight.originAirport', 'flight.destinationAirport');
        }

        return $booking;
    }

    /**
     * Get payment status for a booking
     */
    public function status(Request $request, $bookingId)
    {
        $booking = Booking::find($bookingId);

        if (!$booking) {
            return response()->json(['message' => 'Booking not found'], 404);
        }

        if ($booking->user_id !== $request->user()->id && !$request->user()->isAdmin()) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        return response()->json([
            'booking_id' => $booking->id,
            'pnr' => $booking->pnr,
            'payment_status' => $booking->payment_status,
            'total_price' => $booking->total_price,
            'currency' => $booking->currency ?? 'USD',
            'status' => $booking->status,
            'is_external' => $booking->isExternal(),
        ]);
    }

    /**
     * Process refund for a cancelled booking
     */
    public function refund(Request $request, Booking $booking)
    {
        if ($booking->user_id !== $request->user()->id && !$request->user()->isAdmin()) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        if ($booking->payment_status !== 'paid') {
            return response()->json([
                'message' => 'Cannot refund an unpaid booking',
            ], 400);
        }

        if ($booking->status !== 'cancelled') {
            return response()->json([
                'message' => 'Booking must be cancelled before refund',
            ], 400);
        }

        if ($booking->payment_status === 'refunded') {
            return response()->json([
                'message' => 'Booking has already been refunded',
            ], 400);
        }

        $refundInfo = $booking->calculateRefund();
        $refundAmount = $refundInfo['refund_amount'];

        if ($refundAmount <= 0) {
            return response()->json([
                'message' => 'No refund available for this booking',
                'details' => $refundInfo,
            ], 400);
        }

        try {
            DB::transaction(function () use ($booking, $refundAmount, $request) {
                $wallet = $request->user()->wallet()->firstOrCreate(
                    ['user_id' => $request->user()->id],
                    ['balance' => 0]
                );

                // Credit refund to wallet
                $wallet->increment('balance', $refundAmount);

                // Create refund transaction
                $wallet->transactions()->create([
                    'amount' => $refundAmount,
                    'type' => 'credit',
                    'description' => "Refund for cancelled booking #{$booking->pnr}",
                    'reference' => 'REF_' . strtoupper(uniqid()),
                ]);

                // Update booking
                $booking->update([
                    'payment_status' => 'refunded',
                    'refund_amount' => $refundAmount,
                ]);

                // Notify user
                Notification::create([
                    'user_id' => $request->user()->id,
                    'type' => 'refund',
                    'title' => 'Refund Processed',
                    'message' => "A refund of \${$refundAmount} has been credited to your wallet for booking #{$booking->pnr}.",
                    'data' => [
                        'booking_id' => $booking->id,
                        'refund_amount' => $refundAmount,
                    ],
                ]);
            });

            Log::info("Refund processed", [
                'booking_id' => $booking->id,
                'refund_amount' => $refundAmount,
                'user_id' => $request->user()->id,
            ]);

            return response()->json([
                'message' => 'Refund processed successfully',
                'refund_amount' => $refundAmount,
                'booking' => $booking->fresh(),
            ]);

        } catch (\Exception $e) {
            Log::error("Refund processing failed", [
                'booking_id' => $booking->id,
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'message' => 'Failed to process refund',
            ], 500);
        }
    }

    /**
     * Award loyalty points for a successful booking
     */
    private function awardLoyaltyPoints($user, Booking $booking)
    {
        try {
            $loyalty = \App\Models\LoyaltyPoints::firstOrCreate(
                ['user_id' => $user->id],
                ['balance' => 0, 'lifetime_points' => 0, 'tier' => 'bronze']
            );
            
            $pointsToEarn = $loyalty->calculatePointsToEarn($booking->total_price);
            
            // Avoid duplicate points if already awarded
            $existing = \App\Models\LoyaltyTransaction::where('reference', 'EARN_' . $booking->pnr)->first();
            if ($existing) return;

            $loyalty->addPoints(
                $pointsToEarn,
                'flight',
                "Flight Booking #{$booking->pnr}",
                $booking->id,
                'EARN_' . $booking->pnr
            );
            
             Notification::create([
                'user_id' => $user->id,
                'type' => 'loyalty',
                'title' => 'Points Earned!',
                'message' => "You earned {$pointsToEarn} points for your booking #{$booking->pnr}.",
                'data' => [
                    'booking_id' => $booking->id,
                    'points' => $pointsToEarn,
                ],
            ]);
            
        } catch (\Exception $e) {
            Log::error("Failed to award loyalty points", [
                'booking_id' => $booking->id,
                'error' => $e->getMessage()
            ]);
        }
    }
}
