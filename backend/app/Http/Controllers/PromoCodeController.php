<?php

namespace App\Http\Controllers;

use App\Models\PromoCode;
use App\Models\PromoCodeUsage;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class PromoCodeController extends Controller
{
    /**
     * Display a listing of promo codes (admin)
     */
    public function index(Request $request): JsonResponse
    {
        $query = PromoCode::query();

        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        if ($request->has('applicable_to')) {
            $query->where('applicable_to', $request->applicable_to);
        }

        $promoCodes = $query->withCount('usages')
            ->orderBy('created_at', 'desc')
            ->paginate(20);

        return response()->json($promoCodes);
    }

    /**
     * Store a newly created promo code
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'code' => 'required|string|unique:promo_codes,code|max:20',
            'description' => 'nullable|string|max:255',
            'discount_type' => 'required|in:percentage,fixed',
            'discount_value' => 'required|numeric|min:0',
            'min_booking_amount' => 'nullable|numeric|min:0',
            'max_discount' => 'nullable|numeric|min:0',
            'valid_from' => 'required|date',
            'valid_until' => 'required|date|after:valid_from',
            'usage_limit' => 'nullable|integer|min:1',
            'applicable_to' => 'required|in:flight,hotel,both',
            'status' => 'required|in:active,inactive',
        ]);

        $validated['code'] = strtoupper($validated['code']);

        $promoCode = PromoCode::create($validated);

        return response()->json([
            'message' => 'Promo code created successfully',
            'promo_code' => $promoCode,
        ], 201);
    }

    /**
     * Display the specified promo code
     */
    public function show(PromoCode $promoCode): JsonResponse
    {
        $promoCode->loadCount('usages');
        $promoCode->load(['usages' => function ($query) {
            $query->with('user:id,name,email', 'booking:id,pnr,total_price')
                  ->latest()
                  ->limit(10);
        }]);

        return response()->json($promoCode);
    }

    /**
     * Update the specified promo code
     */
    public function update(Request $request, PromoCode $promoCode): JsonResponse
    {
        $validated = $request->validate([
            'code' => 'sometimes|string|unique:promo_codes,code,' . $promoCode->id . '|max:20',
            'description' => 'nullable|string|max:255',
            'discount_type' => 'sometimes|in:percentage,fixed',
            'discount_value' => 'sometimes|numeric|min:0',
            'min_booking_amount' => 'nullable|numeric|min:0',
            'max_discount' => 'nullable|numeric|min:0',
            'valid_from' => 'sometimes|date',
            'valid_until' => 'sometimes|date|after:valid_from',
            'usage_limit' => 'nullable|integer|min:1',
            'applicable_to' => 'sometimes|in:flight,hotel,both',
            'status' => 'sometimes|in:active,inactive',
        ]);

        if (isset($validated['code'])) {
            $validated['code'] = strtoupper($validated['code']);
        }

        $promoCode->update($validated);

        return response()->json([
            'message' => 'Promo code updated successfully',
            'promo_code' => $promoCode,
        ]);
    }

    /**
     * Remove the specified promo code
     */
    public function destroy(PromoCode $promoCode): JsonResponse
    {
        $promoCode->delete();

        return response()->json([
            'message' => 'Promo code deleted successfully',
        ]);
    }

    /**
     * Validate a promo code for use (public/user)
     */
    public function validateCode(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'code' => 'required|string',
            'amount' => 'required|numeric|min:0',
            'type' => 'required|in:flight,hotel',
        ]);

        $promoCode = PromoCode::where('code', strtoupper($validated['code']))->first();

        if (!$promoCode) {
            return response()->json([
                'valid' => false,
                'message' => 'Invalid promo code',
            ], 404);
        }

        if (!$promoCode->isValid()) {
            $message = 'This promo code is not valid';
            
            if ($promoCode->status !== 'active') {
                $message = 'This promo code is inactive';
            } elseif (now() < $promoCode->valid_from) {
                $message = 'This promo code is not yet active';
            } elseif (now() > $promoCode->valid_until) {
                $message = 'This promo code has expired';
            } elseif ($promoCode->usage_limit && $promoCode->used_count >= $promoCode->usage_limit) {
                $message = 'This promo code has reached its usage limit';
            }

            return response()->json([
                'valid' => false,
                'message' => $message,
            ], 400);
        }

        // Check if applicable to this booking type
        if ($promoCode->applicable_to !== 'both' && $promoCode->applicable_to !== $validated['type']) {
            return response()->json([
                'valid' => false,
                'message' => 'This promo code is not applicable for ' . $validated['type'] . ' bookings',
            ], 400);
        }

        // Check minimum amount
        if ($validated['amount'] < $promoCode->min_booking_amount) {
            return response()->json([
                'valid' => false,
                'message' => 'Minimum booking amount of $' . $promoCode->min_booking_amount . ' required',
            ], 400);
        }

        // Check if user already used this code (if authenticated)
        if ($request->user()) {
            $alreadyUsed = PromoCodeUsage::where('promo_code_id', $promoCode->id)
                ->where('user_id', $request->user()->id)
                ->exists();

            if ($alreadyUsed) {
                return response()->json([
                    'valid' => false,
                    'message' => 'You have already used this promo code',
                ], 400);
            }
        }

        $discount = $promoCode->calculateDiscount($validated['amount']);

        return response()->json([
            'valid' => true,
            'promo_code' => [
                'id' => $promoCode->id,
                'code' => $promoCode->code,
                'description' => $promoCode->description,
                'discount_type' => $promoCode->discount_type,
                'discount_value' => $promoCode->discount_value,
            ],
            'discount_amount' => $discount,
            'final_amount' => $validated['amount'] - $discount,
            'message' => 'Promo code applied successfully! You save $' . number_format($discount, 2),
        ]);
    }

    /**
     * Get active promo codes for public display
     */
    public function activePromoCodes(): JsonResponse
    {
        $promoCodes = PromoCode::where('status', 'active')
            ->where('valid_from', '<=', now())
            ->where('valid_until', '>=', now())
            ->where(function ($query) {
                $query->whereNull('usage_limit')
                      ->orWhereColumn('used_count', '<', 'usage_limit');
            })
            ->select(['id', 'code', 'description', 'discount_type', 'discount_value', 'min_booking_amount', 'max_discount', 'valid_until', 'applicable_to'])
            ->get();

        return response()->json($promoCodes);
    }
}
