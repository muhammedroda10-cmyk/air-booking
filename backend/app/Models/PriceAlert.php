<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PriceAlert extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'origin_code',
        'destination_code',
        'departure_date',
        'return_date',
        'trip_type',
        'target_price',
        'current_price',
        'lowest_price',
        'currency',
        'passengers',
        'cabin_class',
        'is_active',
        'last_checked_at',
        'last_notified_at',
    ];

    protected function casts(): array
    {
        return [
            'departure_date' => 'date',
            'return_date' => 'date',
            'target_price' => 'decimal:2',
            'current_price' => 'decimal:2',
            'lowest_price' => 'decimal:2',
            'is_active' => 'boolean',
            'last_checked_at' => 'datetime',
            'last_notified_at' => 'datetime',
        ];
    }

    /**
     * Get the user that owns the price alert.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Scope for active alerts
     */
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    /**
     * Scope for alerts that need checking (not checked in last hour)
     */
    public function scopeNeedsChecking($query)
    {
        return $query->where(function ($q) {
            $q->whereNull('last_checked_at')
              ->orWhere('last_checked_at', '<', now()->subHour());
        });
    }

    /**
     * Scope for upcoming departures (within 30 days)
     */
    public function scopeUpcoming($query)
    {
        return $query->where('departure_date', '>=', now())
                     ->where('departure_date', '<=', now()->addDays(30));
    }

    /**
     * Check if the current price is below the target price
     */
    public function isPriceBelowTarget(): bool
    {
        if (!$this->target_price || !$this->current_price) {
            return false;
        }

        return $this->current_price < $this->target_price;
    }

    /**
     * Check if the price has dropped since last check
     */
    public function hasPriceDropped(): bool
    {
        if (!$this->current_price || !$this->lowest_price) {
            return false;
        }

        return $this->current_price < $this->lowest_price;
    }

    /**
     * Update price data
     */
    public function updatePrice(float $newPrice): void
    {
        $oldLowest = $this->lowest_price;
        
        $this->current_price = $newPrice;
        $this->last_checked_at = now();

        // Update lowest price if this is lower
        if (!$this->lowest_price || $newPrice < $this->lowest_price) {
            $this->lowest_price = $newPrice;
        }

        $this->save();
    }

    /**
     * Get route display string
     */
    public function getRouteAttribute(): string
    {
        return "{$this->origin_code} → {$this->destination_code}";
    }

    /**
     * Get formatted departure date
     */
    public function getFormattedDepartureDateAttribute(): string
    {
        return $this->departure_date->format('M d, Y');
    }
}
