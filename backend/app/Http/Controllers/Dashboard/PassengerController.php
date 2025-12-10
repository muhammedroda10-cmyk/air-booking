<?php

namespace App\Http\Controllers\Dashboard;

use App\Http\Controllers\Controller;
use App\Models\Passenger;
use App\Models\Booking;
use App\Models\Notification;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class PassengerController extends Controller
{
    /**
     * List passengers for a booking (staff view)
     */
    public function index(Request $request, Booking $booking)
    {
        $user = $request->user();

        if (!$user->hasPermission('passengers.view')) {
            return response()->json(['message' => 'Access denied'], 403);
        }

        $passengers = $booking->passengers()->get();

        return response()->json([
            'booking' => [
                'id' => $booking->id,
                'pnr' => $booking->pnr,
                'status' => $booking->status,
            ],
            'passengers' => $passengers,
        ]);
    }

    /**
     * Update passenger details (corrections)
     */
    public function update(Request $request, Passenger $passenger)
    {
        $user = $request->user();

        if (!$user->hasPermission('passengers.edit')) {
            return response()->json(['message' => 'Access denied'], 403);
        }

        $request->validate([
            'reason' => 'required|string|max:500',
        ]);

        // Define what fields can be corrected
        $correctableFields = [
            'first_name',
            'last_name',
            'date_of_birth',
            'passport_number',
            'passport_expiry',
            'nationality',
            'email',
            'phone_number',
        ];

        // Check specific permissions for name correction
        if ($request->has('first_name') || $request->has('last_name')) {
            if (!$user->hasPermission('passengers.correct_name')) {
                return response()->json([
                    'message' => 'Access denied. Requires passengers.correct_name permission.',
                ], 403);
            }
        }

        // Check specific permissions for passport correction
        if ($request->has('passport_number') || $request->has('passport_expiry')) {
            if (!$user->hasPermission('passengers.correct_passport')) {
                return response()->json([
                    'message' => 'Access denied. Requires passengers.correct_passport permission.',
                ], 403);
            }
        }

        // Filter only correctable fields from request
        $updates = $request->only($correctableFields);

        if (empty($updates)) {
            return response()->json([
                'message' => 'No valid fields to update',
            ], 400);
        }

        try {
            DB::transaction(function () use ($passenger, $updates, $request, $user) {
                // Store original data for audit
                $originalData = $passenger->only(array_keys($updates));

                // Update passenger with new data
                $passenger->update($updates);

                // Store audit trail
                $passenger->update([
                    'original_data' => $originalData,
                    'corrected_by' => $user->id,
                    'corrected_at' => now(),
                    'correction_reason' => $request->reason,
                ]);

                // Notify booking owner
                $booking = $passenger->booking;
                if ($booking && $booking->user_id) {
                    Notification::create([
                        'user_id' => $booking->user_id,
                        'type' => 'booking',
                        'title' => 'Passenger Details Updated',
                        'message' => "Passenger details for {$passenger->full_name} on booking #{$booking->pnr} have been corrected.",
                        'data' => [
                            'booking_id' => $booking->id,
                            'passenger_id' => $passenger->id,
                            'updated_fields' => array_keys($updates),
                        ],
                    ]);
                }
            });

            Log::info("Passenger details corrected", [
                'passenger_id' => $passenger->id,
                'booking_id' => $passenger->booking_id,
                'corrected_by' => $user->id,
                'updated_fields' => array_keys($updates),
            ]);

            return response()->json([
                'message' => 'Passenger details updated successfully',
                'passenger' => $passenger->fresh(),
            ]);

        } catch (\Exception $e) {
            Log::error("Passenger correction failed", [
                'passenger_id' => $passenger->id,
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'message' => 'Failed to update passenger details',
            ], 500);
        }
    }

    /**
     * Get passenger correction history
     */
    public function correctionHistory(Request $request, Passenger $passenger)
    {
        $user = $request->user();

        if (!$user->hasPermission('passengers.view')) {
            return response()->json(['message' => 'Access denied'], 403);
        }

        $correctedBy = null;
        if ($passenger->corrected_by) {
            $corrector = \App\Models\User::find($passenger->corrected_by);
            $correctedBy = $corrector ? [
                'id' => $corrector->id,
                'name' => $corrector->name,
            ] : null;
        }

        return response()->json([
            'passenger_id' => $passenger->id,
            'current_data' => $passenger->only([
                'first_name',
                'last_name',
                'date_of_birth',
                'passport_number',
                'passport_expiry',
                'nationality',
                'email',
                'phone_number',
            ]),
            'original_data' => $passenger->original_data,
            'corrected_at' => $passenger->corrected_at,
            'corrected_by' => $correctedBy,
            'correction_reason' => $passenger->correction_reason,
        ]);
    }
}
