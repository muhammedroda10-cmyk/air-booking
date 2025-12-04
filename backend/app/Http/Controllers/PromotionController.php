<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

class PromotionController extends Controller
{
    /**
     * Get all active promotions/deals
     */
    public function index()
    {
        // For now, return static promotion data
        // In production, this would come from a database
        $promotions = [
            [
                'id' => 1,
                'title' => 'Winter Wonderland Sale',
                'description' => 'Save up to 40% on flights to European destinations',
                'discount' => '40%',
                'code' => 'WINTER40',
                'image' => 'https://images.unsplash.com/photo-1491002052546-bf38f186af56?w=800',
                'valid_until' => '2025-02-28',
                'destinations' => ['Paris', 'London', 'Rome', 'Barcelona'],
                'min_price' => 299,
                'type' => 'percentage',
            ],
            [
                'id' => 2,
                'title' => 'Early Bird Special',
                'description' => 'Book 60 days in advance and save $100 on any flight',
                'discount' => '$100',
                'code' => 'EARLY100',
                'image' => 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800',
                'valid_until' => '2025-12-31',
                'destinations' => ['All destinations'],
                'min_price' => 0,
                'type' => 'fixed',
            ],
            [
                'id' => 3,
                'title' => 'Weekend Getaway',
                'description' => '25% off weekend flights within the region',
                'discount' => '25%',
                'code' => 'WEEKEND25',
                'image' => 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800',
                'valid_until' => '2025-03-31',
                'destinations' => ['Dubai', 'Abu Dhabi', 'Doha', 'Muscat'],
                'min_price' => 149,
                'type' => 'percentage',
            ],
            [
                'id' => 4,
                'title' => 'Family Package Deal',
                'description' => 'Kids fly free when booking for 4+ passengers',
                'discount' => 'Kids Free',
                'code' => 'FAMILY4',
                'image' => 'https://images.unsplash.com/photo-1530789253388-582c481c54b0?w=800',
                'valid_until' => '2025-06-30',
                'destinations' => ['All destinations'],
                'min_price' => 0,
                'type' => 'special',
            ],
            [
                'id' => 5,
                'title' => 'Business Class Upgrade',
                'description' => 'Upgrade to business class for just $199 extra',
                'discount' => '$199 Upgrade',
                'code' => 'BIZUP199',
                'image' => 'https://images.unsplash.com/photo-1540339832862-474599807836?w=800',
                'valid_until' => '2025-04-15',
                'destinations' => ['New York', 'Los Angeles', 'Tokyo', 'Singapore'],
                'min_price' => 599,
                'type' => 'upgrade',
            ],
            [
                'id' => 6,
                'title' => 'Spring Break Special',
                'description' => 'Up to 35% off on tropical destinations',
                'discount' => '35%',
                'code' => 'SPRING35',
                'image' => 'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=800',
                'valid_until' => '2025-04-30',
                'destinations' => ['Maldives', 'Bali', 'Thailand', 'Hawaii'],
                'min_price' => 399,
                'type' => 'percentage',
            ],
        ];

        return response()->json($promotions);
    }

    /**
     * Get featured/highlighted deals
     */
    public function featured()
    {
        $all = $this->index()->original;
        // Return first 3 as featured
        return response()->json(array_slice($all, 0, 3));
    }

    /**
     * Validate a promo code
     */
    public function validate(Request $request)
    {
        $code = $request->code;
        $all = $this->index()->original;

        $promo = collect($all)->firstWhere('code', strtoupper($code));

        if (!$promo) {
            return response()->json([
                'valid' => false,
                'message' => 'Invalid promo code'
            ], 404);
        }

        // Check if expired
        if (strtotime($promo['valid_until']) < time()) {
            return response()->json([
                'valid' => false,
                'message' => 'This promo code has expired'
            ], 400);
        }

        return response()->json([
            'valid' => true,
            'promotion' => $promo
        ]);
    }
}
