<?php

namespace App\Http\Controllers;

use App\Models\Airline;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class AirlineController extends Controller
{
    public function index(): JsonResponse
    {
        $airlines = Airline::withCount(['flights', 'reviews' => function ($query) {
            $query->approved();
        }])
        ->get()
        ->map(function ($airline) {
            $airline->average_rating = $airline->average_rating;
            return $airline;
        });

        return response()->json($airlines);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255|unique:airlines,name',
            'code' => 'required|string|max:3|unique:airlines,code',
            'logo_url' => 'nullable|url',
            'country' => 'nullable|string|max:100',
            'cancel_full_refund_hours' => 'nullable|integer|min:0',
            'cancel_75_refund_hours' => 'nullable|integer|min:0',
            'cancel_50_refund_hours' => 'nullable|integer|min:0',
            'cancellation_fee' => 'nullable|numeric|min:0',
        ]);

        $airline = Airline::create($validated);

        return response()->json($airline, 201);
    }

    public function show(Airline $airline): JsonResponse
    {
        $airline->loadCount(['flights', 'reviews' => function ($query) {
            $query->approved();
        }]);

        // Add computed attributes
        $airline->average_rating = $airline->average_rating;
        $airline->cancellation_policy_details = $airline->cancellation_policy;

        // Load recent reviews
        $airline->load(['reviews' => function ($query) {
            $query->with('user:id,name')
                  ->approved()
                  ->latest()
                  ->limit(5);
        }]);

        return response()->json($airline);
    }

    public function update(Request $request, Airline $airline): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'sometimes|string|max:255|unique:airlines,name,' . $airline->id,
            'code' => 'sometimes|string|max:3|unique:airlines,code,' . $airline->id,
            'logo_url' => 'nullable|url',
            'country' => 'nullable|string|max:100',
            'cancel_full_refund_hours' => 'nullable|integer|min:0',
            'cancel_75_refund_hours' => 'nullable|integer|min:0',
            'cancel_50_refund_hours' => 'nullable|integer|min:0',
            'cancellation_fee' => 'nullable|numeric|min:0',
        ]);

        $airline->update($validated);

        return response()->json($airline);
    }

    public function destroy(Airline $airline): JsonResponse
    {
        $airline->delete();

        return response()->json(null, 204);
    }
}
