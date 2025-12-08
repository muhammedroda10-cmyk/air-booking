<?php

namespace App\Http\Controllers;

use App\Models\PriceAlert;
use App\Models\Notification;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Log;

class PriceAlertController extends Controller
{
    /**
     * Get user's price alerts
     */
    public function index(Request $request): JsonResponse
    {
        $alerts = $request->user()->priceAlerts()
            ->orderBy('departure_date')
            ->get()
            ->map(function ($alert) {
                return [
                    'id' => $alert->id,
                    'route' => $alert->route,
                    'origin_code' => $alert->origin_code,
                    'destination_code' => $alert->destination_code,
                    'departure_date' => $alert->departure_date->format('Y-m-d'),
                    'return_date' => $alert->return_date?->format('Y-m-d'),
                    'trip_type' => $alert->trip_type,
                    'target_price' => $alert->target_price,
                    'current_price' => $alert->current_price,
                    'lowest_price' => $alert->lowest_price,
                    'currency' => $alert->currency,
                    'passengers' => $alert->passengers,
                    'cabin_class' => $alert->cabin_class,
                    'is_active' => $alert->is_active,
                    'last_checked_at' => $alert->last_checked_at?->diffForHumans(),
                    'is_below_target' => $alert->isPriceBelowTarget(),
                    'created_at' => $alert->created_at->format('Y-m-d H:i:s'),
                ];
            });

        return response()->json($alerts);
    }

    /**
     * Create a new price alert
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'origin_code' => 'required|string|size:3',
            'destination_code' => 'required|string|size:3',
            'departure_date' => 'required|date|after:today',
            'return_date' => 'nullable|date|after:departure_date',
            'trip_type' => 'sometimes|in:one_way,round_trip',
            'target_price' => 'nullable|numeric|min:1',
            'passengers' => 'sometimes|integer|min:1|max:9',
            'cabin_class' => 'sometimes|in:economy,premium_economy,business,first',
        ]);

        // Check for existing alert on same route/date
        $existingAlert = $request->user()->priceAlerts()
            ->where('origin_code', strtoupper($validated['origin_code']))
            ->where('destination_code', strtoupper($validated['destination_code']))
            ->where('departure_date', $validated['departure_date'])
            ->where('is_active', true)
            ->first();

        if ($existingAlert) {
            return response()->json([
                'message' => 'You already have an active alert for this route and date.',
                'existing_alert' => $existingAlert,
            ], 422);
        }

        // Limit number of alerts per user
        $alertCount = $request->user()->priceAlerts()->where('is_active', true)->count();
        if ($alertCount >= 10) {
            return response()->json([
                'message' => 'You can have a maximum of 10 active price alerts.',
            ], 422);
        }

        $alert = PriceAlert::create([
            'user_id' => $request->user()->id,
            'origin_code' => strtoupper($validated['origin_code']),
            'destination_code' => strtoupper($validated['destination_code']),
            'departure_date' => $validated['departure_date'],
            'return_date' => $validated['return_date'] ?? null,
            'trip_type' => $validated['trip_type'] ?? 'one_way',
            'target_price' => $validated['target_price'] ?? null,
            'passengers' => $validated['passengers'] ?? 1,
            'cabin_class' => $validated['cabin_class'] ?? 'economy',
            'is_active' => true,
        ]);

        Log::info('Price alert created', [
            'alert_id' => $alert->id,
            'user_id' => $request->user()->id,
            'route' => $alert->route,
        ]);

        return response()->json([
            'message' => 'Price alert created successfully',
            'alert' => $alert,
        ], 201);
    }

    /**
     * Show a specific price alert
     */
    public function show(Request $request, PriceAlert $priceAlert): JsonResponse
    {
        if ($priceAlert->user_id !== $request->user()->id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        return response()->json([
            'id' => $priceAlert->id,
            'route' => $priceAlert->route,
            'origin_code' => $priceAlert->origin_code,
            'destination_code' => $priceAlert->destination_code,
            'departure_date' => $priceAlert->departure_date->format('Y-m-d'),
            'return_date' => $priceAlert->return_date?->format('Y-m-d'),
            'trip_type' => $priceAlert->trip_type,
            'target_price' => $priceAlert->target_price,
            'current_price' => $priceAlert->current_price,
            'lowest_price' => $priceAlert->lowest_price,
            'currency' => $priceAlert->currency,
            'passengers' => $priceAlert->passengers,
            'cabin_class' => $priceAlert->cabin_class,
            'is_active' => $priceAlert->is_active,
            'last_checked_at' => $priceAlert->last_checked_at,
            'is_below_target' => $priceAlert->isPriceBelowTarget(),
        ]);
    }

    /**
     * Update a price alert
     */
    public function update(Request $request, PriceAlert $priceAlert): JsonResponse
    {
        if ($priceAlert->user_id !== $request->user()->id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $validated = $request->validate([
            'target_price' => 'nullable|numeric|min:1',
            'is_active' => 'sometimes|boolean',
        ]);

        $priceAlert->update($validated);

        return response()->json([
            'message' => 'Price alert updated',
            'alert' => $priceAlert,
        ]);
    }

    /**
     * Delete a price alert
     */
    public function destroy(Request $request, PriceAlert $priceAlert): JsonResponse
    {
        if ($priceAlert->user_id !== $request->user()->id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $priceAlert->delete();

        return response()->json([
            'message' => 'Price alert deleted',
        ]);
    }

    /**
     * Toggle alert active status
     */
    public function toggle(Request $request, PriceAlert $priceAlert): JsonResponse
    {
        if ($priceAlert->user_id !== $request->user()->id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $priceAlert->update([
            'is_active' => !$priceAlert->is_active,
        ]);

        return response()->json([
            'message' => $priceAlert->is_active ? 'Alert activated' : 'Alert paused',
            'is_active' => $priceAlert->is_active,
        ]);
    }

    /**
     * Check price for an alert (trigger manual check)
     */
    public function checkPrice(Request $request, PriceAlert $priceAlert): JsonResponse
    {
        if ($priceAlert->user_id !== $request->user()->id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        try {
            // Search for current price
            $flightSearchService = app(\App\Services\FlightSearchService::class);
            
            $searchRequest = new \App\DTOs\Flight\FlightSearchRequest(
                origin: $priceAlert->origin_code,
                destination: $priceAlert->destination_code,
                departureDate: $priceAlert->departure_date,
                returnDate: $priceAlert->return_date,
                adults: $priceAlert->passengers,
                cabinClass: $priceAlert->cabin_class,
            );

            $results = $flightSearchService->search($searchRequest);

            if (empty($results)) {
                return response()->json([
                    'message' => 'No flights found for this route',
                    'last_checked_at' => now()->toIso8601String(),
                ]);
            }

            // Get lowest price from results
            $lowestOffer = collect($results)->sortBy(fn($offer) => $offer->price->total)->first();
            $newPrice = $lowestOffer->price->total;

            $oldPrice = $priceAlert->current_price;
            $priceAlert->updatePrice($newPrice);

            $priceDropped = $oldPrice && $newPrice < $oldPrice;
            $belowTarget = $priceAlert->isPriceBelowTarget();

            // Send notification if price dropped below target
            if ($belowTarget && (!$priceAlert->last_notified_at || $priceAlert->last_notified_at->lt(now()->subHours(6)))) {
                Notification::create([
                    'user_id' => $priceAlert->user_id,
                    'type' => 'price_alert',
                    'title' => 'Price Alert: Target Reached!',
                    'message' => "Good news! Flights from {$priceAlert->origin_code} to {$priceAlert->destination_code} are now \${$newPrice} - below your target of \${$priceAlert->target_price}!",
                    'data' => [
                        'alert_id' => $priceAlert->id,
                        'current_price' => $newPrice,
                        'target_price' => $priceAlert->target_price,
                    ],
                ]);

                $priceAlert->update(['last_notified_at' => now()]);
            }

            return response()->json([
                'message' => 'Price checked successfully',
                'current_price' => $newPrice,
                'old_price' => $oldPrice,
                'lowest_price' => $priceAlert->lowest_price,
                'price_dropped' => $priceDropped,
                'below_target' => $belowTarget,
                'last_checked_at' => now()->toIso8601String(),
            ]);

        } catch (\Exception $e) {
            Log::error('Price check failed', [
                'alert_id' => $priceAlert->id,
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'message' => 'Failed to check price',
                'error' => config('app.debug') ? $e->getMessage() : null,
            ], 500);
        }
    }
}
