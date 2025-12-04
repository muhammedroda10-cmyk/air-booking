<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\Hotel;
use Illuminate\Http\Request;

class HotelController extends Controller
{
    public function index()
    {
        return Hotel::with('rooms')->get();
    }

    public function search(Request $request)
    {
        $query = Hotel::query();

        if ($request->has('city')) {
            $query->where('city', 'like', '%' . $request->city . '%');
        }

        if ($request->has('min_price')) {
            $query->where('price_per_night', '>=', $request->min_price);
        }

        if ($request->has('max_price')) {
            $query->where('price_per_night', '<=', $request->max_price);
        }

        if ($request->has('rating')) {
            $query->where('rating', '>=', $request->rating);
        }

        return $query->with('rooms')->get();
    }

    public function show(Hotel $hotel)
    {
        return $hotel->load('rooms');
    }

    /**
     * Store a new hotel (Admin only)
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'address' => 'required|string',
            'city' => 'required|string|max:100',
            'country' => 'nullable|string|max:100',
            'description' => 'nullable|string',
            'rating' => 'nullable|numeric|min:0|max:5',
            'price_per_night' => 'required|numeric|min:0',
            'image_url' => 'nullable|url',
            'amenities' => 'nullable|array',
        ]);

        $hotel = Hotel::create($validated);

        return response()->json($hotel, 201);
    }

    /**
     * Update an existing hotel (Admin only)
     */
    public function update(Request $request, Hotel $hotel)
    {
        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'address' => 'sometimes|string',
            'city' => 'sometimes|string|max:100',
            'country' => 'nullable|string|max:100',
            'description' => 'nullable|string',
            'rating' => 'nullable|numeric|min:0|max:5',
            'price_per_night' => 'sometimes|numeric|min:0',
            'image_url' => 'nullable|url',
            'amenities' => 'nullable|array',
        ]);

        $hotel->update($validated);

        return response()->json($hotel);
    }

    /**
     * Delete a hotel (Admin only)
     */
    public function destroy(Hotel $hotel)
    {
        // Check if hotel has active bookings
        $activeBookings = $hotel->bookings()->whereIn('status', ['pending', 'confirmed'])->count();

        if ($activeBookings > 0) {
            return response()->json([
                'message' => 'Cannot delete hotel with active bookings'
            ], 422);
        }

        $hotel->delete();

        return response()->json(['message' => 'Hotel deleted successfully']);
    }
}
