<?php

namespace App\Http\Controllers;

use App\Models\Booking;
use App\Models\Wallet;
use App\Models\Transaction;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class AdminBookingController extends Controller
{
    public function index(Request $request)
    {
        $query = Booking::with(['user', 'flight.airline', 'flight.originAirport', 'flight.destinationAirport']);

        if ($request->has('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('pnr', 'like', "%{$search}%")
                  ->orWhereHas('user', function ($q) use ($search) {
                      $q->where('name', 'like', "%{$search}%")
                        ->orWhere('email', 'like', "%{$search}%");
                  });
            });
        }

        if ($request->has('status') && $request->status !== 'all') {
            $query->where('status', $request->status);
        }

        if ($request->has('payment_status') && $request->payment_status !== 'all') {
            $query->where('payment_status', $request->payment_status);
        }

        if ($request->has('start_date')) {
            $query->whereDate('created_at', '>=', $request->start_date);
        }

        if ($request->has('end_date')) {
            $query->whereDate('created_at', '<=', $request->end_date);
        }

        $bookings = $query->latest()->paginate(20);

        return response()->json([
            'bookings' => $bookings->items(),
            'total' => $bookings->total(),
            'current_page' => $bookings->currentPage(),
            'last_page' => $bookings->lastPage(),
        ]);
    }

    public function show(Booking $booking)
    {
        $booking->load(['user', 'flight.airline', 'flight.originAirport', 'flight.destinationAirport', 'passengers']);
        return response()->json(['booking' => $booking]);
    }

    public function refund(Request $request, Booking $booking)
    {
        $request->validate([
            'refund_amount' => 'required|numeric|min:0.01',
            'penalty_amount' => 'nullable|numeric|min:0',
            'reason' => 'required|string|max:500',
        ]);

        $requestedRefund = (float) $request->refund_amount;
        $penaltyAmount = (float) ($request->penalty_amount ?? 0);
        $maxRefundable = (float) $booking->total_price - (float) ($booking->refund_amount ?? 0);

        if ($requestedRefund > $maxRefundable) {
            return response()->json([
                'message' => 'Refund amount exceeds maximum refundable amount',
                'max_refundable' => $maxRefundable,
            ], 422);
        }

        if ($penaltyAmount > $requestedRefund) {
            return response()->json([
                'message' => 'Penalty cannot exceed refund amount',
            ], 422);
        }

        // Actual amount credited to wallet = requested refund - penalty
        $actualWalletCredit = $requestedRefund - $penaltyAmount;

        DB::beginTransaction();
        try {
            // Update booking - refund_amount tracks total claimed from booking
            $newTotalRefund = (float) ($booking->refund_amount ?? 0) + $requestedRefund;
            $newTotalPenalty = (float) ($booking->penalty_amount ?? 0) + $penaltyAmount;
            
            // Status logic: only "refunded" if full amount claimed AND no penalties
            $isFullyRefunded = $newTotalRefund >= (float) $booking->total_price && $newTotalPenalty == 0;
            
            $booking->update([
                'refund_amount' => $newTotalRefund,
                'penalty_amount' => $newTotalPenalty,
                'refund_reason' => $request->reason,
                'payment_status' => $isFullyRefunded ? 'refunded' : 'partial_refund',
            ]);

            // Credit user wallet with actual amount (after penalty deduction)
            $wallet = Wallet::firstOrCreate(
                ['user_id' => $booking->user_id],
                ['balance' => 0, 'currency' => 'USD']
            );

            $wallet->increment('balance', $actualWalletCredit);

            // Record transaction
            $description = "Refund for booking #{$booking->pnr}";
            if ($penaltyAmount > 0) {
                $description .= " (penalty: \${$penaltyAmount})";
            }
            
            Transaction::create([
                'wallet_id' => $wallet->id,
                'type' => 'credit',
                'amount' => $actualWalletCredit,
                'description' => $description,
                'reference' => "booking_refund_{$booking->id}",
            ]);

            DB::commit();

            return response()->json([
                'message' => 'Refund processed successfully',
                'booking' => $booking->fresh(),
                'requested_refund' => $requestedRefund,
                'penalty_amount' => $penaltyAmount,
                'actual_wallet_credit' => $actualWalletCredit,
                'new_wallet_balance' => $wallet->balance,
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'message' => 'Failed to process refund: ' . $e->getMessage(),
            ], 500);
        }
    }

    public function cancel(Request $request, Booking $booking)
    {
        $request->validate([
            'reason' => 'nullable|string|max:500',
        ]);

        if ($booking->status === 'cancelled') {
            return response()->json(['message' => 'Booking is already cancelled'], 422);
        }

        $booking->update([
            'status' => 'cancelled',
            'cancellation_reason' => $request->reason ?? 'Cancelled by admin',
        ]);

        return response()->json([
            'message' => 'Booking cancelled successfully',
            'booking' => $booking,
        ]);
    }

    /**
     * Get live bookings for today (real-time feed)
     */
    public function liveIndex(Request $request)
    {
        $today = now()->startOfDay();

        $bookings = Booking::with(['user', 'flight.airline'])
            ->whereDate('created_at', '>=', $today)
            ->orderBy('created_at', 'desc')
            ->take(50)
            ->get();

        // Calculate stats
        $stats = [
            'total' => $bookings->count(),
            'pending' => $bookings->where('status', 'pending')->count(),
            'confirmed' => $bookings->where('status', 'confirmed')->count(),
            'onHold' => $bookings->where('status', 'on_hold')->count(),
            'todayRevenue' => $bookings->where('payment_status', 'paid')->sum('total_price'),
        ];

        return response()->json([
            'bookings' => $bookings,
            'stats' => $stats,
        ]);
    }

    /**
     * Revalidate an on-hold booking status
     */
    public function revalidate(Request $request, Booking $booking)
    {
        // Only on-hold bookings can be revalidated
        if ($booking->status !== 'on_hold') {
            return response()->json([
                'message' => 'Only on-hold bookings can be revalidated',
                'status' => $booking->status,
            ], 422);
        }

        $oldStatus = $booking->status;

        // Check with supplier if booking is issued
        // This would typically call the external API to check the PNR status
        // For now, we'll simulate by checking if payment is complete
        if ($booking->payment_status === 'paid') {
            // Mark as confirmed since payment is complete
            $booking->update(['status' => 'confirmed']);
        } else {
            // Check elapsed time - if on hold for too long, might need attention
            $hoursOnHold = now()->diffInHours($booking->updated_at);
            if ($hoursOnHold > 24) {
                // Add a note that this booking needs attention
                $booking->update([
                    'notes' => ($booking->notes ?? '') . "\n[Auto] On hold for {$hoursOnHold} hours - may need manual review",
                ]);
            }
        }

        return response()->json([
            'message' => $oldStatus !== $booking->status ? 'Booking status updated' : 'No status change',
            'old_status' => $oldStatus,
            'status' => $booking->fresh()->status,
            'booking' => $booking->fresh(['user', 'flight']),
        ]);
    }
}
