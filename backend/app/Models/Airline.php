<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\MorphMany;

class Airline extends Model
{
    use HasFactory;
    
    protected $fillable = [
        'name',
        'code',
        'logo_url',
        'country',
        'cancel_full_refund_hours',
        'cancel_75_refund_hours',
        'cancel_50_refund_hours',
        'cancellation_fee',
    ];

    protected $casts = [
        'cancel_full_refund_hours' => 'integer',
        'cancel_75_refund_hours' => 'integer',
        'cancel_50_refund_hours' => 'integer',
        'cancellation_fee' => 'decimal:2',
    ];

    public function flights(): HasMany
    {
        return $this->hasMany(Flight::class);
    }

    public function reviews(): MorphMany
    {
        return $this->morphMany(Review::class, 'reviewable');
    }

    public function getAverageRatingAttribute(): ?float
    {
        $avg = $this->reviews()->approved()->avg('rating');
        return $avg ? round($avg, 1) : null;
    }

    public function getReviewsCountAttribute(): int
    {
        return $this->reviews()->approved()->count();
    }

    // Get cancellation policy as readable text
    public function getCancellationPolicyAttribute(): array
    {
        return [
            'full_refund' => [
                'hours' => $this->cancel_full_refund_hours,
                'days' => $this->cancel_full_refund_hours / 24,
                'description' => 'Full refund if cancelled more than ' . ($this->cancel_full_refund_hours / 24) . ' days before departure',
            ],
            'partial_75' => [
                'hours' => $this->cancel_75_refund_hours,
                'days' => $this->cancel_75_refund_hours / 24,
                'description' => '75% refund if cancelled ' . ($this->cancel_75_refund_hours / 24) . '-' . ($this->cancel_full_refund_hours / 24) . ' days before departure',
            ],
            'partial_50' => [
                'hours' => $this->cancel_50_refund_hours,
                'days' => $this->cancel_50_refund_hours / 24,
                'description' => '50% refund if cancelled ' . ($this->cancel_50_refund_hours / 24) . '-' . ($this->cancel_75_refund_hours / 24) . ' days before departure',
            ],
            'no_refund' => [
                'description' => 'No refund if cancelled less than ' . ($this->cancel_50_refund_hours / 24) . ' day before departure',
            ],
            'fee' => $this->cancellation_fee,
        ];
    }
}
