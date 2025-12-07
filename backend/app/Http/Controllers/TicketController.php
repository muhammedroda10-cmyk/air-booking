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

        $booking->load(['passengers', 'user']);

        // Only load flight relations for non-external bookings
        $isExternal = $booking->isExternal();
        if (!$isExternal) {
            $booking->load([
                'flight.airline',
                'flight.originAirport',
                'flight.destinationAirport',
            ]);
        }

        // Build flight data based on booking type
        $flightData = $this->getFlightData($booking, $isExternal);

        return response()->json([
            'ticket' => [
                'pnr' => $booking->pnr,
                'status' => $booking->status,
                'payment_status' => $booking->payment_status,
                'total_price' => $booking->total_price,
                'currency' => $booking->currency,
                'created_at' => $booking->created_at,
                'is_external' => $isExternal,
                'passenger' => [
                    'name' => $booking->user->name,
                    'email' => $booking->user->email,
                ],
                'flight' => $flightData,
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
                'cancellation_policy' => $isExternal
                    ? 'Contact airline directly for cancellation policy.'
                    : ($booking->flight?->airline?->cancellation_policy ?? 'Standard cancellation policy applies.'),
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

        // Handle external bookings
        if ($booking->isExternal()) {
            return response()->json([
                'can_cancel' => true,
                'booking' => [
                    'pnr' => $booking->pnr,
                    'total_price' => $booking->total_price,
                ],
                'refund_details' => $refundDetails,
                'airline_policy' => 'Contact airline directly for cancellation policy.',
            ]);
        }

        return response()->json([
            'can_cancel' => true,
            'booking' => [
                'pnr' => $booking->pnr,
                'total_price' => $booking->total_price,
            ],
            'refund_details' => $refundDetails,
            'airline_policy' => $booking->flight?->airline?->cancellation_policy ?? 'Standard cancellation policy applies.',
        ]);
    }

    /**
     * Get flight data for ticket display
     */
    private function getFlightData(Booking $booking, bool $isExternal): array
    {
        if (!$isExternal && $booking->flight) {
            return [
                'number' => $booking->flight->flight_number,
                'airline' => $booking->flight->airline?->name ?? 'Unknown',
                'airline_code' => $booking->flight->airline?->code ?? '',
                'airline_logo' => $booking->flight->airline?->logo_url,
                'aircraft' => $booking->flight->aircraft_type,
                'departure' => [
                    'airport' => $booking->flight->originAirport?->code ?? '',
                    'city' => $booking->flight->originAirport?->city ?? '',
                    'country' => $booking->flight->originAirport?->country ?? '',
                    'time' => $booking->flight->departure_time,
                ],
                'arrival' => [
                    'airport' => $booking->flight->destinationAirport?->code ?? '',
                    'city' => $booking->flight->destinationAirport?->city ?? '',
                    'country' => $booking->flight->destinationAirport?->country ?? '',
                    'time' => $booking->flight->arrival_time,
                ],
            ];
        }

        // External booking - get data from external_booking_data
        // Note: BookingController stores this as: ['flight' => $offer->getSummary(), 'raw_offer' => $offer->toArray()]
        $extData = $booking->external_booking_data ?? [];

        // The flight data is nested under the 'flight' key
        $flightInfo = $extData['flight'] ?? $extData;

        // Debug: Log the raw external booking data to understand its structure
        \Log::info('External Booking Data for PDF', [
            'booking_id' => $booking->id,
            'pnr' => $booking->pnr,
            'external_booking_data_keys' => array_keys($extData),
            'flight_info' => $flightInfo,
        ]);

        return [
            'number' => $flightInfo['flight_number'] ?? $booking->pnr,
            'airline' => $flightInfo['airline'] ?? 'External Airline',
            'airline_code' => $flightInfo['airline_code'] ?? '',
            'airline_logo' => null,
            'aircraft' => $flightInfo['aircraft'] ?? null,
            'departure' => [
                'airport' => $flightInfo['origin'] ?? '',
                'city' => $flightInfo['origin_city'] ?? '',
                'airport_name' => $flightInfo['origin_airport'] ?? '',
                'terminal' => $flightInfo['departure_terminal'] ?? null,
                'country' => '',
                'time' => $flightInfo['departure_datetime'] ?? $flightInfo['departure_time'] ?? null,
            ],
            'arrival' => [
                'airport' => $flightInfo['destination'] ?? '',
                'city' => $flightInfo['destination_city'] ?? '',
                'airport_name' => $flightInfo['destination_airport'] ?? '',
                'terminal' => $flightInfo['arrival_terminal'] ?? null,
                'country' => '',
                'time' => $flightInfo['arrival_datetime'] ?? $flightInfo['arrival_time'] ?? null,
            ],
            'duration' => $flightInfo['duration'] ?? null,
            'cabin' => $flightInfo['cabin'] ?? 'Economy',
            'luggage' => $flightInfo['luggage'] ?? null,
            'booking_class' => $flightInfo['booking_class'] ?? null,
        ];
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

        // Release seats (only for non-external bookings with local flights)
        if (!$booking->isExternal() && $booking->flight) {
            foreach ($booking->passengers as $passenger) {
                if ($passenger->seat_number) {
                    $booking->flight->seats()
                        ->where('seat_number', $passenger->seat_number)
                        ->update(['is_booked' => false]);
                }
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
     * Download ticket as PDF
     */
    public function download(Booking $booking)
    {
        $user = request()->user();

        if ($booking->user_id !== $user->id && !$user->isAdmin()) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        if ($booking->payment_status !== 'paid') {
            return response()->json(['message' => 'Ticket not available. Payment required.'], 400);
        }

        $booking->load(['passengers', 'user']);

        $isExternal = $booking->isExternal();
        if (!$isExternal) {
            $booking->load([
                'flight.airline',
                'flight.originAirport',
                'flight.destinationAirport',
            ]);
        }

        $flightData = $this->getFlightData($booking, $isExternal);

        // Format dates for display
        $departureDate = 'TBD';
        $departureTime = 'TBD';
        $arrivalTime = 'TBD';

        // getFlightData returns 'departure' and 'arrival' keys
        if (!empty($flightData['departure']['time'])) {
            try {
                $dt = new \DateTime($flightData['departure']['time']);
                $departureDate = $dt->format('M d, Y');
                $departureTime = $dt->format('H:i');
            } catch (\Exception $e) {
                // Use raw time if parsing fails
                $departureTime = $flightData['departure']['time'] ?? 'TBD';
            }
        }

        if (!empty($flightData['arrival']['time'])) {
            try {
                $dt = new \DateTime($flightData['arrival']['time']);
                $arrivalTime = $dt->format('H:i');
            } catch (\Exception $e) {
                $arrivalTime = $flightData['arrival']['time'] ?? 'TBD';
            }
        }

        // Prepare data for PDF template
        $data = [
            'booking' => [
                'id' => $booking->id,
                'pnr' => $booking->pnr,
                'status' => $booking->status,
                'total_price' => $booking->total_price,
                'currency' => $booking->currency,
            ],
            'flight' => [
                'airline' => $flightData['airline'] ?? 'Airline',
                'airline_code' => $flightData['airline_code'] ?? 'XX',
                'flight_number' => $flightData['number'] ?? $booking->pnr,
                'aircraft' => $flightData['aircraft'] ?? null,
                'cabin' => $flightData['cabin'] ?? 'Economy',
                'luggage' => $flightData['luggage'] ?? null,
                'origin' => [
                    'airport' => $flightData['departure']['airport'] ?? 'DEP',
                    'city' => $flightData['departure']['city'] ?? '',
                    'airport_name' => $flightData['departure']['airport_name'] ?? '',
                    'terminal' => $flightData['departure']['terminal'] ?? null,
                ],
                'destination' => [
                    'airport' => $flightData['arrival']['airport'] ?? 'ARR',
                    'city' => $flightData['arrival']['city'] ?? '',
                    'airport_name' => $flightData['arrival']['airport_name'] ?? '',
                    'terminal' => $flightData['arrival']['terminal'] ?? null,
                ],
                'departure_date' => $departureDate,
                'departure_time' => $departureTime,
                'arrival_time' => $arrivalTime,
                'duration' => $flightData['duration'] ?? '--',
            ],
            'boarding_time' => $this->calculateBoardingTime($flightData['departure']['time'] ?? null),
            'passengers' => $booking->passengers->map(fn($p) => [
                'name' => $p->full_name ?? ($p->first_name . ' ' . $p->last_name),
                'first_name' => $p->first_name,
                'last_name' => $p->last_name,
                'seat' => $p->seat_number ?? 'TBA',
                'type' => $p->passenger_type ?? 'adult',
                'passport' => $p->passport_number ?? null,
                'ticket_number' => $p->ticket_number ?? null,
            ])->toArray(),
        ];

        // Debug: Log the data being sent to template
        \Log::info('PDF Ticket Data', [
            'isExternal' => $isExternal,
            'flightData' => $flightData,
            'pdfData' => $data,
        ]);

        // Render the Blade template to HTML
        $html = view('pdf.ticket', $data)->render();

        // Use Browsershot to convert HTML to PDF
        $filename = 'ticket-' . $booking->pnr . '.pdf';
        $tempPath = storage_path('app/temp/' . $filename);

        // Ensure temp directory exists
        if (!file_exists(storage_path('app/temp'))) {
            mkdir(storage_path('app/temp'), 0755, true);
        }

        try {
            \Spatie\Browsershot\Browsershot::html($html)
                ->setNodeBinary(config('browsershot.node_binary', 'node'))
                ->setNpmBinary(config('browsershot.npm_binary', 'npm'))
                ->format('A4')
                ->margins(0, 0, 0, 0)
                ->showBackground()
                ->waitUntilNetworkIdle()
                ->save($tempPath);

            return response()->download($tempPath, $filename, [
                'Content-Type' => 'application/pdf',
                'Cache-Control' => 'no-store, no-cache, must-revalidate',
                'Pragma' => 'no-cache',
            ])->deleteFileAfterSend(true);
        } catch (\Exception $e) {
            // Fallback to DomPDF if Browsershot fails
            \Log::error('Browsershot failed, falling back to DomPDF: ' . $e->getMessage());

            $pdf = \Barryvdh\DomPDF\Facade\Pdf::loadView('pdf.ticket', $data);
            $pdf->setPaper('a4', 'portrait');
            return $pdf->download($filename)->header('Cache-Control', 'no-store, no-cache, must-revalidate');
        }
    }

    /**
     * Calculate boarding time (45 minutes before departure)
     */
    private function calculateBoardingTime(?string $departureTime): string
    {
        if (!$departureTime) {
            return 'TBD';
        }

        try {
            $dt = new \DateTime($departureTime);
            $dt->modify('-45 minutes');
            return $dt->format('h:i A');
        } catch (\Exception $e) {
            return 'TBD';
        }
    }
}
