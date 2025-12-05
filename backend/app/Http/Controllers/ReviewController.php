<?php

namespace App\Http\Controllers;

use App\Models\Review;
use App\Models\Booking;
use App\Models\Airline;
use App\Models\Flight;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class ReviewController extends Controller
{
    /**
     * Get reviews for a specific entity (airline/flight)
     */
    public function index(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'type' => 'required|in:airline,flight',
            'id' => 'required|integer',
        ]);

        $reviews = Review::with('user:id,name')
            ->where('reviewable_type', $this->getModelClass($validated['type']))
            ->where('reviewable_id', $validated['id'])
            ->approved()
            ->orderBy('created_at', 'desc')
            ->paginate(10);

        // Calculate stats
        $stats = Review::where('reviewable_type', $this->getModelClass($validated['type']))
            ->where('reviewable_id', $validated['id'])
            ->approved()
            ->selectRaw('
                COUNT(*) as total_reviews,
                AVG(rating) as average_rating,
                SUM(CASE WHEN rating = 5 THEN 1 ELSE 0 END) as five_star,
                SUM(CASE WHEN rating = 4 THEN 1 ELSE 0 END) as four_star,
                SUM(CASE WHEN rating = 3 THEN 1 ELSE 0 END) as three_star,
                SUM(CASE WHEN rating = 2 THEN 1 ELSE 0 END) as two_star,
                SUM(CASE WHEN rating = 1 THEN 1 ELSE 0 END) as one_star
            ')
            ->first();

        return response()->json([
            'reviews' => $reviews,
            'stats' => [
                'total_reviews' => $stats->total_reviews ?? 0,
                'average_rating' => $stats->average_rating ? round($stats->average_rating, 1) : 0,
                'rating_distribution' => [
                    5 => (int)($stats->five_star ?? 0),
                    4 => (int)($stats->four_star ?? 0),
                    3 => (int)($stats->three_star ?? 0),
                    2 => (int)($stats->two_star ?? 0),
                    1 => (int)($stats->one_star ?? 0),
                ],
            ],
        ]);
    }

    /**
     * Store a new review
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'booking_id' => 'required|exists:bookings,id',
            'type' => 'required|in:airline,flight',
            'rating' => 'required|integer|min:1|max:5',
            'title' => 'nullable|string|max:100',
            'comment' => 'nullable|string|max:1000',
            'pros' => 'nullable|array',
            'cons' => 'nullable|array',
        ]);

        $booking = Booking::where('id', $validated['booking_id'])
            ->where('user_id', $request->user()->id)
            ->where('status', 'confirmed')
            ->where('payment_status', 'paid')
            ->firstOrFail();

        // Determine the reviewable entity
        $reviewableId = $validated['type'] === 'airline' 
            ? $booking->flight->airline_id 
            : $booking->flight_id;

        // Check if already reviewed
        $exists = Review::where('user_id', $request->user()->id)
            ->where('booking_id', $booking->id)
            ->where('reviewable_type', $this->getModelClass($validated['type']))
            ->where('reviewable_id', $reviewableId)
            ->exists();

        if ($exists) {
            return response()->json([
                'message' => 'You have already reviewed this ' . $validated['type'],
            ], 400);
        }

        $review = Review::create([
            'user_id' => $request->user()->id,
            'booking_id' => $booking->id,
            'reviewable_type' => $this->getModelClass($validated['type']),
            'reviewable_id' => $reviewableId,
            'rating' => $validated['rating'],
            'title' => $validated['title'] ?? null,
            'comment' => $validated['comment'] ?? null,
            'pros' => $validated['pros'] ?? null,
            'cons' => $validated['cons'] ?? null,
            'status' => 'pending', // Will require admin approval
        ]);

        return response()->json([
            'message' => 'Review submitted successfully. It will be visible after approval.',
            'review' => $review,
        ], 201);
    }

    /**
     * Get user's reviews
     */
    public function userReviews(Request $request): JsonResponse
    {
        $reviews = Review::with(['booking.flight.airline', 'booking.flight.originAirport', 'booking.flight.destinationAirport'])
            ->where('user_id', $request->user()->id)
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json($reviews);
    }

    /**
     * Admin: Get all pending reviews
     */
    public function pending(): JsonResponse
    {
        $reviews = Review::with(['user:id,name,email', 'booking.flight.airline'])
            ->pending()
            ->orderBy('created_at', 'asc')
            ->paginate(20);

        return response()->json($reviews);
    }

    /**
     * Admin: Approve a review
     */
    public function approve(Review $review): JsonResponse
    {
        $review->update(['status' => 'approved']);

        return response()->json([
            'message' => 'Review approved successfully',
            'review' => $review,
        ]);
    }

    /**
     * Admin: Reject a review
     */
    public function reject(Request $request, Review $review): JsonResponse
    {
        $review->update(['status' => 'rejected']);

        return response()->json([
            'message' => 'Review rejected',
            'review' => $review,
        ]);
    }

    /**
     * Admin: Respond to a review
     */
    public function respond(Request $request, Review $review): JsonResponse
    {
        $validated = $request->validate([
            'response' => 'required|string|max:500',
        ]);

        $review->update(['admin_response' => $validated['response']]);

        return response()->json([
            'message' => 'Response added successfully',
            'review' => $review,
        ]);
    }

    /**
     * Admin: Get all reviews
     */
    public function adminIndex(Request $request): JsonResponse
    {
        $query = Review::with(['user:id,name,email', 'booking.flight.airline']);

        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        $reviews = $query->orderBy('created_at', 'desc')->paginate(20);

        return response()->json($reviews);
    }

    private function getModelClass(string $type): string
    {
        return match($type) {
            'airline' => Airline::class,
            'flight' => Flight::class,
            default => throw new \InvalidArgumentException('Invalid review type'),
        };
    }
}
