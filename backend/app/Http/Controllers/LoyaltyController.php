<?php

namespace App\Http\Controllers;

use App\Models\LoyaltyPoints;
use App\Models\LoyaltyTransaction;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class LoyaltyController extends Controller
{
    /**
     * Get user's loyalty account
     */
    public function show(Request $request): JsonResponse
    {
        $loyalty = $this->getOrCreateLoyaltyAccount($request->user());

        $recentTransactions = LoyaltyTransaction::where('user_id', $request->user()->id)
            ->orderBy('created_at', 'desc')
            ->limit(10)
            ->get()
            ->map(function ($transaction) {
                return [
                    'id' => $transaction->id,
                    'points' => $transaction->points,
                    'type' => $transaction->type,
                    'description' => $transaction->description,
                    'reference' => $transaction->reference,
                    'created_at' => $transaction->created_at->format('Y-m-d H:i:s'),
                    'is_earn' => $transaction->isEarn(),
                ];
            });

        return response()->json([
            'balance' => $loyalty->balance,
            'lifetime_points' => $loyalty->lifetime_points,
            'tier' => $loyalty->tier,
            'tier_color' => $loyalty->getTierColor(),
            'tier_benefits' => $loyalty->getTierBenefits(),
            'points_to_next_tier' => $loyalty->getPointsToNextTier(),
            'points_value' => $loyalty->calculatePointsValue($loyalty->balance),
            'recent_transactions' => $recentTransactions,
        ]);
    }

    /**
     * Get all transactions history
     */
    public function transactions(Request $request): JsonResponse
    {
        $transactions = LoyaltyTransaction::where('user_id', $request->user()->id)
            ->with('booking:id,pnr')
            ->orderBy('created_at', 'desc')
            ->paginate(20);

        return response()->json($transactions);
    }

    /**
     * Calculate points for a booking amount
     */
    public function calculatePoints(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'amount' => 'required|numeric|min:0',
        ]);

        $loyalty = $this->getOrCreateLoyaltyAccount($request->user());
        $pointsToEarn = $loyalty->calculatePointsToEarn($validated['amount']);

        return response()->json([
            'amount' => $validated['amount'],
            'points_to_earn' => $pointsToEarn,
            'earn_rate' => LoyaltyPoints::POINTS_PER_DOLLAR[$loyalty->tier],
            'tier' => $loyalty->tier,
        ]);
    }

    /**
     * Redeem points for a discount
     */
    public function redeem(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'points' => 'required|integer|min:100',
            'booking_id' => 'nullable|exists:bookings,id',
        ]);

        $loyalty = $this->getOrCreateLoyaltyAccount($request->user());

        if ($loyalty->balance < $validated['points']) {
            return response()->json([
                'message' => 'Insufficient points balance',
                'available' => $loyalty->balance,
                'requested' => $validated['points'],
            ], 400);
        }

        // Minimum redemption is 100 points
        if ($validated['points'] < 100) {
            return response()->json([
                'message' => 'Minimum redemption is 100 points',
            ], 400);
        }

        $discountValue = $loyalty->calculatePointsValue($validated['points']);

        try {
            DB::transaction(function () use ($loyalty, $validated, $discountValue) {
                $loyalty->redeemPoints(
                    $validated['points'],
                    "Redeemed {$validated['points']} points for \${$discountValue} discount",
                    $validated['booking_id'] ?? null,
                    'REDEEM_' . strtoupper(uniqid())
                );
            });

            Log::info('Points redeemed', [
                'user_id' => $request->user()->id,
                'points' => $validated['points'],
                'discount' => $discountValue,
            ]);

            return response()->json([
                'message' => 'Points redeemed successfully',
                'points_redeemed' => $validated['points'],
                'discount_value' => $discountValue,
                'new_balance' => $loyalty->fresh()->balance,
            ]);
        } catch (\Exception $e) {
            Log::error('Points redemption failed', [
                'user_id' => $request->user()->id,
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'message' => 'Failed to redeem points',
            ], 500);
        }
    }

    /**
     * Get tier information and benefits
     */
    public function tiers(): JsonResponse
    {
        return response()->json([
            'tiers' => LoyaltyPoints::TIER_BENEFITS,
            'thresholds' => LoyaltyPoints::TIER_THRESHOLDS,
            'earn_rates' => LoyaltyPoints::POINTS_PER_DOLLAR,
        ]);
    }

    /**
     * Award bonus points (e.g., for promotions, referrals)
     * Admin only
     */
    public function awardBonus(Request $request): JsonResponse
    {
        if (!$request->user()->isAdmin()) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $validated = $request->validate([
            'user_id' => 'required|exists:users,id',
            'points' => 'required|integer|min:1',
            'reason' => 'required|string|max:255',
        ]);

        $targetUser = \App\Models\User::find($validated['user_id']);
        $loyalty = $this->getOrCreateLoyaltyAccount($targetUser);

        $transaction = $loyalty->addPoints(
            $validated['points'],
            'bonus',
            $validated['reason'],
            null,
            'BONUS_' . strtoupper(uniqid())
        );

        // Create notification
        \App\Models\Notification::create([
            'user_id' => $targetUser->id,
            'type' => 'loyalty',
            'title' => 'Bonus Points Awarded!',
            'message' => "You've received {$validated['points']} bonus points! {$validated['reason']}",
            'data' => [
                'transaction_id' => $transaction->id,
                'points' => $validated['points'],
            ],
        ]);

        Log::info('Bonus points awarded', [
            'admin_id' => $request->user()->id,
            'user_id' => $targetUser->id,
            'points' => $validated['points'],
            'reason' => $validated['reason'],
        ]);

        return response()->json([
            'message' => 'Bonus points awarded successfully',
            'transaction' => $transaction,
            'new_balance' => $loyalty->fresh()->balance,
        ]);
    }

    /**
     * Get or create loyalty account for user
     */
    private function getOrCreateLoyaltyAccount($user): LoyaltyPoints
    {
        return LoyaltyPoints::firstOrCreate(
            ['user_id' => $user->id],
            [
                'balance' => 0,
                'lifetime_points' => 0,
                'tier' => 'bronze',
            ]
        );
    }
}
