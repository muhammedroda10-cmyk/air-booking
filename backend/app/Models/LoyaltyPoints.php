<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class LoyaltyPoints extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'balance',
        'lifetime_points',
        'tier',
        'tier_evaluated_at',
    ];

    protected function casts(): array
    {
        return [
            'tier_evaluated_at' => 'datetime',
        ];
    }

    /**
     * Tier thresholds (lifetime points required)
     */
    public const TIER_THRESHOLDS = [
        'bronze' => 0,
        'silver' => 5000,
        'gold' => 20000,
        'platinum' => 50000,
    ];

    /**
     * Points per dollar spent by tier
     */
    public const POINTS_PER_DOLLAR = [
        'bronze' => 1,
        'silver' => 1.5,
        'gold' => 2,
        'platinum' => 3,
    ];

    /**
     * Tier benefits
     */
    public const TIER_BENEFITS = [
        'bronze' => [
            'earn_rate' => '1 point per $1',
            'redeem_rate' => '100 points = $1',
            'perks' => ['Basic support', 'Email notifications'],
        ],
        'silver' => [
            'earn_rate' => '1.5 points per $1',
            'redeem_rate' => '100 points = $1.10',
            'perks' => ['Priority support', 'Exclusive deals', 'Early access to sales'],
        ],
        'gold' => [
            'earn_rate' => '2 points per $1',
            'redeem_rate' => '100 points = $1.25',
            'perks' => ['VIP support', 'Free seat selection', 'Lounge access discounts'],
        ],
        'platinum' => [
            'earn_rate' => '3 points per $1',
            'redeem_rate' => '100 points = $1.50',
            'perks' => ['Concierge service', 'Free upgrades', 'Complimentary lounge access'],
        ],
    ];

    /**
     * Get the user that owns the loyalty account.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get transactions for this loyalty account.
     */
    public function transactions(): HasMany
    {
        return $this->hasMany(LoyaltyTransaction::class, 'user_id', 'user_id');
    }

    /**
     * Calculate points to earn for a given amount
     */
    public function calculatePointsToEarn(float $amount): int
    {
        $multiplier = self::POINTS_PER_DOLLAR[$this->tier] ?? 1;
        return (int) floor($amount * $multiplier);
    }

    /**
     * Calculate dollar value of points
     */
    public function calculatePointsValue(int $points): float
    {
        $rateMap = [
            'bronze' => 0.01,      // 100 points = $1
            'silver' => 0.011,    // 100 points = $1.10
            'gold' => 0.0125,     // 100 points = $1.25
            'platinum' => 0.015,  // 100 points = $1.50
        ];

        $rate = $rateMap[$this->tier] ?? 0.01;
        return round($points * $rate, 2);
    }

    /**
     * Add points to the account
     */
    public function addPoints(int $points, string $type, string $description, ?int $bookingId = null, ?string $reference = null): LoyaltyTransaction
    {
        $this->balance += $points;
        $this->lifetime_points += $points;
        $this->save();

        $this->evaluateTier();

        return LoyaltyTransaction::create([
            'user_id' => $this->user_id,
            'booking_id' => $bookingId,
            'points' => $points,
            'type' => $type,
            'description' => $description,
            'reference' => $reference,
        ]);
    }

    /**
     * Redeem points from the account
     */
    public function redeemPoints(int $points, string $description, ?int $bookingId = null, ?string $reference = null): ?LoyaltyTransaction
    {
        if ($this->balance < $points) {
            return null;
        }

        $this->balance -= $points;
        $this->save();

        return LoyaltyTransaction::create([
            'user_id' => $this->user_id,
            'booking_id' => $bookingId,
            'points' => -$points,
            'type' => 'redeem',
            'description' => $description,
            'reference' => $reference,
        ]);
    }

    /**
     * Evaluate and update tier based on lifetime points
     */
    public function evaluateTier(): string
    {
        $newTier = 'bronze';

        foreach (array_reverse(self::TIER_THRESHOLDS) as $tier => $threshold) {
            if ($this->lifetime_points >= $threshold) {
                $newTier = $tier;
                break;
            }
        }

        if ($this->tier !== $newTier) {
            $this->tier = $newTier;
            $this->tier_evaluated_at = now();
            $this->save();
        }

        return $this->tier;
    }

    /**
     * Get points needed for next tier
     */
    public function getPointsToNextTier(): ?int
    {
        $tiers = array_keys(self::TIER_THRESHOLDS);
        $currentIndex = array_search($this->tier, $tiers);

        if ($currentIndex === false || $currentIndex === count($tiers) - 1) {
            return null; // Already at highest tier
        }

        $nextTier = $tiers[$currentIndex + 1];
        $threshold = self::TIER_THRESHOLDS[$nextTier];

        return $threshold - $this->lifetime_points;
    }

    /**
     * Get tier benefits
     */
    public function getTierBenefits(): array
    {
        return self::TIER_BENEFITS[$this->tier] ?? self::TIER_BENEFITS['bronze'];
    }

    /**
     * Get tier display color
     */
    public function getTierColor(): string
    {
        return match($this->tier) {
            'silver' => '#C0C0C0',
            'gold' => '#FFD700',
            'platinum' => '#E5E4E2',
            default => '#CD7F32', // bronze
        };
    }
}
