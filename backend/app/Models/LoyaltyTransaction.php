<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class LoyaltyTransaction extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'booking_id',
        'points',
        'type',
        'description',
        'reference',
        'metadata',
    ];

    protected function casts(): array
    {
        return [
            'metadata' => 'array',
        ];
    }

    /**
     * Get the user that owns the transaction.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get the booking associated with the transaction.
     */
    public function booking(): BelongsTo
    {
        return $this->belongsTo(Booking::class);
    }

    /**
     * Scope for earn transactions
     */
    public function scopeEarned($query)
    {
        return $query->where('points', '>', 0);
    }

    /**
     * Scope for redeem transactions
     */
    public function scopeRedeemed($query)
    {
        return $query->where('points', '<', 0);
    }

    /**
     * Check if this is an earn transaction
     */
    public function isEarn(): bool
    {
        return $this->points > 0;
    }

    /**
     * Get absolute points value
     */
    public function getAbsolutePoints(): int
    {
        return abs($this->points);
    }
}
