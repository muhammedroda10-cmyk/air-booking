<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class PromoCode extends Model
{
    protected $fillable = [
        'code',
        'description',
        'discount_type',
        'discount_value',
        'min_booking_amount',
        'max_discount',
        'valid_from',
        'valid_until',
        'usage_limit',
        'used_count',
        'applicable_to',
        'status',
    ];

    protected $casts = [
        'discount_value' => 'decimal:2',
        'min_booking_amount' => 'decimal:2',
        'max_discount' => 'decimal:2',
        'valid_from' => 'datetime',
        'valid_until' => 'datetime',
    ];

    public function usages(): HasMany
    {
        return $this->hasMany(PromoCodeUsage::class);
    }

    public function isValid(): bool
    {
        if ($this->status !== 'active') {
            return false;
        }

        $now = now();
        if ($now < $this->valid_from || $now > $this->valid_until) {
            return false;
        }

        if ($this->usage_limit && $this->used_count >= $this->usage_limit) {
            return false;
        }

        return true;
    }

    public function calculateDiscount(float $amount): float
    {
        if (!$this->isValid()) {
            return 0;
        }

        if ($amount < $this->min_booking_amount) {
            return 0;
        }

        if ($this->discount_type === 'percentage') {
            $discount = $amount * ($this->discount_value / 100);
        } else {
            $discount = $this->discount_value;
        }

        if ($this->max_discount && $discount > $this->max_discount) {
            $discount = $this->max_discount;
        }

        return min($discount, $amount);
    }
}
