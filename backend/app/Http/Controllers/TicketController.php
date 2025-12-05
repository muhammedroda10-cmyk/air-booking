<?php

namespace App\Http\Controllers;

use App\Models\Booking;
use App\Models\Notification;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class TicketController extends Controller
{
    /**
     * Get ticket details for a booking
     */
    public function show(Booking $booking): JsonResponse
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
                'currency' => $booking->currency,
                'created_at' => $booking->created_at,
                'passenger' => [
                    'name' => $booking->user->name,
                    'email' => $booking->user->email,
                ],
                'flight' => [
                    'number' => $booking->flight->flight_number,
                    'airline' => $booking->flight->airline->name,
                    'airline_code' => $booking->flight->airline->code,
                    'airline_logo' => $booking->flight->airline->logo_url,
                    'aircraft' => $booking->flight->aircraft_type,
                    'departure' => [
                        'airport' => $booking->flight->originAirport->code,
                        'city' => $booking->flight->originAirport->city,
                        'country' => $booking->flight->originAirport->country,
                        'time' => $booking->flight->departure_time,
                    ],
                    'arrival' => [
                        'airport' => $booking->flight->destinationAirport->code,
                        'city' => $booking->flight->destinationAirport->city,
                        'country' => $booking->flight->destinationAirport->country,
                        'time' => $booking->flight->arrival_time,
                    ],
                ],
                'passengers' => $booking->passengers->map(function ($p) {
                    return [
                        'name' => $p->full_name,
                        'first_name' => $p->first_name,
                        'last_name' => $p->last_name,
                        'seat' => $p->seat_number,
                        'passport' => $p->passport_number,
                        'passenger_type' => $p->passenger_type,
                        'meal_preference' => $p->meal_preference,
                        'special_requests' => $p->special_requests,
                        'ticket_number' => $p->ticket_number,
                    ];
                }),
                'cancellation_policy' => $booking->flight->airline->cancellation_policy,
                'can_cancel' => $booking->canBeCancelled(),
            ]
        ]);
    }

    /**
     * Preview cancellation (show refund details before confirming)
     */
    public function previewCancellation(Booking $booking): JsonResponse
    {
        $user = request()->user();

        if ($booking->user_id !== $user->id && !$user->isAdmin()) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        if (!$booking->canBeCancelled()) {
            return response()->json([
                'can_cancel' => false,
                'message' => 'This booking cannot be cancelled',
            ], 400);
        }

        $refundDetails = $booking->calculateRefund();

        return response()->json([
            'can_cancel' => true,
            'booking' => [
                'pnr' => $booking->pnr,
                'total_price' => $booking->total_price,
            ],
            'refund_details' => $refundDetails,
            'airline_policy' => $booking->flight->airline->cancellation_policy,
        ]);
    }

    /**
     * Cancel a booking with refund based on airline policy
     */
    public function cancel(Request $request, Booking $booking): JsonResponse
    {
        $user = request()->user();

        if ($booking->user_id !== $user->id && !$user->isAdmin()) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        if ($booking->status === 'cancelled') {
            return response()->json(['message' => 'Booking is already cancelled'], 422);
        }

        if (!$booking->canBeCancelled()) {
            return response()->json(['message' => 'This booking cannot be cancelled'], 422);
        }

        $reason = $request->input('reason', 'Cancelled by user');
        
        // Calculate refund based on airline policy
        $refundDetails = $booking->calculateRefund();
        $refundAmount = $refundDetails['refund_amount'];

        // Release seats
        foreach ($booking->passengers as $passenger) {
            if ($passenger->seat_number) {
                $booking->flight->seats()
                    ->where('seat_number', $passenger->seat_number)
                    ->update(['is_booked' => false]);
            }
        }

        // Update booking
        $booking->update([
            'status' => 'cancelled',
            'cancelled_at' => now(),
            'cancellation_reason' => $reason,
            'refund_amount' => $refundAmount,
        ]);

        // Process refund to wallet if payment was made
        if ($booking->payment_status === 'paid' && $refundAmount > 0) {
            $wallet = $user->wallet;
            if ($wallet) {
                $wallet->increment('balance', $refundAmount);
                $wallet->transactions()->create([
                    'amount' => $refundAmount,
                    'type' => 'credit',
                    'description' => "Refund for cancelled booking {$booking->pnr} ({$refundDetails['refund_percentage']}% refund)",
                ]);
            }
            $booking->update(['payment_status' => 'refunded']);

            // Send notification
            NotificationController::notifyRefundProcessed($user->id, [
                'booking_id' => $booking->id,
                'pnr' => $booking->pnr,
                'amount' => $refundAmount,
            ]);
        }

        // Send cancellation notification
        NotificationController::notifyBookingCancelled($user->id, [
            'booking_id' => $booking->id,
            'pnr' => $booking->pnr,
            'refund_amount' => $refundAmount,
        ]);

        return response()->json([
            'message' => 'Booking cancelled successfully',
            'refund_details' => $refundDetails,
            'booking' => $booking->fresh()
        ]);
    }

    /**
     * Download ticket as PDF (placeholder - returns JSON structure for now)
     */
    public function download(Booking $booking): JsonResponse
    {
        $user = request()->user();

        if ($booking->user_id !== $user->id && !$user->isAdmin()) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        if ($booking->payment_status !== 'paid') {
            return response()->json(['message' => 'Ticket not available. Payment required.'], 400);
        }

        $booking->load([
            'flight.airline',
            'flight.originAirport',
            'flight.destinationAirport',
            'passengers',
            'user'
        ]);

        // In a real implementation, this would generate a PDF
        // For now, return structured data for frontend to render
        return response()->json([
            'ticket_data' => [
                'booking_reference' => $booking->pnr,
                'issue_date' => $booking->created_at->format('Y-m-d H:i'),
                'passenger_name' => $booking->user->name,
                'flight' => [
                    'number' => $booking->flight->flight_number,
                    'airline' => $booking->flight->airline->name,
                    'airline_code' => $booking->flight->airline->code,
                    'departure_date' => $booking->flight->departure_time,
                    'origin' => $booking->flight->originAirport->code . ' - ' . $booking->flight->originAirport->city,
                    'destination' => $booking->flight->destinationAirport->code . ' - ' . $booking->flight->destinationAirport->city,
                ],
                'passengers' => $booking->passengers->map(fn($p) => [
                    'name' => $p->full_name,
                    'seat' => $p->seat_number ?? 'Not assigned',
                    'ticket_number' => $p->ticket_number,
                    'type' => $p->passenger_type,
                ]),
                'total_amount' => $booking->total_price,
                'currency' => $booking->currency,
                'barcode' => $booking->pnr, // Simplified - would be a proper barcode
            ]
        ]);
    }
}
